import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Enemy, Player, Item, JourneyEvent, Rarity, CombatLogEntry, StatusEffect, PathNode, JourneyNode, LootPhaseResult, ShopItem, JourneyEventOutcome, JourneyEventType, DilemmaChoice, RunStats, RunHistoryEntry, RunHistoryEntryType, CampState, CampUpgrades, PlayerAchievements, Achievement, TrackableStats, Elixir, TemporaryBuff, EchoingCairnChoice } from './types';
import { GameStateEnum } from './types';
import { PLAYER_INITIAL_STATE, RARITY_STAT_MODIFIERS, RARITY_ESSENCE_MAP, INITIAL_CAMP_STATE, UPGRADE_COSTS, ACHIEVEMENTS_DATA, getInitialPlayerAchievements, RARITY_RANK } from './constants';
import * as geminiService from './services/geminiService';
import * as mockService from './services/mockService';
import { generateNodes, calculateNextStep } from './utils/pathfinding';
import { GRID_HEIGHT, GRID_WIDTH } from './utils/pathfinding';
import AutomatedCombatPhase from './components/AutomatedCombatPhase';
import JourneyPhase from './components/JourneyPhase';
import LoadingPhase from './components/LoadingPhase';
import LootPhase from './components/LootPhase';
import JourneyEventPhase from './components/JourneyEventPhase';
import DeckOfWhispersPhase from './components/DeckOfWhispersPhase';
import GearChoicePhase from './components/GearChoicePhase';
import MerchantPhase from './components/MerchantPhase';
import DilemmaPhase from './components/DilemmaPhase';
import DilemmaResultPhase from './components/DilemmaResultPhase';
import CampPhase from './components/CampPhase';
import AchievementsPhase from './components/AchievementsPhase';
import EchoingCairnPhase from './components/EchoingCairnPhase';
import Toast from './components/Toast';
import { Trophy } from 'lucide-react';

const USE_AI = false; // <-- SET THIS TO true TO RE-ENABLE THE GEMINI API

const service = USE_AI ? geminiService : mockService;

const INITIAL_RUN_STATS: RunStats = {
  damageDealt: 0,
  damageTaken: 0,
  criticalHits: 0,
  doubleStrikes: 0,
  attacksBlocked: 0,
  enemiesDefeated: 0,
  itemsForged: 0,
  essenceSpent: 0,
  dilemmasFaced: 0,
};

// Helper function to calculate total stats from base and equipment
const calculateTotalStats = (player: Player): Player => {
    const totalStats = {
        ...PLAYER_INITIAL_STATE, // Start with base stats
        ...player, // Overlay current player state (like health, level, xp)
        attack: player.attack,
        defense: player.defense,
        critChance: player.critChance,
        critDamage: player.critDamage,
        doubleStrikeChance: player.doubleStrikeChance,
        blockChance: player.blockChance,
    };

    const equipment = Object.values(player.equipment).filter(item => item !== null) as Item[];

    for (const item of equipment) {
        totalStats.attack += item.attack || 0;
        totalStats.defense += item.defense || 0;
        totalStats.critChance += item.critChance || 0;
        totalStats.critDamage += item.critDamage || 0;
        totalStats.doubleStrikeChance += item.doubleStrikeChance || 0;
        totalStats.blockChance += item.blockChance || 0;
    }
    
    for (const buff of player.temporaryBuffs) {
        if (totalStats[buff.stat] !== undefined) {
            totalStats[buff.stat] += buff.value;
        }
    }

    if (player.activeElixir?.type === 'BONUS_DEFENSE_PERCENT_COMBAT') {
        const defenseBonus = Math.floor(totalStats.defense * (player.activeElixir.value / 100));
        totalStats.defense += defenseBonus;
    }

    return totalStats;
};


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameStateEnum>(GameStateEnum.JOURNEY);
  const [player, setPlayer] = useState<Player>(PLAYER_INITIAL_STATE);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [currentNarrative, setCurrentNarrative] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'achievement' } | null>(null);
  const [victories, setVictories] = useState(0);
  
  // Status Effects
  const [playerStatusEffects, setPlayerStatusEffects] = useState<StatusEffect[]>([]);
  const [enemyStatusEffects, setEnemyStatusEffects] = useState<StatusEffect[]>([]);

  // Journey state
  const [journeyNarrative, setJourneyNarrative] = useState("Your adventure begins...");
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [journeyEvent, setJourneyEvent] = useState<JourneyEvent | null>(null);
  const [journeyPath, setJourneyPath] = useState<PathNode[]>([]);
  const [nodes, setNodes] = useState<JourneyNode[]>([]);
  const [isJourneyPaused, setIsJourneyPaused] = useState(false);
  const [mouseInfluence, setMouseInfluence] = useState<'up' | 'down' | null>(null);

  // Ritual & Loot state
  const [itemForRitual, setItemForRitual] = useState<Omit<Item, 'rarity'> | null>(null);
  const [ritualSource, setRitualSource] = useState<'combat' | 'event' | null>(null);
  const [lastCombatResult, setLastCombatResult] = useState<LootPhaseResult>({ playerWon: false, xpGained: 0, itemDropped: null, levelUp: false });
  const [justReceivedTreasure, setJustReceivedTreasure] = useState(false);
  const [gearForChoice, setGearForChoice] = useState<{ equipped: Item; new: Item } | null>(null);
  const [dilemmaResult, setDilemmaResult] = useState<{ aftermath: string, outcome: JourneyEventOutcome } | null>(null);
  
  // Persisted Player Preferences
  const [autoEquip, setAutoEquip] = useState(() => {
    try {
        const saved = localStorage.getItem('autoEquip');
        return saved !== null ? JSON.parse(saved) : false;
    } catch { return false; }
  });
  const [combatSpeed, setCombatSpeed] = useState(() => {
    try {
        const saved = localStorage.getItem('combatSpeed');
        return saved !== null ? JSON.parse(saved) : 1;
    } catch { return 1; }
  });
  const [isCombatSpeedLocked, setIsCombatSpeedLocked] = useState(() => {
    try {
        const saved = localStorage.getItem('isCombatSpeedLocked');
        return saved !== null ? JSON.parse(saved) : false;
    } catch { return false; }
  });

  // Run summary state
  const [runStats, setRunStats] = useState<RunStats>(INITIAL_RUN_STATS);
  const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>([]);
  const runHistoryIdCounter = useRef(0);
  const [consecutiveTraps, setConsecutiveTraps] = useState(0);

  // Persisted Camp State
  const [campState, setCampState] = useState<CampState>(() => {
    try {
        const saved = localStorage.getItem('campState');
        return saved ? JSON.parse(saved) : INITIAL_CAMP_STATE;
    } catch { return INITIAL_CAMP_STATE; }
  });

  // Persisted Achievement State
  const [playerAchievements, setPlayerAchievements] = useState<PlayerAchievements>(() => {
      try {
          const saved = localStorage.getItem('playerAchievements');
          const parsed = saved ? JSON.parse(saved) : getInitialPlayerAchievements();
          // Data integrity check: add new achievements from constants if they don't exist in saved data
          const initialAchievements = getInitialPlayerAchievements();
          for (const key in initialAchievements) {
              if (!parsed[key]) {
                  parsed[key] = initialAchievements[key];
              }
          }
          return parsed;
      } catch { return getInitialPlayerAchievements(); }
  });
  const [achievementToastQueue, setAchievementToastQueue] = useState<Achievement[]>([]);
  const [isAchievementsVisible, setIsAchievementsVisible] = useState(false);

  const playerWithStats = useMemo(() => calculateTotalStats(player), [player]);

  const hasUnclaimedRewards = useMemo(() => {
    return Object.values(playerAchievements).some(ach => ach.unlockedTier > ach.claimedTier);
  }, [playerAchievements]);

  const headerGlowClass = useMemo(() => {
    if (victories >= 25) {
      return 'animate-header-glow-mythic';
    }
    if (victories >= 10) {
      return 'animate-header-glow-orange';
    }
    return 'animate-header-glow-purple';
  }, [victories]);

  const containerMaxWidthClass = useMemo(() => {
    switch (gameState) {
        case GameStateEnum.COMBAT:
        case GameStateEnum.GEAR_CHOICE:
        case GameStateEnum.DECK_OF_WHISPERS:
        case GameStateEnum.LOOT:
            return 'max-w-5xl';
        default:
            return 'max-w-7xl';
    }
  }, [gameState]);

  // Save preferences to localStorage whenever they change
  useEffect(() => { localStorage.setItem('autoEquip', JSON.stringify(autoEquip)); }, [autoEquip]);
  useEffect(() => { localStorage.setItem('combatSpeed', JSON.stringify(combatSpeed)); }, [combatSpeed]);
  useEffect(() => { localStorage.setItem('isCombatSpeedLocked', JSON.stringify(isCombatSpeedLocked)); }, [isCombatSpeedLocked]);
  useEffect(() => { localStorage.setItem('campState', JSON.stringify(campState)); }, [campState]);
  useEffect(() => { localStorage.setItem('playerAchievements', JSON.stringify(playerAchievements)); }, [playerAchievements]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'achievement' = 'info') => {
    setToast({ message, type });
  }, []);

  const addToHistory = useCallback((type: RunHistoryEntryType, description: string) => {
    setRunHistory(prev => [...prev, { id: runHistoryIdCounter.current++, type, description }]);
  }, []);

  const updateBuffs = useCallback(() => {
    setPlayer(prevPlayer => {
        if (prevPlayer.temporaryBuffs.length === 0) return prevPlayer;

        const expiredBuffs: string[] = [];
        const updatedBuffs = prevPlayer.temporaryBuffs
            .map(buff => {
                const newDuration = buff.duration - 1;
                if (newDuration <= 0) {
                    expiredBuffs.push(buff.stat.replace(/([A-Z])/g, ' $1'));
                }
                return { ...buff, duration: newDuration };
            })
            .filter(buff => buff.duration > 0);

        if (expiredBuffs.length > 0) {
            showToast(`Your ${expiredBuffs.join(', ')} buff has worn off.`, 'info');
        }
        
        return { ...prevPlayer, temporaryBuffs: updatedBuffs };
    });
  }, [showToast]);

  const handleUnlockAchievements = useCallback((stat: TrackableStats, value: number | Rarity) => {
    setPlayerAchievements(prev => {
        const newAchievements = JSON.parse(JSON.stringify(prev)); // Deep copy
        let achievementsUpdated = false;

        for (const achievement of ACHIEVEMENTS_DATA) {
            if (achievement.stat === stat) {
                const progress = newAchievements[achievement.id];
                if (!progress) continue;
                
                let valueChanged = false;

                if (typeof value === 'number') {
                    if (achievement.trackingType === 'highScore') {
                        if (value > progress.currentValue) {
                            progress.currentValue = value;
                            valueChanged = true;
                        }
                    } else { // cumulative
                        progress.currentValue += value;
                        valueChanged = true;
                    }
                } else {
                    const rarityValue = value as Rarity;
                    const rank = RARITY_RANK[rarityValue];
                    if ( (stat === 'uncommonForged' && rank >= 1) ||
                         (stat === 'rareForged' && rank >= 2) ||
                         (stat === 'epicForged' && rank >= 4) ||
                         (stat === 'legendaryForged' && rank >= 5) ||
                         (stat === 'mythicForged' && rank >= 6) ) 
                    {
                        progress.currentValue += 1;
                        valueChanged = true;
                    }
                }

                if (valueChanged) {
                    achievementsUpdated = true;
                    achievement.tiers.forEach((tier, index) => {
                        if (progress.currentValue >= tier.goal && index > progress.unlockedTier) {
                            progress.unlockedTier = index;
                            setAchievementToastQueue(q => [...q, achievement]);
                        }
                    });
                }
            }
        }
        return achievementsUpdated ? newAchievements : prev;
    });
  }, []);

  const handleEventOutcome = useCallback((outcome: JourneyEventOutcome) => {
      updateBuffs();
      if (journeyEvent?.type === 'trap' && outcome.healthChange < 0) {
          const newTrapCount = consecutiveTraps + 1;
          setConsecutiveTraps(newTrapCount);
          handleUnlockAchievements('trapsSurvived', 1);
          handleUnlockAchievements('consecutiveTraps', newTrapCount);
      } else if (journeyEvent?.type !== 'trap') {
          setConsecutiveTraps(0);
      }
      
      setPlayer(prevPlayer => {
          let newHealth = prevPlayer.health + outcome.healthChange;
          if (newHealth > prevPlayer.maxHealth) newHealth = prevPlayer.maxHealth;
          if (newHealth < 0) newHealth = 0;
  
          let newXp = prevPlayer.xp + outcome.xpGained;
          let newLevel = prevPlayer.level;
          let newXpToNextLevel = prevPlayer.xpToNextLevel;
          let levelUp = false;
          let newMaxHealth = prevPlayer.maxHealth;
  
          while (newXp >= newXpToNextLevel) {
              levelUp = true;
              newLevel += 1;
              newXp -= newXpToNextLevel;
              newXpToNextLevel = Math.floor(prevPlayer.xpToNextLevel * 1.5);
              newMaxHealth = Math.floor(prevPlayer.maxHealth * 1.2);
              addToHistory('level-up', `Reached Level ${newLevel}!`);
              showToast(`Level up! You are now level ${newLevel}!`, 'success');
          }
  
          if (levelUp) {
            newHealth = newMaxHealth; // Full heal on level up
          }

          if (outcome.healthChange > 0) showToast(`Healed for ${outcome.healthChange} HP!`, 'success');
          if (outcome.healthChange < 0) showToast(`Took ${Math.abs(outcome.healthChange)} damage!`, 'error');
          if (outcome.xpGained > 0) showToast(`Gained ${outcome.xpGained} XP!`, 'info');
  
          return {
              ...prevPlayer,
              health: newHealth,
              xp: newXp,
              level: newLevel,
              xpToNextLevel: newXpToNextLevel,
              maxHealth: newMaxHealth,
          };
      });
  
      if (outcome.itemDropped) {
          setItemForRitual(outcome.itemDropped);
          setRitualSource('event');
          setJustReceivedTreasure(true);
          setGameState(GameStateEnum.DECK_OF_WHISPERS);
      } else {
          setIsJourneyPaused(false);
      }
  }, [addToHistory, showToast, journeyEvent, handleUnlockAchievements, consecutiveTraps, updateBuffs]);
  
  const generateAndSetJourney = useCallback(async (currentVictories: number, playerLevel: number) => {
      try {
          const { narrative, mapPrompt } = await service.generateJourneyAssets(currentVictories, playerLevel);
          setJourneyNarrative(narrative);
          const newMapImageUrl = await service.generateMapImage(mapPrompt);
          setMapImageUrl(newMapImageUrl);
          const forceFirstNodePositive = player.activeElixir?.type === 'GUARANTEED_POSITIVE_EVENT';
          const generatedNodes = generateNodes(forceFirstNodePositive);
          setNodes(generatedNodes);
          setJourneyPath([{ x: 0, y: Math.floor(GRID_HEIGHT / 2) }]);
      } catch (error) {
          console.error("Failed to generate journey:", error);
          showToast("Failed to start journey. Using fallback.", "error");
          setMapImageUrl(''); 
          setNodes(generateNodes());
          setJourneyPath([{ x: 0, y: Math.floor(GRID_HEIGHT / 2) }]);
      }
  }, [showToast, player.activeElixir]);

  const startNewRun = useCallback(() => {
      setPlayer(PLAYER_INITIAL_STATE);
      setVictories(0);
      setJourneyPath([]);
      setNodes([]);
      setMapImageUrl(null);
      setJourneyNarrative("A new adventure begins...");
      setJustReceivedTreasure(false);
      setRunStats(INITIAL_RUN_STATS);
      setRunHistory([]);
      setConsecutiveTraps(0);
      runHistoryIdCounter.current = 0;
      generateAndSetJourney(0, 1);
      setGameState(GameStateEnum.JOURNEY);
  }, [generateAndSetJourney]);

  const handleNextJourneyStep = useCallback(() => {
      setJourneyPath(prevPath => {
          const currentPos = prevPath[prevPath.length - 1];
          if (currentPos.x >= GRID_WIDTH - 1) {
              setGameState(GameStateEnum.GENERATING_ENEMY);
              return prevPath;
          }

          const collidedNode = nodes.find(node => node.x === currentPos.x && node.y === currentPos.y);
          if (collidedNode) {
              if (player.activeElixir?.type === 'GUARANTEED_POSITIVE_EVENT') {
                  setPlayer(p => ({ ...p, activeElixir: null }));
                  showToast("Your Draught of Fortune-Seeker has been consumed.", 'info');
              }
              setIsJourneyPaused(true);
              setNodes(prevNodes => prevNodes.filter(n => n.id !== collidedNode.id));
              setGameState(GameStateEnum.GENERATING_EVENT);
              setJourneyEvent({ type: collidedNode.type, narrative: '' });
              return prevPath;
          }

          const nextStep = calculateNextStep(currentPos, mouseInfluence);
          return [...prevPath, nextStep];
      });
  }, [nodes, mouseInfluence, player.activeElixir, showToast]);

  const handleCombatEnd = useCallback((playerWon: boolean, finalLog: CombatLogEntry[], combatStats: Partial<RunStats>) => {
    setRunStats(prev => ({
        ...prev,
        damageDealt: prev.damageDealt + (combatStats.damageDealt || 0),
        damageTaken: prev.damageTaken + (combatStats.damageTaken || 0),
        criticalHits: prev.criticalHits + (combatStats.criticalHits || 0),
        doubleStrikes: prev.doubleStrikes + (combatStats.doubleStrikes || 0),
        attacksBlocked: prev.attacksBlocked + (combatStats.attacksBlocked || 0),
    }));

    if (playerWon) {
        updateBuffs();
        if (combatStats.damageTaken === 0) {
            handleUnlockAchievements('flawlessVictories', 1);
        }
        if (player.health / player.maxHealth <= 0.1) {
            handleUnlockAchievements('clutchVictories', 1);
        }
        handleUnlockAchievements('criticalHitsLanded', combatStats.criticalHits || 0);
        handleUnlockAchievements('doubleStrikesLanded', combatStats.doubleStrikes || 0);

        const xpGained = 50 + (enemy?.level || player.level) * 10;
        const essenceGained = 10 + Math.floor(Math.random() * 15);
        let xpBefore = player.xp;
        let newXp = player.xp + xpGained;
        let newLevel = player.level;
        let newXpToNextLevel = player.xpToNextLevel;
        let newMaxHealth = player.maxHealth;
        let levelUp = false;

        while (newXp >= newXpToNextLevel) {
            levelUp = true;
            newLevel++;
            newXp -= newXpToNextLevel;
            newXpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
            newMaxHealth = Math.floor(player.maxHealth * 1.2);
            addToHistory('level-up', `Reached Level ${newLevel}!`);
            showToast(`Level up! You are now level ${newLevel}!`, 'success');
        }
        
        const newVictories = victories + 1;
        setVictories(newVictories);
        setCampState(prev => ({...prev, totalVictories: prev.totalVictories + 1}));
        setRunStats(prev => ({...prev, enemiesDefeated: prev.enemiesDefeated + 1}));
        handleUnlockAchievements('enemiesDefeated', 1);
        handleUnlockAchievements('victoriesInRun', newVictories);
        addToHistory('victory', `Vanquished ${enemy?.name || 'a foe'}.`);

        setPlayer(prev => {
            let newActiveElixir = prev.activeElixir;
            if (newActiveElixir && (newActiveElixir.type === 'BONUS_DEFENSE_PERCENT_COMBAT' || newActiveElixir.type === 'GUARANTEED_DOUBLE_STRIKE_COMBAT')) {
                const newDuration = newActiveElixir.duration - 1;
                if (newDuration <= 0) {
                    newActiveElixir = null;
                    showToast("Your elixir's effect has worn off.", 'info');
                } else {
                    newActiveElixir = { ...newActiveElixir, duration: newDuration };
                }
            }
            return {
                ...prev,
                xp: newXp,
                level: newLevel,
                xpToNextLevel: newXpToNextLevel,
                maxHealth: newMaxHealth,
                health: levelUp ? newMaxHealth : prev.health, // Full heal on level up
                essence: prev.essence + essenceGained,
                activeElixir: newActiveElixir,
            };
        });

        const itemDropped = enemy?.loot ? { ...enemy.loot, rarity: 'Common' as Rarity } : null;
        setLastCombatResult({ playerWon, xpGained, itemDropped, levelUp, finalLog, xpBefore, xpAfter: newXp, xpToNextLevel: newXpToNextLevel, combatStats });

        if (itemDropped) {
            setItemForRitual(enemy.loot);
            setRitualSource('combat');
        }
        setGameState(GameStateEnum.LOOT);
    } else {
        setLastCombatResult({ playerWon, xpGained: 0, itemDropped: null, levelUp: false, finalLog, victoryCount: victories, runStats, runHistory });
        setGameState(GameStateEnum.LOOT);
    }
  }, [enemy, player, victories, addToHistory, runStats, runHistory, showToast, handleUnlockAchievements, updateBuffs]);

  const streamAndLogNarrative = useCallback(async (outcome: any) => {
    let fullMessage = '';
    const stream = service.streamCombatNarrative(outcome);
    for await (const chunk of stream) {
        fullMessage += chunk;
        setCurrentNarrative(fullMessage);
    }
    setCombatLog(prev => [...prev, { id: Date.now() + Math.random(), narrative: fullMessage, outcome }]);
    setCurrentNarrative('');
  }, []);

  const handleRitualComplete = useCallback((baseItem: Omit<Item, 'rarity'>, rarity: Rarity) => {
    const modifier = RARITY_STAT_MODIFIERS[rarity];
    const finalItem: Item = {
        ...baseItem,
        rarity: rarity,
        attack: Math.round((baseItem.attack || 0) * modifier),
        defense: Math.round((baseItem.defense || 0) * modifier),
        critChance: baseItem.critChance ? Math.round(baseItem.critChance * modifier) : undefined,
        critDamage: baseItem.critDamage ? Math.round(baseItem.critDamage * modifier) : undefined,
        doubleStrikeChance: baseItem.doubleStrikeChance ? Math.round(baseItem.doubleStrikeChance * modifier) : undefined,
        blockChance: baseItem.blockChance ? Math.round(baseItem.blockChance * modifier) : undefined,
    };
    
    handleUnlockAchievements('uncommonForged', rarity);
    handleUnlockAchievements('rareForged', rarity);
    handleUnlockAchievements('epicForged', rarity);
    handleUnlockAchievements('legendaryForged', rarity);
    handleUnlockAchievements('mythicForged', rarity);
    addToHistory('item-forged', `Forged a ${rarity} ${finalItem.name}.`);
    setRunStats(prev => ({...prev, itemsForged: prev.itemsForged + 1}));

    const equippedItem = player.equipment[finalItem.type];
    if (equippedItem) {
        setGearForChoice({ equipped: equippedItem, new: finalItem });
        setGameState(GameStateEnum.GEAR_CHOICE);
    } else {
        setPlayer(prev => ({
            ...prev,
            equipment: { ...prev.equipment, [finalItem.type]: finalItem }
        }));
        showToast(`Equipped ${finalItem.name}!`, 'success');
        if (ritualSource === 'combat') {
             setGameState(GameStateEnum.LOOT);
        } else {
             setIsJourneyPaused(false);
             setGameState(GameStateEnum.JOURNEY);
        }
    }
    setItemForRitual(null);
  }, [player.equipment, ritualSource, addToHistory, showToast, handleUnlockAchievements]);

  const handleGearChoice = useCallback((itemToKeep: Item, itemToDisenchant: Item) => {
    setPlayer(prev => ({
        ...prev,
        equipment: { ...prev.equipment, [itemToKeep.type]: itemToKeep }
    }));
    const essenceGained = RARITY_ESSENCE_MAP[itemToDisenchant.rarity] || 1;
    setPlayer(prev => ({ ...prev, essence: prev.essence + essenceGained }));
    showToast(`Kept ${itemToKeep.name}, gained ${essenceGained} essence from ${itemToDisenchant.name}.`, 'success');
    setGearForChoice(null);
    if (ritualSource === 'combat') {
        setGameState(GameStateEnum.LOOT);
    } else {
        setIsJourneyPaused(false);
        setGameState(GameStateEnum.JOURNEY);
    }
  }, [ritualSource, showToast]);

  const handlePurchase = useCallback((shopItem: ShopItem) => {
      if (player.essence < shopItem.cost) {
          showToast("Not enough Arcane Essence!", "error");
          return;
      }
      setPlayer(p => ({...p, essence: p.essence - shopItem.cost}));
      setRunStats(prev => ({...prev, essenceSpent: prev.essenceSpent + shopItem.cost}));

      if (shopItem.type === 'potion') {
          handleEventOutcome({ healthChange: shopItem.healthValue || 0, xpGained: 0, itemDropped: null });
          showToast(`Purchased ${shopItem.name}.`, 'success');
          // Remove from inventory
          setJourneyEvent(prev => prev ? {...prev, inventory: prev.inventory?.filter(i => i.id !== shopItem.id) } : null);
      } else if (shopItem.itemBase) {
          setItemForRitual(shopItem.itemBase);
          setRitualSource('event');
          setGameState(GameStateEnum.DECK_OF_WHISPERS);
      }
  }, [player.essence, handleEventOutcome, showToast]);

  const handleDilemmaResolve = useCallback((choice: DilemmaChoice) => {
      const rand = Math.random() * 100;
      let cumulativeChance = 0;
      const selectedOutcome = choice.possibleOutcomes.find(o => {
          cumulativeChance += o.chance;
          return rand <= cumulativeChance;
      }) || choice.possibleOutcomes[0]; // Failsafe

      addToHistory('event-dilemma-choice', `Dilemma: Chose to '${choice.text}'`);
      handleEventOutcome(selectedOutcome.outcome);
      setDilemmaResult({ aftermath: selectedOutcome.aftermath, outcome: selectedOutcome.outcome });
      setGameState(GameStateEnum.DILEMMA_RESULT);
  }, [handleEventOutcome, addToHistory]);

  const handleEchoingCairnResolve = useCallback((choice: EchoingCairnChoice) => {
    setPlayer(prev => ({
        ...prev,
        temporaryBuffs: [...prev.temporaryBuffs, choice.buff]
    }));
    showToast(`You recall '${choice.historyEntry.description}' and feel empowered!`, 'success');
    
    // This event counts as an encounter for buff duration
    updateBuffs();
    
    setIsJourneyPaused(false);
    setGameState(GameStateEnum.JOURNEY);
  }, [showToast, updateBuffs]);
  
  const handlePurchaseUpgrade = useCallback((upgrade: keyof CampUpgrades) => {
      const currentLevel = campState.upgrades[upgrade];
      const cost = UPGRADE_COSTS[upgrade][currentLevel];

      if (player.essence >= cost) {
          setPlayer(p => ({ ...p, essence: p.essence - cost }));
          setCampState(prev => ({
              ...prev,
              upgrades: {
                  ...prev.upgrades,
                  [upgrade]: currentLevel + 1,
              }
          }));
          showToast(`Upgraded ${String(upgrade).replace(/([A-Z])/g, ' $1')}!`, 'success');
      } else {
          showToast("Not enough Arcane Essence!", "error");
      }
  }, [player.essence, campState.upgrades, showToast]);

  const handleBrewElixir = useCallback((elixir: Elixir) => {
    if (player.essence < elixir.cost) {
        showToast("Not enough Arcane Essence!", "error");
        return;
    }
    if (player.activeElixir) {
        showToast("You already have an active elixir.", "error");
        return;
    }
    setPlayer(p => ({
        ...p,
        essence: p.essence - elixir.cost,
        activeElixir: { id: elixir.id, ...elixir.effect }
    }));
    showToast(`Brewed ${elixir.name}!`, 'success');
  }, [player.essence, player.activeElixir, showToast]);

  const handleExitCamp = useCallback((spentEssence: boolean) => {
      const healPercent = spentEssence ? 0.35 : 0.50;
      const healAmount = Math.floor(playerWithStats.maxHealth * healPercent);
      
      setPlayer(p => ({
          ...p,
          health: Math.min(p.maxHealth, p.health + healAmount)
      }));
      showToast(`Rested and healed for ${healAmount} HP!`, 'success');

      generateAndSetJourney(victories, player.level);
      setGameState(GameStateEnum.JOURNEY);
  }, [playerWithStats.maxHealth, player.level, victories, showToast, generateAndSetJourney]);

  const handleClaimReward = useCallback((achievementId: string, tierIndex: number) => {
    const achievementData = ACHIEVEMENTS_DATA.find(a => a.id === achievementId);
    if (!achievementData) return;

    const reward = achievementData.tiers[tierIndex].reward;

    setPlayer(prev => {
        let newPlayer = { ...prev };
        if (reward.type === 'xp') {
            let newXp = newPlayer.xp + reward.value;
            // Handle level ups from achievement XP
            while (newXp >= newPlayer.xpToNextLevel) {
                newPlayer.level += 1;
                newXp -= newPlayer.xpToNextLevel;
                newPlayer.xpToNextLevel = Math.floor(newPlayer.xpToNextLevel * 1.5);
                newPlayer.maxHealth = Math.floor(newPlayer.maxHealth * 1.2);
                newPlayer.health = newPlayer.maxHealth; // Full heal
                addToHistory('level-up', `Reached Level ${newPlayer.level}!`);
                showToast(`Level up! You are now level ${newPlayer.level}!`, 'success');
            }
            newPlayer.xp = newXp;
            showToast(`Gained ${reward.value} XP!`, 'info');
        } else if (reward.type === 'essence') {
            newPlayer.essence += reward.value;
            showToast(`Gained ${reward.value} Arcane Essence!`, 'success');
        }
        return newPlayer;
    });

    setPlayerAchievements(prev => {
        const newAchievements = { ...prev };
        newAchievements[achievementId].claimedTier = tierIndex;
        return newAchievements;
    });
  }, [showToast, addToHistory]);

    const handleClaimAllRewards = useCallback(() => {
        let totalXpGained = 0;
        let totalEssenceGained = 0;
        const newAchievements = JSON.parse(JSON.stringify(playerAchievements));
        let rewardsClaimed = false;

        for (const ach of ACHIEVEMENTS_DATA) {
            const progress = newAchievements[ach.id];
            if (progress.unlockedTier > progress.claimedTier) {
                rewardsClaimed = true;
                for (let i = progress.claimedTier + 1; i <= progress.unlockedTier; i++) {
                    const reward = ach.tiers[i].reward;
                    if (reward.type === 'xp') {
                        totalXpGained += reward.value;
                    } else if (reward.type === 'essence') {
                        totalEssenceGained += reward.value;
                    }
                }
                progress.claimedTier = progress.unlockedTier;
            }
        }
        
        if (rewardsClaimed) {
            setPlayer(prev => {
                let newPlayer = { ...prev };
                newPlayer.essence += totalEssenceGained;

                if (totalXpGained > 0) {
                    let newXp = newPlayer.xp + totalXpGained;
                    while (newXp >= newPlayer.xpToNextLevel) {
                        newPlayer.level += 1;
                        newXp -= newPlayer.xpToNextLevel;
                        newPlayer.xpToNextLevel = Math.floor(newPlayer.xpToNextLevel * 1.5);
                        newPlayer.maxHealth = Math.floor(newPlayer.maxHealth * 1.2);
                        newPlayer.health = newPlayer.maxHealth;
                        addToHistory('level-up', `Reached Level ${newPlayer.level}!`);
                        showToast(`Level up! You are now level ${newPlayer.level}!`, 'success');
                    }
                    newPlayer.xp = newXp;
                }
                return newPlayer;
            });

            setPlayerAchievements(newAchievements);
            const xpMessage = totalXpGained > 0 ? `${totalXpGained} XP` : '';
            const essenceMessage = totalEssenceGained > 0 ? `${totalEssenceGained} Essence` : '';
            const separator = xpMessage && essenceMessage ? ' and ' : '';
            showToast(`Claimed ${xpMessage}${separator}${essenceMessage}!`, 'success');
        }
    }, [playerAchievements, showToast, addToHistory]);

  useEffect(() => {
    if (journeyPath.length === 0) {
      generateAndSetJourney(victories, player.level);
    }
  }, [journeyPath.length, victories, player.level, generateAndSetJourney]);

  useEffect(() => {
    const handleAsyncState = async () => {
        if (gameState === GameStateEnum.GENERATING_ENEMY) {
            try {
                const enemyData = await service.generateEnemy(victories, playerWithStats.level, justReceivedTreasure);
                const enemyImage = USE_AI ? await service.generateEnemyImage(enemyData.description) : null;
                setEnemy({ ...enemyData, health: enemyData.maxHealth, imageBase64: enemyImage || '' });
                setCombatLog([]);
                setPlayerStatusEffects([]);
                setEnemyStatusEffects([]);
                setGameState(GameStateEnum.COMBAT);
                setJustReceivedTreasure(false);
            } catch (error) {
                console.error("Failed to generate enemy:", error);
                showToast("Enemy generation failed. Trying again.", "error");
                setGameState(GameStateEnum.JOURNEY);
            }
        }
        if (gameState === GameStateEnum.GENERATING_EVENT && journeyEvent) {
             try {
                const eventData = await service.generateJourneyEvent(playerWithStats.level, victories, journeyEvent.type);

                if (eventData.type === 'merchant') {
                    setJourneyEvent(eventData);
                    setGameState(GameStateEnum.MERCHANT);
                } else if (eventData.type === 'dilemma') {
                    setJourneyEvent(eventData);
                    setRunStats(prev => ({...prev, dilemmasFaced: prev.dilemmasFaced + 1}));
                    setGameState(GameStateEnum.DILEMMA);
                } else if (eventData.type === 'echoing_cairn') {
                    const significantHistory = runHistory.filter(h => ['victory', 'level-up', 'item-forged'].includes(h.type)).slice(-5);
                    const choices: EchoingCairnChoice[] = [];
                    const shuffledHistory = [...significantHistory].sort(() => 0.5 - Math.random());
                    
                    for (const entry of shuffledHistory) {
                        if (choices.length >= 3) break;
                        let buff: TemporaryBuff | null = null;
                        switch (entry.type) {
                            case 'victory':
                                buff = { source: 'Echoing Cairn', stat: 'attack', value: 5, duration: 2 };
                                break;
                            case 'level-up':
                                buff = { source: 'Echoing Cairn', stat: 'critChance', value: 5, duration: 2 };
                                break;
                            case 'item-forged':
                                buff = { source: 'Echoing Cairn', stat: 'defense', value: 5, duration: 2 };
                                break;
                        }
                        if (buff && !choices.some(c => c.buff.stat === buff!.stat)) { // Avoid duplicate buff types
                            choices.push({ historyEntry: entry, buff });
                        }
                    }
                    
                    if (choices.length > 0) {
                        eventData.choices = choices;
                        setJourneyEvent(eventData);
                        setGameState(GameStateEnum.ECHOING_CAIRN);
                    } else {
                        eventData.type = 'discovery';
                        eventData.narrative = "You find an ancient, weathered stone. It seems dormant for now.";
                        eventData.outcome = { xpGained: 50, healthChange: 0, itemDropped: null };
                        addToHistory('event-discovery', eventData.narrative);
                        setJourneyEvent(eventData);
                        setGameState(GameStateEnum.JOURNEY_EVENT);
                    }
                } else {
                    setJourneyEvent(eventData);
                    addToHistory(`event-${eventData.type}` as RunHistoryEntryType, eventData.narrative);
                    setGameState(GameStateEnum.JOURNEY_EVENT);
                }
             } catch (error) {
                console.error("Failed to generate event:", error);
                showToast("Event generation failed. Continuing journey.", "error");
                setIsJourneyPaused(false);
                setGameState(GameStateEnum.JOURNEY);
             }
        }
    };
    handleAsyncState();
  }, [gameState, victories, playerWithStats.level, justReceivedTreasure, journeyEvent, addToHistory, showToast, runHistory]);

  const renderGameState = () => {
    switch (gameState) {
      case GameStateEnum.JOURNEY:
        return <JourneyPhase
                  player={playerWithStats}
                  narrative={journeyNarrative}
                  mapImageUrl={mapImageUrl}
                  victories={victories}
                  path={journeyPath}
                  nodes={nodes}
                  isPaused={isJourneyPaused}
                  onNextStep={handleNextJourneyStep}
                  onSetMouseInfluence={setMouseInfluence}
               />;
      case GameStateEnum.GENERATING_ENEMY:
      case GameStateEnum.GENERATING_EVENT:
        return <LoadingPhase />;
      case GameStateEnum.JOURNEY_EVENT:
        return journeyEvent && journeyEvent.outcome ? <JourneyEventPhase event={journeyEvent} onContinue={() => {
            handleEventOutcome(journeyEvent.outcome!);
            setGameState(GameStateEnum.JOURNEY);
        }} /> : <LoadingPhase />;
      case GameStateEnum.DILEMMA:
          return journeyEvent ? <DilemmaPhase event={journeyEvent} onResolve={handleDilemmaResolve} /> : <LoadingPhase />;
      case GameStateEnum.DILEMMA_RESULT:
          return dilemmaResult ? <DilemmaResultPhase result={dilemmaResult} onContinue={() => {
              setDilemmaResult(null);
              setIsJourneyPaused(false);
              setGameState(GameStateEnum.JOURNEY);
          }} /> : <LoadingPhase />;
      case GameStateEnum.ECHOING_CAIRN:
          return journeyEvent ? <EchoingCairnPhase event={journeyEvent} onResolve={handleEchoingCairnResolve} /> : <LoadingPhase />;
      case GameStateEnum.MERCHANT:
          return journeyEvent ? <MerchantPhase
            player={playerWithStats}
            event={journeyEvent}
            onPurchase={handlePurchase}
            onExit={() => { setIsJourneyPaused(false); setGameState(GameStateEnum.JOURNEY); }}
          /> : <LoadingPhase />;
      case GameStateEnum.CAMP:
        return <CampPhase
            player={playerWithStats}
            campState={campState}
            onPurchaseUpgrade={handlePurchaseUpgrade}
            onBrewElixir={handleBrewElixir}
            onExit={handleExitCamp}
        />;
      case GameStateEnum.COMBAT:
        return enemy ? (
          <AutomatedCombatPhase
            player={playerWithStats}
            enemy={enemy}
            setPlayerHealth={(hp) => setPlayer(p => ({ ...p, health: hp }))}
            setEnemyHealth={(hp) => setEnemy(e => e ? { ...e, health: hp } : null)}
            setPlayerStatusEffects={setPlayerStatusEffects}
            setEnemyStatusEffects={setEnemyStatusEffects}
            onCombatEnd={handleCombatEnd}
            combatLog={combatLog}
            currentNarrative={currentNarrative}
            streamAndLogNarrative={streamAndLogNarrative}
            mapImageUrl={mapImageUrl}
            combatSpeed={combatSpeed}
            setCombatSpeed={setCombatSpeed}
            isCombatSpeedLocked={isCombatSpeedLocked}
            setIsCombatSpeedLocked={setIsCombatSpeedLocked}
          />
        ) : <LoadingPhase />;
      case GameStateEnum.DECK_OF_WHISPERS:
        return itemForRitual ? <DeckOfWhispersPhase item={itemForRitual} onComplete={handleRitualComplete} /> : <LoadingPhase />;
      case GameStateEnum.GEAR_CHOICE:
        return gearForChoice ? <GearChoicePhase equippedItem={gearForChoice.equipped} newItem={gearForChoice.new} onChoice={handleGearChoice} autoEquip={autoEquip} setAutoEquip={setAutoEquip} /> : <LoadingPhase />;
      case GameStateEnum.LOOT:
        return <LootPhase
                  result={lastCombatResult}
                  onContinue={() => {
                      if (lastCombatResult.playerWon) {
                          if (itemForRitual) {
                            setGameState(GameStateEnum.DECK_OF_WHISPERS);
                          } else {
                            const shouldGoToCamp = (victories > 0 && victories % 3 === 0);
                            if (shouldGoToCamp) {
                                setGameState(GameStateEnum.CAMP);
                            } else {
                                generateAndSetJourney(victories, player.level);
                                setGameState(GameStateEnum.JOURNEY);
                            }
                          }
                      } else {
                          startNewRun();
                      }
                  }}
                  enemyName={enemy?.name || 'a foul beast'}
               />;
      default:
        return <div>Unknown game state</div>;
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <main className={`w-full ${containerMaxWidthClass} bg-black/20 rounded-xl shadow-2xl shadow-purple-900/20 border border-purple-800/20 p-6 relative mt-16 transition-all duration-500`}>
         <header className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-lg flex items-center justify-center pointer-events-none z-10">
            <div className="flex-1"></div>
            <img
                src="https://astriloot.com/assets/astriloot-name.png"
                alt="Astriloot"
                className={`w-full max-w-md h-auto transition-all duration-1000 ${headerGlowClass}`}
            />
             <div className="flex-1 flex justify-start pointer-events-auto">
                 <button onClick={() => setIsAchievementsVisible(true)} className="p-2 text-gray-400 hover:text-yellow-300 transition-colors ml-4" title="Achievements">
                    <div className={`relative ${hasUnclaimedRewards ? 'animate-pulse-glow-gold' : ''}`}>
                        <Trophy className="w-8 h-8" />
                        {hasUnclaimedRewards && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-gray-900" />}
                    </div>
                </button>
             </div>
         </header>
        {renderGameState()}
        {isAchievementsVisible && (
          <AchievementsPhase
            playerAchievements={playerAchievements}
            onClaimReward={handleClaimReward}
            onClaimAllRewards={handleClaimAllRewards}
            hasUnclaimedRewards={hasUnclaimedRewards}
            onExit={() => setIsAchievementsVisible(false)}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {achievementToastQueue.length > 0 && (
          <Toast
              key={achievementToastQueue[0].id}
              message={`Unlocked: ${achievementToastQueue[0].name}`}
              type="achievement"
              onClose={() => setAchievementToastQueue(q => q.slice(1))}
          />
        )}
      </main>
    </div>
  );
};

export default App;