






import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Enemy, Player, Item, JourneyEvent, Rarity, CombatLogEntry, StatusEffect, PathNode, JourneyNode, LootPhaseResult, ShopItem, JourneyEventOutcome, JourneyEventType, DilemmaChoice, RunStats, RunHistoryEntry, RunHistoryEntryType, CampState, CampUpgrades, PlayerAchievements, Achievement, TrackableStats, Elixir, TemporaryBuff, EchoingCairnChoice, Equipment, Enchant, Gem, Socket, CharacterData, ActiveElixirEffect } from './types';
import { GameStateEnum } from './types';
import { RARITY_STAT_MODIFIERS, RARITY_ESSENCE_MAP, INITIAL_CAMP_STATE, UPGRADE_COSTS, ACHIEVEMENTS_DATA, getInitialPlayerAchievements, RARITY_RANK, ENCHANT_COST_MODIFIERS } from './constants';
import * as geminiService from './services/geminiService';
import * as mockService from './services/mockService';
import { generateNodes, calculateNextStep } from './utils/pathfinding';
import { GRID_HEIGHT, GRID_WIDTH } from './utils/pathfinding';
import CharacterSelectionPhase from './components/CharacterSelectionPhase';
import AutomatedCombatPhase from './components/AutomatedCombatPhase';
import JourneyPhase from './components/JourneyPhase';
import LoadingPhase from './components/LoadingPhase';
import LootPhase from './components/LootPhase';
import ArtifactRevealPhase from './components/ArtifactRevealPhase';
import JourneyEventPhase from './components/JourneyEventPhase';
import DeckOfWhispersPhase from './components/DeckOfWhispersPhase';
import GearChoicePhase from './components/GearChoicePhase';
import MerchantPhase from './components/MerchantPhase';
import DilemmaPhase from './components/DilemmaPhase';
import DilemmaResultPhase from './components/DilemmaResultPhase';
import CampPhase from './components/CampPhase';
import AchievementsPhase from './components/AchievementsPhase';
import EchoingCairnPhase from './components/EchoingCairnPhase';
import EnchantingPhase from './components/EnchantingPhase';
import GemSocketingPhase from './components/GemSocketingPhase';
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

interface MetaProgress {
  essence: number;
  vas: number;
  enchants: Enchant[];
  gems: Gem[];
}


// Helper function to calculate total stats from base and equipment
const calculateTotalStats = (player: Player): Player => {
    // Create a mutable copy of the player object to hold the calculated stats.
    // This preserves non-stat properties like name, level, health, etc.
    const calculatedPlayer = { ...player };

    // Get all equipped items.
    const equipment = Object.values(player.equipment).filter(Boolean) as Item[];

    for (const item of equipment) {
        calculatedPlayer.attack += item.attack || 0;
        calculatedPlayer.defense += item.defense || 0;
        calculatedPlayer.critChance += item.critChance || 0;
        calculatedPlayer.critDamage += item.critDamage || 0;
        calculatedPlayer.doubleStrikeChance += item.doubleStrikeChance || 0;
        calculatedPlayer.blockChance += item.blockChance || 0;

        // Add stats from enchants on the item.
        if (item.enchant) {
            for (const effect of item.enchant.effects) {
                if (effect.stat !== 'vampiric' && calculatedPlayer[effect.stat] !== undefined) {
                    calculatedPlayer[effect.stat] += effect.value;
                }
            }
        }
        
        // Add stats from gems socketed in the item.
        if (item.sockets) {
            for (const socket of item.sockets) {
                if (socket.gem) {
                    for (const effect of socket.gem.effects) {
                         if (calculatedPlayer[effect.stat] !== undefined) {
                            calculatedPlayer[effect.stat] += effect.value;
                        }
                    }
                }
            }
        }
    }
    
    // Add stats from temporary buffs.
    for (const buff of player.temporaryBuffs) {
        if (calculatedPlayer[buff.stat] !== undefined) {
            calculatedPlayer[buff.stat] += buff.value;
        }
    }

    // Apply percentage-based effects from elixirs.
    if (player.activeElixir?.type === 'BONUS_DEFENSE_PERCENT_COMBAT') {
        const defenseBonus = Math.floor(calculatedPlayer.defense * (player.activeElixir.value / 100));
        calculatedPlayer.defense += defenseBonus;
    }

    return calculatedPlayer;
};


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameStateEnum>(GameStateEnum.CHARACTER_SELECT);
  const [player, setPlayer] = useState<Player | null>(null);
  const [metaProgress, setMetaProgress] = useState<MetaProgress | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [currentNarrative, setCurrentNarrative] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'achievement' } | null>(null);
  const [victories, setVictories] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  
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
  const [revealedArtifact, setRevealedArtifact] = useState<Item | null>(null);
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

  const playerWithStats = useMemo(() => player ? calculateTotalStats(player) : null, [player]);

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
        case GameStateEnum.CHARACTER_SELECT:
            return 'max-w-4xl';
        case GameStateEnum.COMBAT:
        case GameStateEnum.GEAR_CHOICE:
        case GameStateEnum.DECK_OF_WHISPERS:
        case GameStateEnum.ARTIFACT_REVEAL:
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
        if (!prevPlayer || prevPlayer.temporaryBuffs.length === 0) return prevPlayer;

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
          if (!prevPlayer) return null;
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
              newXpToNextLevel = Math.floor(prevPlayer.xpToNextLevel * 1.35);
              newMaxHealth = Math.floor(prevPlayer.maxHealth * 1.15);
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
      }

      if (outcome.enchantDropped) {
        setPlayer(prev => prev ? ({...prev, enchants: [...prev.enchants, outcome.enchantDropped!] }) : null);
        showToast(`Received Enchant: ${outcome.enchantDropped.name}!`, 'success');
      }
      if (outcome.gemsDropped) {
        setPlayer(prev => prev ? ({...prev, gems: [...prev.gems, ...outcome.gemsDropped!] }) : null);
        showToast(`Found Gem: ${outcome.gemsDropped.map(g => g.name).join(', ')}!`, 'success');
      }
  }, [addToHistory, showToast, journeyEvent, handleUnlockAchievements, consecutiveTraps, updateBuffs]);
  
  const generateAndSetJourney = useCallback(async (currentVictories: number, playerLevel: number, activeElixir: ActiveElixirEffect | null) => {
      try {
          const { narrative, mapPrompt } = await service.generateJourneyAssets(currentVictories, playerLevel);
          setJourneyNarrative(narrative);
          const newMapImageUrl = await service.generateMapImage(mapPrompt);
          setMapImageUrl(newMapImageUrl);
          const forceFirstNodePositive = activeElixir?.type === 'GUARANTEED_POSITIVE_EVENT';
          const generatedNodes = generateNodes(forceFirstNodePositive);
          setNodes(generatedNodes);
          setJourneyPath([{ x: 0, y: Math.floor(GRID_HEIGHT / 2) }]);
      } catch (error) {
          console.error("Failed to generate journey:", error);
          showToast("Failed to start journey. Using fallback.", "error");
          setMapImageUrl(null); 
          setNodes(generateNodes());
          setJourneyPath([{ x: 0, y: Math.floor(GRID_HEIGHT / 2) }]);
      }
  }, [showToast]);

  const startNewRun = useCallback(() => {
      if (!player) return;
      const vasAfterPenalty = Math.floor(player.vas * 0.85); // Reduced from 20% to 15%
      showToast(`Your journey ends... You lost ${player.vas - vasAfterPenalty} Vas.`, 'error');
      
      setMetaProgress({
          essence: player.essence,
          vas: vasAfterPenalty,
          enchants: player.enchants,
          gems: player.gems,
      });

      setPlayer(null);
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
      setGameState(GameStateEnum.CHARACTER_SELECT);
  }, [player, showToast]);

  const handleCharacterSelect = useCallback((character: CharacterData) => {
    const initialState = {
        ...character.initialState,
        essence: metaProgress?.essence || character.initialState.essence,
        vas: metaProgress?.vas || character.initialState.vas,
        enchants: metaProgress?.enchants || character.initialState.enchants,
        gems: metaProgress?.gems || character.initialState.gems,
    };

    setPlayer(initialState);
    setMetaProgress(null);

    setJourneyPath([]);
    setNodes([]);
    setMapImageUrl(null);
    setJourneyNarrative("A new adventure begins...");
    setJustReceivedTreasure(false);
    setRunStats(INITIAL_RUN_STATS);
    setRunHistory([]);
    setConsecutiveTraps(0);
    runHistoryIdCounter.current = 0;

    generateAndSetJourney(0, 1, initialState.activeElixir);
    setGameState(GameStateEnum.JOURNEY);
  }, [metaProgress, generateAndSetJourney]);

  const handleNextJourneyStep = useCallback(() => {
      if (!player) return;
      setJourneyPath(prevPath => {
          const currentPos = prevPath[prevPath.length - 1];
          if (currentPos.x >= GRID_WIDTH - 1) {
              setGameState(GameStateEnum.GENERATING_ENEMY);
              return prevPath;
          }

          const collidedNode = nodes.find(node => node.x === currentPos.x && node.y === currentPos.y);
          if (collidedNode) {
              if (player.activeElixir?.type === 'GUARANTEED_POSITIVE_EVENT') {
                  setPlayer(p => p ? ({ ...p, activeElixir: null }) : null);
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
  }, [nodes, mouseInfluence, player, showToast]);

  const handleCombatEnd = useCallback((playerWon: boolean, finalLog: CombatLogEntry[], combatStats: Partial<RunStats>) => {
    if (!player) return;
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
        const essenceGained = 5 + Math.floor(Math.random() * 10) + (enemy?.level || player.level);
        const vasGained = enemy?.vasDropped || 0;
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
            newXpToNextLevel = Math.floor(player.xpToNextLevel * 1.35);
            newMaxHealth = Math.floor(player.maxHealth * 1.15);
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
            if (!prev) return null;
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
                vas: prev.vas + vasGained,
                activeElixir: newActiveElixir,
            };
        });

        const itemDropped: Item | null = enemy?.loot ? { ...enemy.loot, rarity: 'Common' as Rarity, imageBase64: null } : null;
        const enchantDropped = enemy?.enchantDropped || null;
        const gemsDropped = enemy?.gemsDropped || null;

        if (enchantDropped) {
             setPlayer(prev => prev ? ({...prev, enchants: [...prev.enchants, enchantDropped] }) : null);
        }
        if (gemsDropped) {
             setPlayer(prev => prev ? ({...prev, gems: [...prev.gems, ...gemsDropped] }) : null);
        }

        setLastCombatResult({ playerWon, xpGained, itemDropped, enchantDropped, gemsDropped, levelUp, finalLog, xpBefore, xpAfter: newXp, xpToNextLevel: newXpToNextLevel, combatStats });

        if (itemDropped) {
            setItemForRitual(enemy.loot);
            setRitualSource('combat');
            setGameState(GameStateEnum.DECK_OF_WHISPERS);
        } else {
            setGameState(GameStateEnum.LOOT);
        }
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

  const handleRitualComplete = useCallback(async (baseItem: Omit<Item, 'rarity'>, rarity: Rarity) => {
    if (!player) return;

    const modifier = RARITY_STAT_MODIFIERS[rarity];
    const itemWithoutImage: Item = {
        ...baseItem,
        rarity: rarity,
        attack: Math.round((baseItem.attack || 0) * modifier),
        defense: Math.round((baseItem.defense || 0) * modifier),
        critChance: baseItem.critChance ? Math.round(baseItem.critChance * modifier) : undefined,
        critDamage: baseItem.critDamage ? Math.round(baseItem.critDamage * modifier) : undefined,
        doubleStrikeChance: baseItem.doubleStrikeChance ? Math.round(baseItem.doubleStrikeChance * modifier) : undefined,
        blockChance: baseItem.blockChance ? Math.round(baseItem.blockChance * modifier) : undefined,
    };
    
    setIsLoading(true);
    setLoadingMessage("Forging the artifact's likeness...");

    let finalItem: Item;
    try {
        const imageBase64 = await service.generateItemImage(itemWithoutImage);
        finalItem = { ...itemWithoutImage, imageBase64 };
    } catch (error) {
        console.error("Failed to generate item image:", error);
        showToast("Failed to forge item's image, continuing without it.", "error");
        finalItem = { ...itemWithoutImage, imageBase64: null };
    }
    
    setIsLoading(false);
    setLoadingMessage(null);

    handleUnlockAchievements('uncommonForged', rarity);
    handleUnlockAchievements('rareForged', rarity);
    handleUnlockAchievements('epicForged', rarity);
    handleUnlockAchievements('legendaryForged', rarity);
    handleUnlockAchievements('mythicForged', rarity);
    addToHistory('item-forged', `Forged a ${rarity} ${finalItem.name}.`);
    setRunStats(prev => ({...prev, itemsForged: prev.itemsForged + 1}));

    setItemForRitual(null);
    setRevealedArtifact(finalItem);
    setGameState(GameStateEnum.ARTIFACT_REVEAL);
  }, [player, addToHistory, showToast, handleUnlockAchievements]);

  const handleArtifactRevealContinue = useCallback((revealedItem: Item) => {
    if (!player) return;

    setRevealedArtifact(null);

    if (ritualSource === 'combat') {
        setLastCombatResult(prev => ({
            ...prev,
            itemDropped: revealedItem
        }));
        setGameState(GameStateEnum.LOOT);
    } else { // From event
        const equippedItem = player.equipment[revealedItem.type];
        if (equippedItem) {
            setGearForChoice({ equipped: equippedItem, new: revealedItem });
            setGameState(GameStateEnum.GEAR_CHOICE);
        } else {
            setPlayer(prev => {
                if (!prev) return null;
                return { ...prev, equipment: { ...prev.equipment, [revealedItem.type]: revealedItem } };
            });
            showToast(`Equipped ${revealedItem.name}!`, 'success');
            setIsJourneyPaused(false);
            setGameState(GameStateEnum.JOURNEY);
        }
    }
  }, [player, ritualSource, showToast]);

  const handleGearChoice = useCallback((itemToKeep: Item, itemToDisenchant: Item) => {
    if (!player) return;
    setPlayer(prev => {
        if (!prev) return null;
        return {
            ...prev,
            equipment: { ...prev.equipment, [itemToKeep.type]: itemToKeep }
        }
    });
    const essenceGained = RARITY_ESSENCE_MAP[itemToDisenchant.rarity] || 1;
    setPlayer(prev => prev ? ({ ...prev, essence: prev.essence + essenceGained }) : null);
    showToast(`Kept ${itemToKeep.name}, gained ${essenceGained} essence from ${itemToDisenchant.name}.`, 'success');
    setGearForChoice(null);
    
    const currentPos = journeyPath[journeyPath.length - 1];
    if (currentPos && currentPos.x >= GRID_WIDTH - 1) {
        generateAndSetJourney(victories, player.level, player.activeElixir);
        setGameState(GameStateEnum.JOURNEY);
        return;
    }

    if (victories > 0 && victories % 5 === 0) {
        setGameState(GameStateEnum.CAMP);
    } else {
        setIsJourneyPaused(false);
        setGameState(GameStateEnum.JOURNEY);
    }
  }, [showToast, journeyPath, victories, player, generateAndSetJourney]);

  const handlePurchase = useCallback((shopItem: ShopItem) => {
      if (!player) return;
      const aeCost = shopItem.price.ae || 0;
      const vasCost = shopItem.price.vas || 0;

      if (player.essence < aeCost || player.vas < vasCost) {
          showToast("Insufficient funds!", "error");
          return;
      }

      setPlayer(p => {
          if (!p) return null;
          return {
            ...p,
            essence: p.essence - aeCost,
            vas: p.vas - vasCost,
          }
      });

      if (aeCost > 0) {
        setRunStats(prev => ({...prev, essenceSpent: prev.essenceSpent + aeCost}));
      }

      let purchased = false;
      if (shopItem.type === 'potion') {
          handleEventOutcome({ healthChange: shopItem.healthValue || 0, xpGained: 0, itemDropped: null });
          purchased = true;
      } else if (shopItem.type === 'gem' && shopItem.gem) {
          setPlayer(p => p ? ({ ...p, gems: [...p.gems, shopItem.gem!] }) : null);
          purchased = true;
      } else if (shopItem.itemBase) {
          setItemForRitual(shopItem.itemBase);
          setRitualSource('event');
          setGameState(GameStateEnum.DECK_OF_WHISPERS);
          return; // Don't remove from inventory yet, ritual handles it
      }

      if (purchased) {
          showToast(`Purchased ${shopItem.name}.`, 'success');
          // Remove from inventory
          setJourneyEvent(prev => prev ? {...prev, inventory: prev.inventory?.filter(i => i.id !== shopItem.id) } : null);
      }
  }, [player, handleEventOutcome, showToast]);

  const handleDilemmaResolve = useCallback((choice: DilemmaChoice) => {
      const rand = Math.random() * 100;
      let cumulativeChance = 0;
      const selectedOutcome = choice.possibleOutcomes.find(o => {
          cumulativeChance += o.chance;
          return rand <= cumulativeChance;
      }) || choice.possibleOutcomes[0]; // Failsafe

      addToHistory('event-dilemma-choice', `Dilemma: Chose to '${choice.text}'`);
      setDilemmaResult({ aftermath: selectedOutcome.aftermath, outcome: selectedOutcome.outcome });
      setGameState(GameStateEnum.DILEMMA_RESULT);
  }, [addToHistory]);

  const handleEchoingCairnResolve = useCallback((choice: EchoingCairnChoice) => {
    setPlayer(prev => {
        if (!prev) return null;
        return {
            ...prev,
            temporaryBuffs: [...prev.temporaryBuffs, choice.buff]
        }
    });
    showToast(`You recall '${choice.historyEntry.description}' and feel empowered!`, 'success');
    
    // This event counts as an encounter for buff duration
    updateBuffs();
    
    setIsJourneyPaused(false);
    setGameState(GameStateEnum.JOURNEY);
  }, [showToast, updateBuffs]);
  
  const handlePurchaseUpgrade = useCallback((upgrade: keyof CampUpgrades) => {
      if (!player) return;
      const currentLevel = campState.upgrades[upgrade];
      const cost = UPGRADE_COSTS[upgrade][currentLevel];

      if (player.essence >= cost) {
          setPlayer(p => p ? ({ ...p, essence: p.essence - cost }) : null);
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
  }, [player, campState.upgrades, showToast]);

  const handleBrewElixir = useCallback((elixir: Elixir) => {
    if (!player) return;
    if (player.essence < elixir.cost) {
        showToast("Not enough Arcane Essence!", "error");
        return;
    }
    if (player.activeElixir) {
        showToast("You already have an active elixir.", "error");
        return;
    }
    setPlayer(p => {
        if (!p) return null;
        return {
            ...p,
            essence: p.essence - elixir.cost,
            activeElixir: { id: elixir.id, ...elixir.effect }
        }
    });
    showToast(`Brewed ${elixir.name}!`, 'success');
  }, [player, showToast]);

  const handleExitCamp = useCallback((spentEssence: boolean) => {
      if (!playerWithStats || !player) return;
      const healPercent = spentEssence ? 0.35 : 0.50;
      const healAmount = Math.floor(playerWithStats.maxHealth * healPercent);
      
      setPlayer(p => {
          if (!p) return null;
          return {
            ...p,
            health: Math.min(p.maxHealth, p.health + healAmount)
          }
      });
      showToast(`Rested and healed for ${healAmount} HP!`, 'success');

      generateAndSetJourney(victories, player.level, player.activeElixir);
      setGameState(GameStateEnum.JOURNEY);
  }, [playerWithStats, player, victories, showToast, generateAndSetJourney]);

    const handleApplyEnchant = useCallback((slot: keyof Equipment, enchantToApply: Enchant) => {
        if (!player) return;
        const itemToEnchant = player.equipment[slot];
        if (!itemToEnchant) return;

        const cost = ENCHANT_COST_MODIFIERS[itemToEnchant.rarity];
        if (player.essence < cost) {
            showToast("Not enough Arcane Essence!", "error");
            return;
        }

        let essenceChange = -cost;
        if (itemToEnchant.enchant && itemToEnchant.enchant.rarity) {
            const refund = Math.floor(RARITY_ESSENCE_MAP[itemToEnchant.enchant.rarity] * 0.5);
            essenceChange += refund;
            showToast(`Old enchant disenchanted for ${refund} essence.`, 'info');
        }

        setPlayer(p => {
            if (!p) return null;
            const newEquipment = { ...p.equipment };
            const updatedItem = { ...itemToEnchant, enchant: enchantToApply };
            newEquipment[slot] = updatedItem;

            return {
                ...p,
                essence: p.essence + essenceChange,
                enchants: p.enchants.filter(e => e.id !== enchantToApply.id),
                equipment: newEquipment,
            };
        });

        showToast(`Successfully enchanted ${itemToEnchant.name}!`, 'success');
    }, [player, showToast]);

    const handleSocketGem = useCallback((slot: keyof Equipment, socketIndex: number, gem: Gem) => {
        if (!player) return;
        const itemToSocket = player.equipment[slot];
        if (!itemToSocket || !itemToSocket.sockets || !itemToSocket.sockets[socketIndex]) {
            showToast("Invalid item or socket.", "error");
            return;
        }

        const socket = itemToSocket.sockets[socketIndex];
        if (socket.gem) {
            showToast("Socket is already filled.", "error");
            return;
        }
        if (socket.color !== gem.color) {
            showToast("Gem color does not match socket color.", "error");
            return;
        }

        setPlayer(p => {
            if (!p) return null;
            const newEquipment = { ...p.equipment };
            const updatedItem = { ...itemToSocket };
            const newSockets = [...updatedItem.sockets!];
            newSockets[socketIndex] = { ...socket, gem: gem };
            updatedItem.sockets = newSockets;
            newEquipment[slot] = updatedItem;
            
            return {
                ...p,
                equipment: newEquipment,
                gems: p.gems.filter(g => g.id !== gem.id),
            }
        });

        showToast(`Socketed ${gem.name} into ${itemToSocket.name}!`, 'success');

    }, [player, showToast]);


  const handleClaimReward = useCallback((achievementId: string, tierIndex: number) => {
    const achievementData = ACHIEVEMENTS_DATA.find(a => a.id === achievementId);
    if (!achievementData) return;

    const reward = achievementData.tiers[tierIndex].reward;

    setPlayer(prev => {
        if (!prev) return null;
        let newPlayer = { ...prev };
        if (reward.type === 'xp') {
            let newXp = newPlayer.xp + reward.value;
            // Handle level ups from achievement XP
            while (newXp >= newPlayer.xpToNextLevel) {
                newPlayer.level += 1;
                newXp -= newPlayer.xpToNextLevel;
                newPlayer.xpToNextLevel = Math.floor(newPlayer.xpToNextLevel * 1.35);
                newPlayer.maxHealth = Math.floor(newPlayer.maxHealth * 1.15);
                newPlayer.health = newPlayer.maxHealth; // Full heal on level up
                showToast(`Level up! You are now level ${newPlayer.level}!`, 'success');
                addToHistory('level-up', `Reached Level ${newPlayer.level}!`);
            }
            newPlayer.xp = newXp;
        } else if (reward.type === 'essence') {
            newPlayer.essence += reward.value;
        }
        return newPlayer;
    });

    setPlayerAchievements(prev => {
        const newAchievements = { ...prev };
        newAchievements[achievementId].claimedTier = tierIndex;
        return newAchievements;
    });

    showToast(`Claimed ${reward.value} ${reward.type}!`, 'success');
  }, [showToast, addToHistory]);

  const handleClaimAllRewards = useCallback(() => {
    let totalXp = 0;
    let totalEssence = 0;
    const newAchievements = JSON.parse(JSON.stringify(playerAchievements)); // Deep copy

    for (const achievement of ACHIEVEMENTS_DATA) {
      const progress = newAchievements[achievement.id];
      if (progress.unlockedTier > progress.claimedTier) {
        for (let i = progress.claimedTier + 1; i <= progress.unlockedTier; i++) {
          const reward = achievement.tiers[i].reward;
          if (reward.type === 'xp') {
            totalXp += reward.value;
          } else {
            totalEssence += reward.value;
          }
        }
        progress.claimedTier = progress.unlockedTier;
      }
    }

    if (totalXp > 0 || totalEssence > 0) {
      setPlayer(prev => {
        if (!prev) return null;
        let newPlayer = { ...prev };
        newPlayer.essence += totalEssence;

        let newXp = newPlayer.xp + totalXp;
        while (newXp >= newPlayer.xpToNextLevel) {
            newPlayer.level += 1;
            newXp -= newPlayer.xpToNextLevel;
            newPlayer.xpToNextLevel = Math.floor(newPlayer.xpToNextLevel * 1.35);
            newPlayer.maxHealth = Math.floor(newPlayer.maxHealth * 1.15);
            newPlayer.health = newPlayer.maxHealth;
            showToast(`Level up! You are now level ${newPlayer.level}!`, 'success');
            addToHistory('level-up', `Reached Level ${newPlayer.level}!`);
        }
        newPlayer.xp = newXp;
        return newPlayer;
      });

      setPlayerAchievements(newAchievements);
      showToast(`Claimed all rewards! +${totalXp} XP, +${totalEssence} Essence.`, 'success');
    }
  }, [playerAchievements, showToast, addToHistory]);

  const handleLootContinue = useCallback(() => {
    if (!player || player.health <= 0) {
        startNewRun();
        return;
    }

    const forgedItem = lastCombatResult.itemDropped;
    if (forgedItem && ritualSource === 'combat') {
        setRitualSource(null);
        const equippedItem = player.equipment[forgedItem.type];
        if (equippedItem) {
            setGearForChoice({ equipped: equippedItem, new: forgedItem });
            setGameState(GameStateEnum.GEAR_CHOICE);
            return;
        } else {
            setPlayer(prev => {
                if (!prev) return null;
                return { ...prev, equipment: { ...prev.equipment, [forgedItem.type]: forgedItem }};
            });
            showToast(`Equipped ${forgedItem.name}!`, 'success');
        }
    }
    
    const currentPos = journeyPath[journeyPath.length - 1];
    if (currentPos && currentPos.x >= GRID_WIDTH - 1) {
        generateAndSetJourney(victories, player.level, player.activeElixir);
        setGameState(GameStateEnum.JOURNEY);
        return;
    }

    if (victories > 0 && victories % 5 === 0) {
        setGameState(GameStateEnum.CAMP);
    } else {
        setIsJourneyPaused(false);
        setGameState(GameStateEnum.JOURNEY);
    }
}, [player, startNewRun, lastCombatResult, ritualSource, journeyPath, victories, generateAndSetJourney, showToast]);


  const handleJourneyEventContinue = useCallback(() => {
      if (journeyEvent?.outcome) {
          handleEventOutcome(journeyEvent.outcome);
          if (journeyEvent.outcome.itemDropped) {
              setGameState(GameStateEnum.DECK_OF_WHISPERS);
          } else {
              setIsJourneyPaused(false);
              setGameState(GameStateEnum.JOURNEY);
          }
      } else {
          setIsJourneyPaused(false);
          setGameState(GameStateEnum.JOURNEY);
      }
  }, [journeyEvent, handleEventOutcome]);

  const handleDilemmaResultContinue = useCallback(() => {
      if (dilemmaResult) {
          handleEventOutcome(dilemmaResult.outcome);
          if (dilemmaResult.outcome.itemDropped) {
              setGameState(GameStateEnum.DECK_OF_WHISPERS);
          } else {
              setIsJourneyPaused(false);
              setGameState(GameStateEnum.JOURNEY);
          }
      } else {
           setIsJourneyPaused(false);
           setGameState(GameStateEnum.JOURNEY);
      }
  }, [dilemmaResult, handleEventOutcome]);

    useEffect(() => {
        if (gameState === GameStateEnum.GENERATING_ENEMY && player) {
            const generate = async () => {
                try {
                    const enemyData = await service.generateEnemy(victories, player.level, justReceivedTreasure);
                    const enemyImage = await service.generateEnemyImage(enemyData.description, enemyData.name);
                    setJustReceivedTreasure(false); // Reset flag after using it
                    setEnemy({
                        ...enemyData,
                        health: enemyData.maxHealth,
                        imageBase64: enemyImage,
                    });
                    setCombatLog([]);
                    setPlayerStatusEffects([]);
                    setEnemyStatusEffects([]);
                    setGameState(GameStateEnum.COMBAT);
                } catch (error) {
                    console.error("Failed to generate enemy:", error);
                    showToast("Failed to generate an enemy. The path seems clear for now.", "error");
                    setIsJourneyPaused(false);
                    setGameState(GameStateEnum.JOURNEY);
                }
            };
            generate();
        }
    }, [gameState, victories, player, justReceivedTreasure, showToast]);

    useEffect(() => {
        if (gameState === GameStateEnum.GENERATING_EVENT && journeyEvent && player) {
            const generate = async () => {
                try {
                    const fullEvent = await service.generateJourneyEvent(player.level, victories, journeyEvent.type);
                    
                    if (fullEvent.type === 'echoing_cairn') {
                        const memorableHistory = runHistory.filter(h => h.type === 'victory' || h.type === 'item-forged' || h.type === 'level-up').slice(-3);
                        if (memorableHistory.length > 0) {
                            const choices: EchoingCairnChoice[] = memorableHistory.map((h, i) => {
                                let buff: TemporaryBuff;
                                const buffValue = 2 + Math.floor(player.level / 2);
                                if (i === 0) {
                                    buff = { source: 'Echoing Cairn', stat: 'attack', value: buffValue, duration: 3 };
                                } else if (i === 1) {
                                    buff = { source: 'Echoing Cairn', stat: 'defense', value: buffValue, duration: 3 };
                                } else {
                                    buff = { source: 'Echoing Cairn', stat: 'critChance', value: 5, duration: 3 };
                                }
                                return { historyEntry: h, buff };
                            });
                            fullEvent.choices = choices;
                        }
                    }
                    
                    setJourneyEvent(fullEvent);

                    switch (fullEvent.type) {
                        case 'merchant':
                            setGameState(GameStateEnum.MERCHANT);
                            break;
                        case 'dilemma':
                             setRunStats(prev => ({...prev, dilemmasFaced: prev.dilemmasFaced + 1}));
                            setGameState(GameStateEnum.DILEMMA);
                            break;
                        case 'echoing_cairn':
                            if (fullEvent.choices && fullEvent.choices.length > 0) {
                                setGameState(GameStateEnum.ECHOING_CAIRN);
                            } else {
                                setJourneyEvent({
                                    type: 'discovery',
                                    narrative: 'The cairn remains silent, offering no echoes of your past. You feel a brief moment of peace before moving on.',
                                    outcome: { xpGained: 25, healthChange: 0, itemDropped: null }
                                });
                                setGameState(GameStateEnum.JOURNEY_EVENT);
                            }
                            break;
                        default:
                            setGameState(GameStateEnum.JOURNEY_EVENT);
                            break;
                    }
                } catch (error) {
                    console.error("Failed to generate journey event:", error);
                    showToast("The path ahead is unclear. Continuing your journey.", "error");
                    setIsJourneyPaused(false);
                    setGameState(GameStateEnum.JOURNEY);
                }
            };
            generate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, journeyEvent?.type, player]);

  const renderGameState = () => {
    if (isLoading) {
        return <LoadingPhase message={loadingMessage ?? undefined} />;
    }
    
    if (!playerWithStats && gameState !== GameStateEnum.CHARACTER_SELECT) {
        return <LoadingPhase />;
    }

    switch (gameState) {
      case GameStateEnum.CHARACTER_SELECT:
        return <CharacterSelectionPhase onSelect={handleCharacterSelect} />;
      case GameStateEnum.JOURNEY:
        return (
          <JourneyPhase
            player={playerWithStats!}
            narrative={journeyNarrative}
            mapImageUrl={mapImageUrl}
            victories={victories}
            path={journeyPath}
            nodes={nodes}
            isPaused={isJourneyPaused}
            onNextStep={handleNextJourneyStep}
            onSetMouseInfluence={setMouseInfluence}
          />
        );
      case GameStateEnum.GENERATING_ENEMY:
      case GameStateEnum.GENERATING_EVENT:
        return <LoadingPhase />;
      case GameStateEnum.COMBAT:
        if (!enemy) return <LoadingPhase />;
        const setPlayerHealth = (hp: number) => setPlayer(p => p ? ({ ...p, health: hp }) : null);
        const setEnemyHealth = (hp: number) => setEnemy(e => e ? { ...e, health: hp } : null);
        return (
          <AutomatedCombatPhase
            player={playerWithStats!}
            enemy={{...enemy, activeStatusEffects: enemyStatusEffects}}
            setPlayerHealth={setPlayerHealth}
            setEnemyHealth={setEnemyHealth}
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
        );
      case GameStateEnum.LOOT:
        return (
          <LootPhase
            result={lastCombatResult}
            onContinue={handleLootContinue}
            enemyName={enemy?.name || 'a fallen foe'}
          />
        );
      case GameStateEnum.DECK_OF_WHISPERS:
        if (!itemForRitual) return <LoadingPhase />;
        return (
          <DeckOfWhispersPhase
            item={itemForRitual}
            onComplete={handleRitualComplete}
          />
        );
      case GameStateEnum.ARTIFACT_REVEAL:
        if (!revealedArtifact) return <LoadingPhase />;
        return (
            <ArtifactRevealPhase
                item={revealedArtifact}
                onContinue={handleArtifactRevealContinue}
            />
        );
      case GameStateEnum.GEAR_CHOICE:
        if (!gearForChoice) return <LoadingPhase />;
        return (
          <GearChoicePhase
            equippedItem={gearForChoice.equipped}
            newItem={gearForChoice.new}
            onChoice={handleGearChoice}
            autoEquip={autoEquip}
            setAutoEquip={setAutoEquip}
          />
        );
      case GameStateEnum.JOURNEY_EVENT:
        if (!journeyEvent || !journeyEvent.outcome) return <LoadingPhase />;
        return (
          <JourneyEventPhase
            event={journeyEvent}
            onContinue={handleJourneyEventContinue}
          />
        );
      case GameStateEnum.MERCHANT:
        if (!journeyEvent) return <LoadingPhase />;
        return (
          <MerchantPhase
            player={playerWithStats!}
            event={journeyEvent}
            onPurchase={handlePurchase}
            onExit={() => {
              updateBuffs();
              setIsJourneyPaused(false);
              setGameState(GameStateEnum.JOURNEY);
            }}
          />
        );
      case GameStateEnum.DILEMMA:
        if (!journeyEvent) return <LoadingPhase />;
        return (
          <DilemmaPhase
            event={journeyEvent}
            onResolve={handleDilemmaResolve}
          />
        );
      case GameStateEnum.DILEMMA_RESULT:
        if (!dilemmaResult) return <LoadingPhase />;
        return (
          <DilemmaResultPhase
            result={dilemmaResult}
            onContinue={handleDilemmaResultContinue}
          />
        );
      case GameStateEnum.ECHOING_CAIRN:
        if (!journeyEvent) return <LoadingPhase />;
        return (
          <EchoingCairnPhase
            event={journeyEvent}
            onResolve={handleEchoingCairnResolve}
          />
        );
      case GameStateEnum.CAMP:
        return (
          <CampPhase
            player={playerWithStats!}
            campState={campState}
            onPurchaseUpgrade={handlePurchaseUpgrade}
            onBrewElixir={handleBrewElixir}
            onExit={handleExitCamp}
            onEnterEnchanting={() => setGameState(GameStateEnum.ENCHANTING)}
            onEnterGemSocketing={() => setGameState(GameStateEnum.GEM_SOCKETING)}
          />
        );
      case GameStateEnum.ENCHANTING:
        return (
            <EnchantingPhase
                player={playerWithStats!}
                onApplyEnchant={handleApplyEnchant}
                onExit={() => setGameState(GameStateEnum.CAMP)}
            />
        );
      case GameStateEnum.GEM_SOCKETING:
        return (
            <GemSocketingPhase
                player={playerWithStats!}
                onSocketGem={handleSocketGem}
                onExit={() => setGameState(GameStateEnum.CAMP)}
            />
        );
      default:
        return <div>Unknown game state</div>;
    }
  };

  return (
    <main className="bg-gray-900 text-white min-h-screen font-sans antialiased bg-grid-purple-500/10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/50 via-gray-900 to-black"></div>
      
      <header className={`sticky top-0 z-40 bg-black/30 backdrop-blur-md border-b border-purple-800/50 py-3 transition-colors duration-500 ${headerGlowClass}`}>
        <div className="container mx-auto flex justify-between items-center px-4 md:px-6">
          <div className="flex items-end gap-4">
            <img src="https://astriloot.com/assets/astriloot-name.png" alt="Astriloot" className="h-10 md:h-12" />
            <span className="text-xl md:text-2xl font-cinzel tracking-wider text-gray-400 pb-1">
              {player ? `${player.name}'s Journey` : 'A New Beginning'}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsAchievementsVisible(true)}
              className="p-2 text-gray-300 hover:text-yellow-300 transition-colors relative"
              aria-label="View Achievements"
            >
              <Trophy className="w-8 h-8" />
              {hasUnclaimedRewards && <span className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>}
            </button>
          </div>
        </div>
      </header>

      <div className={`container mx-auto p-4 md:p-6 transition-all duration-500 ${containerMaxWidthClass}`}>
        {renderGameState()}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {isAchievementsVisible && (
        <AchievementsPhase
          playerAchievements={playerAchievements}
          onClaimReward={handleClaimReward}
          onClaimAllRewards={handleClaimAllRewards}
          hasUnclaimedRewards={hasUnclaimedRewards}
          onExit={() => setIsAchievementsVisible(false)}
        />
      )}
    </main>
  );
};

export default App;