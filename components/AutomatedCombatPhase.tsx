import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import type { Player, Enemy, CombatOutcome, CombatLogEntry, StatusEffect, DamageNumberInfo, RunStats } from '../types';
import CharacterDisplay from './CharacterDisplay';
import CombatLog from './CombatLog';
import { Lock, Unlock } from 'lucide-react';

interface AutomatedCombatPhaseProps {
  player: Player;
  enemy: Enemy;
  setPlayerHealth: (hp: number) => void;
  setEnemyHealth: (hp: number) => void;
  setPlayerStatusEffects: React.Dispatch<React.SetStateAction<StatusEffect[]>>;
  setEnemyStatusEffects: React.Dispatch<React.SetStateAction<StatusEffect[]>>;
  onCombatEnd: (playerWon: boolean, finalLog: CombatLogEntry[], combatStats: Partial<RunStats>) => void;
  combatLog: CombatLogEntry[];
  currentNarrative: string;
  streamAndLogNarrative: (outcome: CombatOutcome) => Promise<void>;
  mapImageUrl: string | null;
  combatSpeed: number;
  setCombatSpeed: React.Dispatch<React.SetStateAction<number>>;
  isCombatSpeedLocked: boolean;
  setIsCombatSpeedLocked: React.Dispatch<React.SetStateAction<boolean>>;
}

type AnimationType = 'crit' | 'block' | 'double-strike';
type IntroState = 'initial' | 'player-entering' | 'enemy-entering' | 'complete';


type SlashEffectInfo = {
    direction: 'left-to-right' | 'right-to-left';
    isCrit: boolean;
};

// --- New Visual Effect Components ---

const SlashEffect: React.FC<{ effect: SlashEffectInfo | null }> = ({ effect }) => {
  if (!effect) return null;
  const isLtr = effect.direction === 'left-to-right';
  const critColor = "#facc15";
  const normalColor = "#FFFFFF";
  const color = effect.isCrit ? critColor : normalColor;

  return (
    <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none ${isLtr ? '' : 'transform -scale-x-100'}`}>
      <svg width="250" height="250" viewBox="0 0 100 100" className="slash-effect overflow-visible">
        <defs>
          <radialGradient id="slashGradient">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M 10 90 C 40 60, 60 40, 90 10" stroke={`url(#slashGradient)`} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 20 80 C 45 55, 65 35, 80 20" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" style={{ animationDelay: '0.05s' }}/>
      </svg>
    </div>
  );
};


const AutomatedCombatPhase: React.FC<AutomatedCombatPhaseProps> = ({
  player,
  enemy,
  setPlayerHealth,
  setEnemyHealth,
  setPlayerStatusEffects,
  setEnemyStatusEffects,
  onCombatEnd,
  combatLog,
  currentNarrative,
  streamAndLogNarrative,
  mapImageUrl,
  combatSpeed,
  setCombatSpeed,
  isCombatSpeedLocked,
  setIsCombatSpeedLocked,
}) => {
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [attackingCharacter, setAttackingCharacter] = useState<'player' | 'enemy' | null>(null);
  const [animationState, setAnimationState] = useState<{ target: 'player' | 'enemy', type: AnimationType } | null>(null);
  const [isCombatFinished, setIsCombatFinished] = useState(false);
  const [introState, setIntroState] = useState<IntroState>('initial');

  // New states for enhanced combat effects
  const [damageNumbers, setDamageNumbers] = useState<DamageNumberInfo[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [slashEffect, setSlashEffect] = useState<SlashEffectInfo | null>(null);
  const damageNumberIdCounter = useRef(0);
  const firstPlayerAttackHappened = useRef(false);
  
  const combatStatsRef = useRef<Partial<RunStats>>({
      damageDealt: 0,
      damageTaken: 0,
      criticalHits: 0,
      doubleStrikes: 0,
      attacksBlocked: 0,
  });

  const monsterAnimDuration = useMemo(() => {
    const baseDuration = 0.8; // seconds
    const healthRatio = Math.min(enemy.maxHealth, 1000) / 1000;
    const extraDuration = healthRatio * 1.5;
    return baseDuration + extraDuration;
  }, [enemy.maxHealth]);

  useEffect(() => {
    firstPlayerAttackHappened.current = false; // Reset on combat start
    const playerAnimDuration = 1200;
    const playerTimer = setTimeout(() => setIntroState('player-entering'), 100);
    const enemyTimer = setTimeout(() => setIntroState('enemy-entering'), 100 + playerAnimDuration);
    const completeTimer = setTimeout(() => setIntroState('complete'), 100 + playerAnimDuration + (monsterAnimDuration * 1000));
    return () => {
        clearTimeout(playerTimer);
        clearTimeout(enemyTimer);
        clearTimeout(completeTimer);
    };
  }, [monsterAnimDuration]);

  const triggerCharacterAnimation = (target: 'player' | 'enemy', type: AnimationType) => {
      setAnimationState({ target, type });
      setTimeout(() => setAnimationState(null), 600);
  };

  const addDamageNumber = (target: 'player' | 'enemy', amount: number, isCrit: boolean) => {
      const id = damageNumberIdCounter.current++;
      setDamageNumbers(prev => [...prev, { id, target, amount, isCrit }]);
      setTimeout(() => {
          setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
      }, 1300);
  };

  const triggerSlashEffect = (direction: 'left-to-right' | 'right-to-left', isCrit: boolean) => {
      setSlashEffect({ direction, isCrit });
      setTimeout(() => setSlashEffect(null), 350);
  };

  const triggerScreenShake = () => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
  };

  const toggleCombatSpeed = () => {
    setCombatSpeed(prev => (prev % 3) + 1);
  };

  const handleCombatEnd = useCallback((playerWon: boolean) => {
    if (isCombatFinished) return;
    setIsCombatFinished(true);

    if (playerWon) {
      onCombatEnd(true, combatLog, combatStatsRef.current);
    } else {
      setTimeout(() => onCombatEnd(false, combatLog, combatStatsRef.current), 3000);
    }
  }, [isCombatFinished, onCombatEnd, combatLog]);
  
  const handleAttack = useCallback((
    attacker: Player | Enemy, 
    defender: Player | Enemy, 
    isPlayerAttacking: boolean
  ): { totalDamage: number; outcome: CombatOutcome; isDoubleStrike: boolean } => {
    const didBlock = Math.random() * 100 < defender.blockChance;
    if (didBlock) {
      triggerCharacterAnimation(isPlayerAttacking ? 'enemy' : 'player', 'block');
      if (!isPlayerAttacking) { // Player blocked
          combatStatsRef.current.attacksBlocked = (combatStatsRef.current.attacksBlocked || 0) + 1;
      }
      const outcome: CombatOutcome = {
        actorName: attacker.name, targetName: defender.name, damage: 0, isPlayer: isPlayerAttacking,
        actorAttack: attacker.attack, targetDefense: defender.defense, didBlock: true,
      };
      return { totalDamage: 0, outcome, isDoubleStrike: false };
    }

    const isCrit = Math.random() * 100 < attacker.critChance;
    if (isCrit) {
        triggerCharacterAnimation(isPlayerAttacking ? 'enemy' : 'player', 'crit');
        triggerScreenShake();
    }
    triggerSlashEffect(isPlayerAttacking ? 'left-to-right' : 'right-to-left', isCrit);

    const critMultiplier = isCrit ? attacker.critDamage / 100 : 1;
    const rawDamage = attacker.attack * (1 - defender.defense / (defender.defense + 100));
    const variance = rawDamage * 0.15;
    const baseDamage = Math.floor(rawDamage + (Math.random() * variance * 2 - variance));
    const finalDamage = Math.max(1, Math.floor(baseDamage * critMultiplier));
    
    addDamageNumber(isPlayerAttacking ? 'enemy' : 'player', finalDamage, isCrit);

    if (isPlayerAttacking) {
        combatStatsRef.current.damageDealt = (combatStatsRef.current.damageDealt || 0) + finalDamage;
        if (isCrit) {
            combatStatsRef.current.criticalHits = (combatStatsRef.current.criticalHits || 0) + 1;
        }
    } else {
        combatStatsRef.current.damageTaken = (combatStatsRef.current.damageTaken || 0) + finalDamage;
    }

    let didProc: StatusEffect['type'] | undefined = undefined;
    const procEffect = isPlayerAttacking ? player.equipment.weapon?.procEffect : ('loot' in attacker && attacker.loot?.procEffect);
    if (procEffect && Math.random() * 100 < procEffect.chance) {
        didProc = procEffect.type;
        const setEffects = isPlayerAttacking ? setEnemyStatusEffects : setPlayerStatusEffects;
        setEffects(prev => {
            const existingEffect = prev.find(e => e.type === procEffect.type);
            if (existingEffect) {
                return prev.map(e => e.type === procEffect.type ? { ...e, duration: procEffect.duration } : e);
            }
            return [...prev, { type: procEffect.type, damage: procEffect.damage, duration: procEffect.duration }];
        });
    }

    const isForcedDoubleStrike = isPlayerAttacking && !firstPlayerAttackHappened.current && player.activeElixir?.type === 'GUARANTEED_DOUBLE_STRIKE_COMBAT';
    const isDoubleStrike = isForcedDoubleStrike || Math.random() * 100 < attacker.doubleStrikeChance;
    
    if (isPlayerAttacking) {
        firstPlayerAttackHappened.current = true;
    }

    const outcome: CombatOutcome = {
        actorName: attacker.name, targetName: defender.name, damage: finalDamage, isPlayer: isPlayerAttacking,
        actorAttack: attacker.attack, targetDefense: defender.defense, isCrit, didProc
    };

    return { totalDamage: finalDamage, outcome, isDoubleStrike };
  }, [player.equipment.weapon, player.activeElixir, setEnemyStatusEffects, setPlayerStatusEffects]);


  const performTurn = useCallback(async (isPlayerTurn: boolean): Promise<boolean> => {
    if (player.health <= 0 || enemy.health <= 0 || isCombatFinished) return true;

    const [attacker, defender, setDefenderHealth, setAttackerStatusEffects, newAttackerHealthSetter] = isPlayerTurn
      ? [player, enemy, setEnemyHealth, setPlayerStatusEffects, setPlayerHealth]
      : [enemy, player, setPlayerHealth, setEnemyStatusEffects, setEnemyHealth];

    let dotDamage = 0;
    let nextStatusEffects: StatusEffect[] = [];
    attacker.activeStatusEffects.forEach(effect => {
        dotDamage += effect.damage;
        if (effect.duration > 1) {
            nextStatusEffects.push({ ...effect, duration: effect.duration - 1 });
        }
    });
    setAttackerStatusEffects(nextStatusEffects);
    
    if (dotDamage > 0) {
        addDamageNumber(isPlayerTurn ? 'player' : 'enemy', dotDamage, false);
        const newAttackerHealth = Math.max(0, attacker.health - dotDamage);
        newAttackerHealthSetter(newAttackerHealth);
        if (newAttackerHealth <= 0) return true;
    }

    setAttackingCharacter(isPlayerTurn ? 'player' : 'enemy');
    
    let defenderCurrentHealth = defender.health;
    
    const { totalDamage, outcome, isDoubleStrike } = handleAttack(attacker, defender, isPlayerTurn);
    
    if (isDoubleStrike) {
        triggerCharacterAnimation(isPlayerTurn ? 'player' : 'enemy', 'double-strike');
        if (isPlayerTurn) {
            combatStatsRef.current.doubleStrikes = (combatStatsRef.current.doubleStrikes || 0) + 1;
        }
    }
    const numAttacks = isDoubleStrike ? 2 : 1;

    for (let i = 0; i < numAttacks; i++) {
        if (defenderCurrentHealth <= 0) break;

        const currentAttackDamage = i > 0 ? handleAttack(attacker, defender, isPlayerTurn).totalDamage : totalDamage;
        const finalOutcome = {...outcome, damage: currentAttackDamage, isDoubleStrike: i > 0};
        
        await streamAndLogNarrative(finalOutcome);
        
        if (!finalOutcome.didBlock) {
          defenderCurrentHealth = Math.max(0, defenderCurrentHealth - currentAttackDamage);
          setDefenderHealth(defenderCurrentHealth);
          if (defenderCurrentHealth <= 0) {
              setTimeout(() => setAttackingCharacter(null), 400);
              return true;
          }
        }
    }
    
    setTimeout(() => setAttackingCharacter(null), 400);
    return false;

  }, [player, enemy, setPlayerHealth, setEnemyHealth, handleAttack, streamAndLogNarrative, setPlayerStatusEffects, setEnemyStatusEffects, isCombatFinished]);

  const runCombatRound = useCallback(async () => {
    if (isCombatFinished) return;
    const combatEndedByPlayer = await performTurn(true);
    if (combatEndedByPlayer) {
      handleCombatEnd(true);
      return;
    }
    setTimeout(async () => {
      if (isCombatFinished) return;
      const combatEndedByEnemy = await performTurn(false);
      if (combatEndedByEnemy) {
        handleCombatEnd(false);
      }
    }, 1500 / combatSpeed);
  }, [performTurn, handleCombatEnd, combatSpeed, isCombatFinished]);


  useEffect(() => {
    if (isCombatFinished || introState !== 'complete') return;
    const combatInterval = setInterval(runCombatRound, 3500 / combatSpeed);
    return () => clearInterval(combatInterval);
  }, [runCombatRound, combatSpeed, isCombatFinished, introState]);

  const imgSrc = mapImageUrl && mapImageUrl.startsWith('http')
    ? mapImageUrl
    : mapImageUrl ? `data:image/png;base64,${mapImageUrl}` : null;
  
  const getPlayerIntroClass = () => introState === 'initial' ? 'opacity-0' : introState === 'player-entering' ? 'animate-walk-in-left' : 'opacity-100';
  const getEnemyIntroClass = () => (introState === 'initial' || introState === 'player-entering') ? 'opacity-0' : introState === 'enemy-entering' ? 'animate-glide-in-right' : 'opacity-100';


  return (
    <div className={`flex flex-col gap-6 animate-fadeIn relative ${isShaking ? 'animate-screen-shake' : ''}`}>
       {imgSrc && (
         <div className="absolute inset-0 -m-6 overflow-hidden -z-10">
            <img src={imgSrc} alt="Combat Background" className="w-full h-full object-cover blur-md scale-110" />
            <div className="absolute inset-0 bg-black/70"></div>
         </div>
       )}
       <div className="absolute top-0 right-0 flex items-center gap-2 z-10">
          <button
            onClick={toggleCombatSpeed}
            className="px-3 py-1 bg-gray-800/70 border border-purple-700/50 rounded-lg text-sm font-semibold text-purple-300 hover:bg-purple-900/80 transition-colors"
            title={`Current speed: ${combatSpeed}x`}
          >
            {combatSpeed}x Speed
          </button>
          <button
            onClick={() => setIsCombatSpeedLocked(prev => !prev)}
            className={`p-2 bg-gray-800/70 border border-purple-700/50 rounded-lg hover:bg-purple-900/80 transition-colors ${isCombatSpeedLocked ? 'text-yellow-400' : 'text-purple-300'}`}
            title={isCombatSpeedLocked ? "Unlock combat speed" : "Lock combat speed"}
            aria-label={isCombatSpeedLocked ? "Unlock combat speed" : "Lock combat speed"}
          >
            {isCombatSpeedLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end relative">
        <SlashEffect effect={slashEffect} />
        <div className={`relative flex justify-start ${introState !== 'complete' ? '' : 'transition-transform duration-300 ease-in-out'} ${getPlayerIntroClass()} ${attackingCharacter === 'player' ? 'scale-105 translate-x-8 z-10' : ''}`}>
          <CharacterDisplay 
            character={player} 
            isPlayer={true} 
            onShowAdvancedStats={() => setShowAdvancedStats(s => !s)}
            showAdvancedStats={showAdvancedStats}
            animation={animationState?.target === 'player' ? animationState.type : null}
            damageNumbers={damageNumbers.filter(dn => dn.target === 'player')}
          />
        </div>
        <div 
          className={`relative flex justify-end ${introState !== 'complete' ? '' : 'transition-transform duration-300 ease-in-out'} ${getEnemyIntroClass()} ${attackingCharacter === 'enemy' ? 'scale-105 -translate-x-8 z-10' : ''}`}
          style={{ animationDuration: `${monsterAnimDuration}s` }}
        >
          <CharacterDisplay 
            character={enemy} 
            animation={animationState?.target === 'enemy' ? animationState.type : null}
            damageNumbers={damageNumbers.filter(dn => dn.target === 'enemy')}
          />
        </div>
      </div>
      <CombatLog log={combatLog} currentNarrative={currentNarrative} />
    </div>
  );
};

export default AutomatedCombatPhase;