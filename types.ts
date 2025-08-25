


export enum GameStateEnum {
  CHARACTER_SELECT = 'CHARACTER_SELECT',
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
  ARTIFACT_REVEAL = 'ARTIFACT_REVEAL',
  GEAR_CHOICE = 'GEAR_CHOICE',
  LOOT = 'LOOT',
  CAMP = 'CAMP',
  ENCHANTING = 'ENCHANTING',
  GEM_SOCKETING = 'GEM_SOCKETING',
}

export type GameState = GameStateEnum;

export interface Ability {
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'utility';
  damage: [number, number];
}

// --- Currency & Economy Types ---
export interface Price {
  vas?: number;
  ae?: number;
}

export interface Currency {
  id: 'vas' | 'ae';
  name: string;
  icon?: string;
  rarity: 'common' | 'rare';
  stackLimit: number;
}

export interface ExchangeRate {
  from: 'vas';
  to: 'ae';
  locationTag: 'camp' | 'town';
  rate: number;
  dailyCap: number;
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

export type EnchantEffectType = BuffableStat | 'vampiric';

export interface EnchantEffect {
    stat: EnchantEffectType;
    value: number;
    description: string;
}

export interface Enchant {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    effects: EnchantEffect[];
}

// --- Gem & Socket Types ---
export type GemColor = 'RED' | 'BLUE' | 'YELLOW';
export type GemQuality = 'CHIPPED' | 'FLAWED' | 'STANDARD' | 'FLAWLESS' | 'PERFECT';
export type SocketColor = 'RED' | 'BLUE' | 'YELLOW';

export interface GemEffect {
    stat: BuffableStat;
    value: number;
}

export interface Gem {
    id: string;
    name: string;
    color: GemColor;
    quality: GemQuality;
    effects: GemEffect[];
}

export interface Socket {
    color: SocketColor;
    gem: Gem | null;
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
  enchant?: Enchant | null;
  sockets?: Socket[];
  imageBase64?: string | null;
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
  vas: number;
  activeElixir: ActiveElixirEffect | null;
  temporaryBuffs: TemporaryBuff[];
  enchants: Enchant[];
  gems: Gem[];
}

export interface CharacterData {
  id: 'ymzo' | 'kiox' | 'nippy' | 'sinira';
  name: string;
  nameImageUrl: string;
  portraitImageUrl: string;
  description: string;
  initialState?: Player;
  status?: 'coming_soon';
}

export interface Enemy extends Character {
  level: number;
  description: string;
  imageBase64: string | null;
  loot: Omit<Item, 'rarity'> | null;
  enchantDropped?: Enchant | null;
  gemsDropped?: Gem[];
  vasDropped: number;
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
    enchantDropped?: Enchant | null;
    gemsDropped?: Gem[];
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: Price;
    type: 'potion' | 'item' | 'enchant' | 'gem';
    healthValue?: number;
    itemBase?: Omit<Item, 'rarity'>;
    enchant?: Enchant;
    gem?: Gem;
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

export interface ValueBuy {
    enabled: boolean;
    itemId?: string; // Corresponds to an id in the inventory
    discountPct?: number;
}

export interface JourneyEvent {
    type: JourneyEventType;
    narrative: string;
    outcome?: JourneyEventOutcome;
    inventory?: ShopItem[];
    choices?: DilemmaChoice[] | EchoingCairnChoice[];
    // For merchant events
    locationTag?: 'camp' | 'town';
    valueBuy?: ValueBuy;
}

// --- Merchant Types ---
export interface MerchantItem {
    id: string;
    item: Omit<Item, 'rarity'>;
    price: Price;
}

export interface Merchant {
    id: string;
    locationTag: 'camp' | 'town';
    priceModifier: number;
    stock: MerchantItem[];
    services: {
        convert?: boolean;
        reroll?: boolean;
        identify?: boolean;
    };
    valueBuy?: {
        enabled: boolean;
        itemId?: string;
        discountPct?: number;
        seed?: number;
    };
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
    itemDropped: Item | null;
    enchantDropped?: Enchant | null;
    gemsDropped?: Gem[];
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
    jewelcraftersTable: number;
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