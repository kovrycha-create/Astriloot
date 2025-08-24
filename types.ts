export enum GameStateEnum {
  JOURNEY = 'JOURNEY',
  GENERATING_ENEMY = 'GENERATING_ENEMY',
  GENERATING_EVENT = 'GENERATING_EVENT',
  JOURNEY_EVENT = 'JOURNEY_EVENT',
  DILEMMA = 'DILEMMA',
  DILEMMA_RESULT = 'DILEMMA_RESULT',
  MERCHANT = 'MERCHANT',
  ECHOING_CAIRN = 'ECHOING_CAIRN',
  COMBAT = 'COMBAT',
  DECK_OF_WHISPERS = 'DECK_OF_WHISPERS',
  GEAR_CHOICE = 'GEAR_CHOICE',
  LOOT = 'LOOT',
  CAMP = 'CAMP',
}

export type GameState = GameStateEnum;

export interface Ability {
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'utility';
  damage: [number, number];
}

// Rarity types for items
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Rare+' | 'Epic' | 'Legendary' | 'Mythic';

// New types for advanced combat
export type StatusEffectType = 'Bleed' | 'Poison' | 'Burn';
export interface StatusEffect {
    type: StatusEffectType;
    damage: number;
    duration: number;
}
export interface ProcEffect {
    type: StatusEffectType;
    chance: number;
    damage: number;
    duration: number;
}

export interface Item {
  name: string;
  description: string;
  type: 'weapon' | 'armor';
  attack: number;
  defense: number;
  critChance?: number;
  critDamage?: number;
  doubleStrikeChance?: number;
  blockChance?: number;
  procEffect?: ProcEffect;
  rarity: Rarity;
}

export interface Equipment {
  weapon: Item | null;
  armor: Item | null;
}

export interface Character {
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  critChance: number;
  critDamage: number; // e.g., 150 for 150% damage
  doubleStrikeChance: number;
  blockChance: number;
}

// Elixirs
export type ElixirType = 'BONUS_DEFENSE_PERCENT_COMBAT' | 'GUARANTEED_DOUBLE_STRIKE_COMBAT' | 'GUARANTEED_POSITIVE_EVENT';

export interface ElixirEffect {
    type: ElixirType;
    value: number; // e.g., 25 for 25%, or 1 for true
    duration: number; // e.g., 3 combats, or 1 event
}

export interface Elixir {
    id: string;
    name: string;
    description: string;
    cost: number;
    requiredLabLevel: number;
    effect: ElixirEffect;
}

export interface ActiveElixirEffect extends ElixirEffect {
    id: string;
}

export type BuffableStat = 'attack' | 'defense' | 'critChance' | 'critDamage' | 'doubleStrikeChance' | 'blockChance';

export interface TemporaryBuff {
    source: string;
    stat: BuffableStat;
    value: number;
    duration: number; // Number of encounters
}

export interface Player extends Character {
  level: number;
  xp: number;
  xpToNextLevel: number;
  equipment: Equipment;
  abilities: Ability[];
  activeStatusEffects: StatusEffect[];
  essence: number;
  activeElixir: ActiveElixirEffect | null;
  temporaryBuffs: TemporaryBuff[];
}

export interface Enemy extends Character {
  level: number;
  description: string;
  imageBase64: string;
  loot: Omit<Item, 'rarity'> | null;
  activeStatusEffects: StatusEffect[];
}

export interface CombatOutcome {
    actorName: string;
    targetName: string;
    damage: number;
    isPlayer: boolean;
    actorAttack: number;
    targetDefense: number;
    isCrit?: boolean;
    isDoubleStrike?: boolean;
    didProc?: StatusEffectType;
    didBlock?: boolean;
}

export interface CombatLogEntry {
    id: number;
    narrative: string;
    outcome: CombatOutcome;
}

export interface DamageNumberInfo {
    id: number;
    target: 'player' | 'enemy';
    amount: number;
    isCrit: boolean;
}


// New types for Journey Events
export type JourneyEventType = 'treasure' | 'shrine' | 'trap' | 'discovery' | 'merchant' | 'dilemma' | 'echoing_cairn';

export interface JourneyEventOutcome {
    xpGained: number;
    healthChange: number; // Can be positive (healing) or negative (damage)
    itemDropped: Omit<Item, 'rarity'> | null;
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: 'potion' | 'item';
    healthValue?: number;
    itemBase?: Omit<Item, 'rarity'>;
}

export interface PossibleOutcome {
    chance: number; // An integer from 1 to 100 representing percentage
    aftermath: string;
    outcome: JourneyEventOutcome;
}

export interface DilemmaChoice {
    text: string;
    possibleOutcomes: PossibleOutcome[];
}

export interface EchoingCairnChoice {
    historyEntry: RunHistoryEntry;
    buff: TemporaryBuff;
}

export interface JourneyEvent {
    type: JourneyEventType;
    narrative: string;
    outcome?: JourneyEventOutcome;
    inventory?: ShopItem[];
    choices?: DilemmaChoice[] | EchoingCairnChoice[];
}

// --- Journey/Pathfinding Types ---
export interface PathNode {
    x: number;
    y: number;
}
  
export interface JourneyNode extends PathNode {
    id: string;
    type: JourneyEventType;
}

// --- Run Summary Types ---
export interface RunStats {
    damageDealt: number;
    damageTaken: number;
    criticalHits: number;
    doubleStrikes: number;
    attacksBlocked: number;
    enemiesDefeated: number;
    itemsForged: number;
    essenceSpent: number;
    dilemmasFaced: number;
}
  
export type RunHistoryEntryType = 'victory' | 'level-up' | 'item-forged' | 'event-trap' | 'event-shrine' | 'event-treasure' | 'event-discovery' | 'event-merchant' | 'event-dilemma-choice';
  
export interface RunHistoryEntry {
    id: number;
    type: RunHistoryEntryType;
    description: string;
}

export interface LootPhaseResult {
    playerWon: boolean;
    xpGained: number;
    itemDropped: Omit<Item, 'rarity'> | null;
    levelUp: boolean;
    finalLog?: CombatLogEntry[];
    xpBefore?: number;
    xpAfter?: number;
    xpToNextLevel?: number;
    combatStats?: Partial<RunStats>;
    victoryCount?: number;
    runStats?: RunStats;
    runHistory?: RunHistoryEntry[];
}

// --- Camp Types ---
export interface CampUpgrades {
    soulfireForge: number;
    alchemistsLab: number;
    scryingPool: number;
}

export interface CampState {
    upgrades: CampUpgrades;
    totalVictories: number;
}

// --- Achievement Types ---
export type AchievementCategory = 'Combat' | 'Journey' | 'Whispers' | 'Legacy';
  
export type TrackableStats =
    | 'enemiesDefeated'
    | 'criticalHitsLanded'
    | 'doubleStrikesLanded'
    | 'flawlessVictories'
    | 'clutchVictories'
    | 'trapsSurvived'
    | 'consecutiveTraps'
    | 'victoriesInRun'
    | 'uncommonForged'
    | 'rareForged'
    | 'epicForged'
    | 'legendaryForged'
    | 'mythicForged';

export interface AchievementTier {
    goal: number;
    reward: {
        type: 'xp' | 'essence';
        value: number;
    };
    description: string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    category: AchievementCategory;
    stat: TrackableStats;
    trackingType: 'cumulative' | 'highScore';
    tiers: AchievementTier[];
}

export interface PlayerAchievementProgress {
    currentValue: number;
    unlockedTier: number;
    claimedTier: number;
}

export type PlayerAchievements = Record<string, PlayerAchievementProgress>;


// --- Deck of Whispers Types ---
export type YlemModifier = 'Corrupted' | 'Unstable' | 'Harmonized' | null;
export type CardType = 'Ashard' | 'Revelation' | 'Fluon' | 'Ascendant';

export interface Card {
    id: number;
    name: string;
    type: CardType;
    modifier?: YlemModifier;
}

// Ritual Simulation types
export type RitualStep =
  | { type: 'START', deckSize: number }
  | { type: 'DRAW', card: Card, remaining: number }
  | { type: 'MODIFIER', modifier: YlemModifier, card: Card }
  | { type: 'RESHUFFLE', deckSize: number }
  | { type: 'DECISION_PHASE' }
  | { type: 'LOG', message: string };

export type RitualResult = {
    rarity: Rarity;
    finalCard: Card;
};

export type RitualGenerator = Generator<RitualStep, RitualResult, unknown>;