










import type { Player, Card, Rarity, CampState, Achievement, PlayerAchievements, Elixir, Enchant, Gem, GemColor, GemQuality, GemEffect, SocketColor, CharacterData } from './types';

const YMZO_INITIAL_STATE: Player = {
  name: 'Ymzo',
  level: 1,
  xp: 0,
  xpToNextLevel: 80,
  health: 100,
  maxHealth: 100,
  attack: 10,
  defense: 5,
  critChance: 5, // Base 5% crit chance
  critDamage: 150, // Base 150% crit damage
  doubleStrikeChance: 2, // Base 2% double strike chance
  blockChance: 3, // Base 3% block chance
  equipment: {
    weapon: null,
    armor: null,
  },
  abilities: [
    { name: 'Swift Strike', type: 'attack', description: 'A fast and precise attack dealing moderate damage.', damage: [8, 12] },
    { name: 'Guard', type: 'defense', description: 'Focus on defense, reducing incoming damage for a short time.', damage: [0, 0] },
    { name: 'First Aid', type: 'utility', description: 'A quick patch-up to restore a small amount of health.', damage: [0, 0] },
  ],
  activeStatusEffects: [],
  essence: 0,
  vas: 0,
  activeElixir: null,
  temporaryBuffs: [],
  enchants: [],
  gems: [],
};

const KIOX_INITIAL_STATE: Player = {
  name: 'Kiox',
  level: 1,
  xp: 0,
  xpToNextLevel: 80,
  health: 95,
  maxHealth: 95,
  attack: 11,
  defense: 3,
  critChance: 7, // Higher crit
  critDamage: 155, // Higher crit damage
  doubleStrikeChance: 4, // Higher double strike
  blockChance: 1, // Lower block
  equipment: {
    weapon: null,
    armor: null,
  },
  abilities: [
    { name: 'Wild Swing', type: 'attack', description: 'A chaotic, powerful attack.', damage: [7, 14] },
    { name: 'Reckless Advance', type: 'utility', description: 'Boost offense at the cost of defense.', damage: [0, 0] },
    { name: 'Siphon Strike', type: 'utility', description: 'A risky strike that can heal.', damage: [0, 0] },
  ],
  activeStatusEffects: [],
  essence: 0,
  vas: 0,
  activeElixir: null,
  temporaryBuffs: [],
  enchants: [],
  gems: [],
};


export const CHARACTERS_DATA: CharacterData[] = [
    {
        id: 'nippy',
        name: 'Nippy',
        nameImageUrl: 'https://astriloot.com/assets/characters/Nippy/nippy-name.png',
        portraitImageUrl: 'https://astriloot.com/assets/characters/Nippy/nippy-intro.png',
        description: "A mischievous, fiercely loyal goblin-like librarian-guardian whose quirky habits mask sharp curiosity and a protective streak, with teasing gaps in memory hinting at a deeper origin.",
        status: 'coming_soon',
    },
    {
        id: 'ymzo',
        name: 'Ymzo',
        nameImageUrl: 'https://astriloot.com/assets/characters/Ymzo/ymzo-name.png',
        portraitImageUrl: 'https://astriloot.com/assets/characters/Ymzo/ymzo-intro.png',
        description: "A structured, methodical “cosmic architect” who pursues balance with patient precision and arcane discipline.",
        initialState: YMZO_INITIAL_STATE,
    },
    {
        id: 'kiox',
        name: 'Kiox',
        nameImageUrl: 'https://astriloot.com/assets/characters/Kiox/kiox-name.png',
        portraitImageUrl: 'https://astriloot.com/assets/characters/Kiox/kiox-intro.png',
        description: "An uncontained chaos artist who flips the table whenever the game gets stale, favoring motion and possibility over control.",
        initialState: KIOX_INITIAL_STATE,
    },
    {
        id: 'sinira',
        name: 'Sinira',
        nameImageUrl: 'https://astriloot.com/assets/characters/Sinira/sinira-name.png',
        portraitImageUrl: 'https://astriloot.com/assets/characters/Sinira/sinira-intro.png',
        description: "A volatile, all-or-nothing normnie who rewrites fate with riftweaving—swinging from blazing intimacy to scorched-earth defiance, impulsive yet fiercely devoted and terrified of losing the bonds she tests.",
        status: 'coming_soon',
    }
];


// --- Camp Constants ---
export const INITIAL_CAMP_STATE: CampState = {
    upgrades: {
        soulfireForge: 0,
        alchemistsLab: 0,
        scryingPool: 0,
        jewelcraftersTable: 0,
    },
    totalVictories: 0,
};

export const UPGRADE_COSTS = {
    soulfireForge: [125, 450, 1200], // Level 1, 2, 3 costs
    alchemistsLab: [175, 550, 1500],
    scryingPool: [200, 600, 1800],
    jewelcraftersTable: [250, 800],
};

export const UPGRADE_DESCRIPTIONS = {
    soulfireForge: [
        "Build a basic forge. Unlocks the ability to Temper one item per camp visit, re-rolling its stats, and the ability to apply Enchants.",
        "Upgrade to an Arcane Anvil. Unlocks Runic Inscription, allowing you to add a new minor stat to an item.",
        "Add the Whispering Bellows. Permanently removes one Ashard card from the Deck of Whispers.",
        "The forge is perfected. All rituals are improved.",
    ],
    alchemistsLab: [
        "Build a basic lab. Allows you to brew a single-use Elixir before each journey, providing a temporary buff.",
        "Upgrade the alembics. Unlocks more powerful and varied Elixirs to brew.",
        "Master the craft. Passively gain more Arcane Essence from all sources.",
        "The lab is perfected. All concoctions are improved.",
    ],
    scryingPool: [
        "Build a scrying pool. Allows you to Glimpse the path ahead, revealing the final boss type.",
        "Upgrade the pool. Allows you to Influence the path, re-rolling event nodes.",
        "Perfect the pool. The first event of every journey is now guaranteed to be a positive one.",
        "The pool is perfected. Your sight is unmatched.",
    ],
    jewelcraftersTable: [
        "Build a basic workshop. Unlocks the ability to socket gems into items with corresponding colored sockets.",
        "Upgrade the toolset. Unlocks Gem Cutting, allowing you to combine 3 gems of the same type into a higher quality one for a Vas fee.",
        "The workshop is perfected. All crafting is improved.",
    ],
};

// --- Elixirs ---
export const ELIXIRS_DATA: Elixir[] = [
    {
        id: 'iron_skin',
        name: 'Elixir of Iron Skin',
        description: '+20% Defense for the next 3 combat encounters.',
        cost: 60,
        requiredLabLevel: 1,
        effect: { type: 'BONUS_DEFENSE_PERCENT_COMBAT', value: 20, duration: 3 }
    },
    {
        id: 'swift_blade',
        name: 'Elixir of the Swift Blade',
        description: 'Your first attack in the next 2 combats is a guaranteed Double Strike.',
        cost: 85,
        requiredLabLevel: 1,
        effect: { type: 'GUARANTEED_DOUBLE_STRIKE_COMBAT', value: 1, duration: 2 }
    },
    {
        id: 'fortune_seeker',
        name: 'Draught of the Fortune-Seeker',
        description: 'Guarantees the first event node you encounter is a Treasure or Shrine.',
        cost: 100,
        requiredLabLevel: 1,
        effect: { type: 'GUARANTEED_POSITIVE_EVENT', value: 1, duration: 1 }
    }
];

// --- Enchants ---
export const ENCHANTS_DATA: Enchant[] = [
    {
        id: 'vampiric_lesser',
        name: 'Lesser Vampiric Rune',
        description: 'Your weapon pulses with a thirst for life.',
        rarity: 'Rare',
        effects: [{ stat: 'vampiric', value: 2, description: 'Heals for 2% of damage dealt.' }]
    },
    {
        id: 'shattering_lesser',
        name: 'Lesser Shattering Rune',
        description: 'Impacts from this weapon splinter enemy defenses.',
        rarity: 'Rare',
        effects: [{ stat: 'attack', value: 5, description: '+5 Attack' }] // Simplified for now
    },
    {
        id: 'guardian_lesser',
        name: 'Lesser Guardian Glyph',
        description: 'This armor strengthens your resolve when near death.',
        rarity: 'Rare',
        effects: [{ stat: 'defense', value: 8, description: '+8 Defense' }] // Simplified for now
    },
    {
        id: 'thorns_lesser',
        name: 'Lesser Thorns Glyph',
        description: 'Your armor sprouts spectral barbs when struck.',
        rarity: 'Uncommon',
        effects: [{ stat: 'defense', value: 5, description: '+5 Defense' }] // Simplified for now
    },
];

export const ENCHANT_COST_MODIFIERS: Record<Rarity, number> = {
    Common: 25,
    Uncommon: 40,
    Rare: 75,
    'Rare+': 100,
    Epic: 150,
    Legendary: 300,
    Mythic: 500,
};

// --- Gems ---
export const GEMS_DATA: Record<GemColor, Record<GemQuality, { name: string, effects: GemEffect[] }>> = {
    RED: {
        CHIPPED: { name: 'Chipped Ruby', effects: [{ stat: 'attack', value: 2 }] },
        FLAWED: { name: 'Flawed Ruby', effects: [{ stat: 'attack', value: 4 }] },
        STANDARD: { name: 'Ruby', effects: [{ stat: 'attack', value: 7 }] },
        FLAWLESS: { name: 'Flawless Ruby', effects: [{ stat: 'attack', value: 11 }] },
        PERFECT: { name: 'Perfect Ruby', effects: [{ stat: 'attack', value: 15 }, { stat: 'critDamage', value: 5 }] },
    },
    BLUE: {
        CHIPPED: { name: 'Chipped Sapphire', effects: [{ stat: 'defense', value: 3 }] },
        FLAWED: { name: 'Flawed Sapphire', effects: [{ stat: 'defense', value: 6 }] },
        STANDARD: { name: 'Sapphire', effects: [{ stat: 'defense', value: 10 }] },
        FLAWLESS: { name: 'Flawless Sapphire', effects: [{ stat: 'defense', value: 15 }] },
        PERFECT: { name: 'Perfect Sapphire', effects: [{ stat: 'defense', value: 20 }, { stat: 'blockChance', value: 2 }] },
    },
    YELLOW: {
        CHIPPED: { name: 'Chipped Topaz', effects: [{ stat: 'critChance', value: 1 }] },
        FLAWED: { name: 'Flawed Topaz', effects: [{ stat: 'critChance', value: 2 }] },
        STANDARD: { name: 'Topaz', effects: [{ stat: 'critChance', value: 3 }] },
        FLAWLESS: { name: 'Flawless Topaz', effects: [{ stat: 'critChance', value: 4 }] },
        PERFECT: { name: 'Perfect Topaz', effects: [{ stat: 'critChance', value: 5 }, { stat: 'doubleStrikeChance', value: 2 }] },
    }
};

export const SOCKET_COLOR_CLASSES: Record<SocketColor, { bg: string, border: string, empty: string }> = {
    RED: {
        bg: 'bg-red-500',
        border: 'border-red-500',
        empty: 'border-red-600'
    },
    BLUE: {
        bg: 'bg-blue-500',
        border: 'border-blue-500',
        empty: 'border-blue-600'
    },
    YELLOW: {
        bg: 'bg-yellow-400',
        border: 'border-yellow-400',
        empty: 'border-yellow-500'
    }
};

// --- Achievements ---
export const ACHIEVEMENTS_DATA: Achievement[] = [
    // Combat
    {
        id: 'slayer',
        name: 'Slayer',
        description: 'Vanquish the foes that stand in your way.',
        category: 'Combat',
        stat: 'enemiesDefeated',
        trackingType: 'cumulative',
        tiers: [
            { goal: 1, reward: { type: 'essence', value: 25 }, description: 'Defeat 1 enemy.' },
            { goal: 10, reward: { type: 'xp', value: 100 }, description: 'Defeat 10 enemies.' },
            { goal: 50, reward: { type: 'essence', value: 150 }, description: 'Defeat 50 enemies.' },
            { goal: 100, reward: { type: 'xp', value: 500 }, description: 'Defeat 100 enemies.' },
        ],
    },
    {
        id: 'critMaster',
        name: 'Critical Master',
        description: 'Land critical hits on your enemies.',
        category: 'Combat',
        stat: 'criticalHitsLanded',
        trackingType: 'cumulative',
        tiers: [
            { goal: 10, reward: { type: 'xp', value: 75 }, description: 'Land 10 critical hits.' },
            { goal: 50, reward: { type: 'essence', value: 100 }, description: 'Land 50 critical hits.' },
            { goal: 200, reward: { type: 'xp', value: 300 }, description: 'Land 200 critical hits.' },
        ],
    },
    {
        id: 'swiftStriker',
        name: 'Swift Striker',
        description: 'Perform double strikes in combat.',
        category: 'Combat',
        stat: 'doubleStrikesLanded',
        trackingType: 'cumulative',
        tiers: [
            { goal: 5, reward: { type: 'xp', value: 75 }, description: 'Land 5 double strikes.' },
            { goal: 25, reward: { type: 'essence', value: 100 }, description: 'Land 25 double strikes.' },
        ],
    },
     {
        id: 'untouchable',
        name: 'Untouchable',
        description: 'Win a fight without taking any damage.',
        category: 'Combat',
        stat: 'flawlessVictories',
        trackingType: 'cumulative',
        tiers: [
            { goal: 1, reward: { type: 'essence', value: 50 }, description: 'Achieve 1 flawless victory.' },
            { goal: 5, reward: { type: 'xp', value: 200 }, description: 'Achieve 5 flawless victories.' },
        ],
    },
    {
        id: 'closeCall',
        name: 'Close Call',
        description: 'Win a fight with less than 10% health remaining.',
        category: 'Combat',
        stat: 'clutchVictories',
        trackingType: 'cumulative',
        tiers: [
            { goal: 1, reward: { type: 'essence', value: 75 }, description: 'Achieve 1 clutch victory.' },
            { goal: 3, reward: { type: 'xp', value: 250 }, description: 'Achieve 3 clutch victories.' },
        ],
    },
    // Journey
    {
        id: 'survivor',
        name: 'Survivor',
        description: 'Navigate the treacherous paths and survive.',
        category: 'Journey',
        stat: 'trapsSurvived',
        trackingType: 'cumulative',
        tiers: [
            { goal: 1, reward: { type: 'xp', value: 50 }, description: 'Survive your first trap.' },
            { goal: 5, reward: { type: 'essence', value: 75 }, description: 'Survive 5 traps.' },
            { goal: 20, reward: { type: 'xp', value: 200 }, description: 'Survive 20 traps.' },
        ],
    },
    {
        id: 'badLuck',
        name: 'Bad Luck?',
        description: 'Some days are just not your day.',
        category: 'Journey',
        stat: 'consecutiveTraps',
        trackingType: 'highScore',
        tiers: [
            { goal: 2, reward: { type: 'xp', value: 100 }, description: 'Hit 2 traps in a row.' },
        ],
    },
    {
        id: 'conqueror',
        name: 'Conqueror',
        description: 'Achieve a high number of victories in a single run.',
        category: 'Journey',
        stat: 'victoriesInRun',
        trackingType: 'highScore',
        tiers: [
            { goal: 10, reward: { type: 'essence', value: 150 }, description: 'Reach 10 victories in one run.' },
            { goal: 25, reward: { type: 'xp', value: 500 }, description: 'Reach 25 victories in one run.' },
        ],
    },
    // Whispers
    {
        id: 'artisan',
        name: 'Artisan of Whispers',
        description: 'Master the Deck of Whispers to forge powerful artifacts.',
        category: 'Whispers',
        stat: 'uncommonForged',
        trackingType: 'cumulative',
        tiers: [
            { goal: 1, reward: { type: 'essence', value: 30 }, description: 'Forge an Uncommon (or better) item.' },
        ]
    },
    {
        id: 'master_artisan',
        name: 'Master Artisan',
        description: 'Harness greater power from the Deck of Whispers.',
        category: 'Whispers',
        stat: 'rareForged',
        trackingType: 'cumulative',
        tiers: [
            { goal: 1, reward: { type: 'xp', value: 150 }, description: 'Forge a Rare (or better) item.' },
            { goal: 5, reward: { type: 'essence', value: 200 }, description: 'Forge 5 Rare (or better) items.' },
        ]
    },
    {
        id: 'epic_artisan',
        name: 'Epic Artisan',
        description: 'Forge items of truly epic proportions.',
        category: 'Whispers',
        stat: 'epicForged',
        trackingType: 'cumulative',
        tiers: [
            { goal: 1, reward: { type: 'xp', value: 300 }, description: 'Forge an Epic (or better) item.' },
        ]
    },
    {
        id: 'legendary_artisan',
        name: 'Legendary Artisan',
        description: 'Your name will be sung in legends.',
        category: 'Whispers',
        stat: 'legendaryForged',
        trackingType: 'cumulative',
        tiers: [
            { goal: 1, reward: { type: 'essence', value: 500 }, description: 'Forge a Legendary (or better) item.' },
        ]
    },
    {
        id: 'mythic_artisan',
        name: 'Mythic Artisan',
        description: 'Forge an item that defies reality itself.',
        category: 'Whispers',
        stat: 'mythicForged',
        trackingType: 'cumulative',
        tiers: [
            { goal: 1, reward: { type: 'xp', value: 1000 }, description: 'Forge a Mythic item.' },
        ]
    },
];

export const getInitialPlayerAchievements = (): PlayerAchievements => {
    const achievements: PlayerAchievements = {};
    ACHIEVEMENTS_DATA.forEach(ach => {
        achievements[ach.id] = {
            currentValue: 0,
            unlockedTier: -1,
            claimedTier: -1,
        };
    });
    return achievements;
};


// --- Deck of Whispers Constants ---

export const DECK_OF_WHISPERS_CARDS: Card[] = [
    { id: 1, name: 'Ylem Fragment', type: 'Ashard' },
    { id: 2, name: "Zya's Echo", type: 'Revelation' },
    { id: 3, name: 'Corrupted Ylem', type: 'Fluon', modifier: 'Corrupted' },
    { id: 4, name: 'Unstable Ylem', type: 'Fluon', modifier: 'Unstable' },
    { id: 5, name: 'Harmonized Ylem', type: 'Fluon', modifier: 'Harmonized' },
    { id: 6, name: 'AHYBE Resonance', type: 'Ascendant' },
    { id: 7, name: "Fyxion's Glimpse", type: 'Ascendant' },
    { id: 8, name: "Void's Whisper", type: 'Ascendant' },
];

export const RARITY_COLORS: Record<Rarity, string> = {
    Common: 'text-gray-300',
    Uncommon: 'text-green-400',
    Rare: 'text-blue-400',
    'Rare+': 'text-blue-300',
    Epic: 'text-purple-400',
    Legendary: 'text-orange-400',
    Mythic: 'text-yellow-400',
};

export const RARITY_BORDER_COLORS: Record<Rarity, string> = {
    Common: 'border-gray-600',
    Uncommon: 'border-green-600',
    Rare: 'border-blue-600',
    'Rare+': 'border-blue-500 shadow-lg shadow-blue-500/50',
    Epic: 'border-purple-600 shadow-lg shadow-purple-600/50',
    Legendary: 'border-orange-500 shadow-xl shadow-orange-500/60',
    Mythic: 'border-yellow-400 shadow-2xl shadow-yellow-400/70 animate-pulse-glow',
};

export const RARITY_STAT_MODIFIERS: Record<Rarity, number> = {
    Common: 1.0,
    Uncommon: 1.2,
    Rare: 1.5,
    'Rare+': 1.7,
    Epic: 2.0,
    Legendary: 2.5,
    Mythic: 3.0,
};

export const RARITY_RANK: Record<Rarity, number> = {
    Common: 0,
    Uncommon: 1,
    Rare: 2,
    'Rare+': 3,
    Epic: 4,
    Legendary: 5,
    Mythic: 6,
};

export const RARITY_ESSENCE_MAP: Record<Rarity, number> = {
    Common: 2,
    Uncommon: 5,
    Rare: 10,
    'Rare+': 15,
    Epic: 30,
    Legendary: 75,
    Mythic: 200,
};

export const GEAR_SCORE_WEIGHTS = {
    attack: 2.5,
    defense: 2.5,
    critChance: 2.5,
    critDamage: 0.8,
    doubleStrikeChance: 3.5,
    blockChance: 2.5,
    procChance: 1,
    procDamage: 0.8,
};