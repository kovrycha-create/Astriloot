import type { Enemy, CombatOutcome, JourneyEvent, JourneyEventType } from '../types';

const mockEnemiesTier1: Omit<Enemy, 'health' | 'imageBase64'>[] = [
    {
        name: "Cave Goblin",
        level: 1,
        description: "A small, wicked creature lurking in the shadows, armed with a crude spear.",
        maxHealth: 60, attack: 8, defense: 4, critChance: 5, critDamage: 120, doubleStrikeChance: 1, blockChance: 2, activeStatusEffects: [],
        loot: { name: "Rusty Dagger", description: "A simple, worn dagger.", type: 'weapon', attack: 3, defense: 0, critChance: 2 }
    },
    {
        name: "Giant Rat",
        level: 2,
        description: "An unnaturally large rodent with vicious fangs and beady red eyes.",
        maxHealth: 50, attack: 10, defense: 2, critChance: 8, critDamage: 130, doubleStrikeChance: 2, blockChance: 0, activeStatusEffects: [],
        loot: { name: "Tattered Leather Scraps", description: "Scraps of leather, better than nothing.", type: 'armor', attack: 0, defense: 2 }
    },
    {
        name: "Venomous Spider",
        level: 2,
        description: "A fist-sized spider that drips a potent neurotoxin from its fangs.",
        maxHealth: 45, attack: 11, defense: 3, critChance: 10, critDamage: 130, doubleStrikeChance: 2, blockChance: 1, activeStatusEffects: [],
        loot: { name: "Spider Fang", description: "A sharp, venom-coated fang.", type: 'weapon', attack: 2, defense: 0, procEffect: { type: 'Poison', chance: 25, damage: 3, duration: 3} }
    },
    {
        name: "Wild Boar",
        level: 3,
        description: "A territorial boar with thick hide and razor-sharp tusks.",
        maxHealth: 90, attack: 10, defense: 6, critChance: 4, critDamage: 130, doubleStrikeChance: 1, blockChance: 4, activeStatusEffects: [],
        loot: { name: "Toughened Boar Hide", description: "A surprisingly resilient piece of leather armor.", type: 'armor', attack: 0, defense: 4, blockChance: 2 }
    },
    {
        name: "Dire Wolf",
        level: 3,
        description: "A large, aggressive wolf with mangy fur and powerful jaws.",
        maxHealth: 75, attack: 12, defense: 5, critChance: 10, critDamage: 140, doubleStrikeChance: 3, blockChance: 3, activeStatusEffects: [],
        loot: { name: "Wolf Fang Charm", description: "A sharp tooth on a leather cord.", type: 'weapon', attack: 4, defense: 0 }
    },
    {
        name: "Kobold Skirmisher",
        level: 4,
        description: "A small, reptilian humanoid that darts in and out of combat.",
        maxHealth: 65, attack: 9, defense: 6, critChance: 7, critDamage: 150, doubleStrikeChance: 4, blockChance: 5, activeStatusEffects: [],
        loot: { name: "Crude Shortsword", description: "A poorly-made but effective shortsword.", type: 'weapon', attack: 3, defense: 0, doubleStrikeChance: 1 }
    }
];

const mockEnemiesTier2: Omit<Enemy, 'health' | 'imageBase64'>[] = [
    {
        name: "Orc Grunt",
        level: 6,
        description: "A brutish greenskin warrior wielding a hefty axe.",
        maxHealth: 120, attack: 18, defense: 10, critChance: 5, critDamage: 150, doubleStrikeChance: 2, blockChance: 8, activeStatusEffects: [],
        loot: { name: "Orcish Battleaxe", description: "A heavy, intimidating axe.", type: 'weapon', attack: 8, defense: 0 }
    },
    {
        name: "Harpy Screecher",
        level: 7,
        description: "A winged terror whose shriek can disorient prey before it strikes with sharp talons.",
        maxHealth: 80, attack: 19, defense: 7, critChance: 10, critDamage: 150, doubleStrikeChance: 8, blockChance: 6, activeStatusEffects: [],
        loot: { name: "Harpy Talon Gauntlet", description: "A weapon that enables rapid strikes.", type: 'weapon', attack: 6, defense: 0, doubleStrikeChance: 4 }
    },
    {
        name: "Hobgoblin Archer",
        level: 8,
        description: "A disciplined goblinoid soldier that prefers to strike from a distance.",
        maxHealth: 90, attack: 20, defense: 8, critChance: 12, critDamage: 160, doubleStrikeChance: 3, blockChance: 4, activeStatusEffects: [],
        loot: { name: "Reinforced Leather Tunic", description: "Tough leather armor with metal studs.", type: 'armor', attack: 0, defense: 6, critChance: 2 }
    },
    {
        name: "Living Gargoyle",
        level: 9,
        description: "A stone sentinel animated by ancient magic, its hide is as hard as granite.",
        maxHealth: 110, attack: 14, defense: 18, critChance: 3, critDamage: 140, doubleStrikeChance: 0, blockChance: 15, activeStatusEffects: [],
        loot: { name: "Gargoyle Stoneplate", description: "A breastplate carved from the creature's remains.", type: 'armor', attack: 0, defense: 9, blockChance: 5 }
    },
    {
        name: "Grave Slime",
        level: 10,
        description: "An amorphous blob that reeks of decay and corrosion.",
        maxHealth: 100, attack: 15, defense: 15, critChance: 2, critDamage: 150, doubleStrikeChance: 0, blockChance: 0, activeStatusEffects: [],
        loot: { name: "Corrosive Gloop", description: "A weapon that seems to eat at armor.", type: 'weapon', attack: 5, defense: 0, procEffect: { type: 'Poison', chance: 20, damage: 5, duration: 3} }
    },
    {
        name: "Fire Salamander",
        level: 11,
        description: "A lizard-like creature that thrives in extreme heat, its skin shimmers with embers.",
        maxHealth: 105, attack: 18, defense: 12, critChance: 8, critDamage: 160, doubleStrikeChance: 3, blockChance: 5, activeStatusEffects: [],
        loot: { name: "Smoldering Brand", description: "A blade that seems to perpetually burn.", type: 'weapon', attack: 7, defense: 0, procEffect: { type: 'Burn', chance: 20, damage: 6, duration: 2} }
    },
    {
        name: "Shadow Stalker",
        level: 12,
        description: "A being of pure darkness with gleaming red eyes that strikes with blinding speed.",
        maxHealth: 110, attack: 22, defense: 6, critChance: 15, critDamage: 180, doubleStrikeChance: 5, blockChance: 5, activeStatusEffects: [],
        loot: { name: "Shadow-Stitched Cloak", description: "A cloak that seems to absorb light.", type: 'armor', attack: 0, defense: 5, critChance: 5, doubleStrikeChance: 2 }
    }
];

const mockEnemiesTier3: Omit<Enemy, 'health' | 'imageBase64'>[] = [
    {
        name: "Stone Golem",
        level: 16,
        description: "A lumbering construct of rock and moss, nearly impervious to harm.",
        maxHealth: 200, attack: 25, defense: 20, critChance: 3, critDamage: 160, doubleStrikeChance: 0, blockChance: 20, activeStatusEffects: [],
        loot: { name: "Golem Core Fragment", description: "A heavy chunk of enchanted stone.", type: 'armor', attack: 0, defense: 12, blockChance: 8 }
    },
    {
        name: "Wailing Wraith",
        level: 17,
        description: "An incorporeal remnant of a tormented soul, its touch drains life.",
        maxHealth: 150, attack: 26, defense: 10, critChance: 10, critDamage: 170, doubleStrikeChance: 4, blockChance: 25, activeStatusEffects: [],
        loot: { name: "Ethereal Shroud", description: "A cloak that seems to phase in and out of reality.", type: 'armor', attack: 0, defense: 7, blockChance: 10 }
    },
    {
        name: "Troll Brawler",
        level: 18,
        description: "A hulking troll with incredible regenerative abilities and a foul temper.",
        maxHealth: 180, attack: 28, defense: 14, critChance: 6, critDamage: 150, doubleStrikeChance: 1, blockChance: 10, activeStatusEffects: [],
        loot: { name: "Troll-Hide Belt", description: "A thick belt that seems to slowly mend itself.", type: 'armor', attack: 0, defense: 8, critDamage: 10 }
    },
    {
        name: "Ogre Mauler",
        level: 19,
        description: "A dim-witted but incredibly strong ogre wielding a massive, tree-trunk club.",
        maxHealth: 250, attack: 32, defense: 15, critChance: 5, critDamage: 150, doubleStrikeChance: 0, blockChance: 8, activeStatusEffects: [],
        loot: { name: "Ogre's Greatclub", description: "A crude but devastatingly effective weapon.", type: 'weapon', attack: 18, defense: 0, critDamage: 20 }
    },
    {
        name: "Swamp Hydra",
        level: 20,
        description: "A multi-headed reptilian beast that emerges from the murky depths.",
        maxHealth: 220, attack: 24, defense: 16, critChance: 8, critDamage: 160, doubleStrikeChance: 8, blockChance: 5, activeStatusEffects: [],
        loot: { name: "Hydra Scale Shield", description: "A shield made from the resilient scales of a hydra.", type: 'armor', attack: 0, defense: 10, procEffect: { type: 'Poison', chance: 10, damage: 8, duration: 2} }
    },
    {
        name: "Plague Carrion",
        level: 21,
        description: "A grotesque, bird-like beast that spreads filth and disease with every beat of its ragged wings.",
        maxHealth: 170, attack: 22, defense: 18, critChance: 5, critDamage: 150, doubleStrikeChance: 2, blockChance: 5, activeStatusEffects: [],
        loot: { name: "Plague-Tipped Beak", description: "A vicious weapon that carries a potent toxin.", type: 'weapon', attack: 12, defense: 0, procEffect: { type: 'Poison', chance: 40, damage: 8, duration: 4} }
    },
     {
        name: "Minotaur",
        level: 22,
        description: "A powerful bull-headed humanoid that charges with immense force.",
        maxHealth: 190, attack: 35, defense: 12, critChance: 10, critDamage: 170, doubleStrikeChance: 4, blockChance: 12, activeStatusEffects: [],
        loot: { name: "Labyrinth Greataxe", description: "A massive axe that feels ancient.", type: 'weapon', attack: 15, defense: 0, critChance: 5 }
    }
];

const mockEnemiesTier4: Omit<Enemy, 'health' | 'imageBase64'>[] = [
    {
        name: "Fire Drake",
        level: 26,
        description: "A lesser dragon, but its fiery breath and armored scales are still a deadly threat.",
        maxHealth: 300, attack: 40, defense: 25, critChance: 12, critDamage: 180, doubleStrikeChance: 5, blockChance: 15, activeStatusEffects: [],
        loot: { name: "Drake-Scale Pauldrons", description: "Shoulder armor that is warm to the touch.", type: 'armor', attack: 0, defense: 15, critDamage: 15 }
    },
    {
        name: "Crypt Lord",
        level: 27,
        description: "An ancient lich, master of necromancy, clad in decaying finery and wielding immense dark power.",
        maxHealth: 320, attack: 42, defense: 26, critChance: 15, critDamage: 180, doubleStrikeChance: 6, blockChance: 12, activeStatusEffects: [],
        loot: { name: "Scepter of the Damned", description: "A staff that pulses with necrotic energy.", type: 'weapon', attack: 15, defense: 0, critChance: 8, procEffect: { type: 'Bleed', chance: 25, damage: 12, duration: 3} }
    },
    {
        name: "Frost Giant",
        level: 28,
        description: "A colossal giant from the frozen peaks, wielding an icy club.",
        maxHealth: 350, attack: 38, defense: 28, critChance: 8, critDamage: 160, doubleStrikeChance: 2, blockChance: 18, activeStatusEffects: [],
        loot: { name: "Giant's Icy Club", description: "A club that chills foes on hit.", type: 'weapon', attack: 20, defense: 0, doubleStrikeChance: -2 }
    },
    {
        name: "Obsidian Juggernaut",
        level: 29,
        description: "A golem forged from volcanic glass and unholy magic, it is a slow but unstoppable force of destruction.",
        maxHealth: 400, attack: 35, defense: 35, critChance: 5, critDamage: 160, doubleStrikeChance: 0, blockChance: 25, activeStatusEffects: [],
        loot: { name: "Juggernaut's Plating", description: "Armor so thick it feels like wearing a fortress.", type: 'armor', attack: 0, defense: 20, blockChance: 10, critChance: -5 }
    },
    {
        name: "Chimera",
        level: 30,
        description: "A monstrous creature with the heads of a lion, a goat, and a dragon.",
        maxHealth: 320, attack: 45, defense: 22, critChance: 15, critDamage: 190, doubleStrikeChance: 10, blockChance: 10, activeStatusEffects: [],
        loot: { name: "Chimera's Maw", description: "A chaotic weapon imbued with multiple essences.", type: 'weapon', attack: 18, defense: 0, procEffect: { type: 'Poison', chance: 15, damage: 10, duration: 3} }
    },
    {
        name: "Magma Wyrm",
        level: 32,
        description: "A serpentine dragon-kin that swims through molten rock, its scales are white-hot.",
        maxHealth: 360, attack: 48, defense: 24, critChance: 10, critDamage: 180, doubleStrikeChance: 8, blockChance: 10, activeStatusEffects: [],
        loot: { name: "Wyrmtooth Blade", description: "A jagged sword crafted from the tooth of a magma wyrm, it burns with intense heat.", type: 'weapon', attack: 22, defense: 0, procEffect: { type: 'Burn', chance: 30, damage: 15, duration: 2} }
    }
];


const mockJourneyEvents: JourneyEvent[] = [
    {
        type: 'treasure',
        narrative: "You stumble upon an old, forgotten chest partially buried under a gnarled root. It clicks open with a bit of force.",
        outcome: {
            xpGained: 0,
            healthChange: 0,
            itemDropped: { name: "Adventurer's Boots", description: "Sturdy leather boots, well-worn but reliable.", type: 'armor', attack: 0, defense: 3, blockChance: 2 }
        }
    },
    {
        type: 'shrine',
        narrative: "A serene, glowing shrine stands in a quiet clearing. As you approach, a wave of warmth washes over you, mending your wounds.",
        outcome: {
            xpGained: 25,
            healthChange: 50,
            itemDropped: null
        }
    },
    {
        type: 'trap',
        narrative: "A hidden pressure plate gives way beneath your feet, releasing a volley of darts from the walls! You manage to block most of them, but not all.",
        outcome: {
            xpGained: 0,
            healthChange: -20,
            itemDropped: null
        }
    },
     {
        type: 'discovery',
        narrative: "You find ancient, weathered runes carved into a standing stone. Deciphering them gives you a new insight into the world.",
        outcome: {
            xpGained: 50,
            healthChange: 0,
            itemDropped: null
        }
    },
    {
        type: 'echoing_cairn',
        narrative: "You discover a mysterious, moss-covered stone monument that hums with latent memories. It invites you to reflect on a pivotal moment from your journey, to draw strength from the memory.",
    }
];

const mockDilemmaEvent: JourneyEvent = {
    type: 'dilemma',
    narrative: "You find a goblin caught in a crude trap, whimpering. It seems to be just a juvenile. It eyes you with a mix of fear and defiance.",
    choices: [
        {
            text: "Free the goblin.",
            possibleOutcomes: [
                { chance: 70, aftermath: "You cut the ropes. The goblin gives a grateful nod before scurrying into the shadows. You feel you've done the right thing.", outcome: { xpGained: 50, healthChange: 0, itemDropped: null } },
                { chance: 20, aftermath: "As you free it, the goblin panics and bites your hand before running away.", outcome: { xpGained: 10, healthChange: -15, itemDropped: null } },
                { chance: 10, aftermath: "The goblin's parent, a much larger goblin, emerges from the bushes. Seeing your act of kindness, it grunts and tosses you a small pouch before dragging its child away.", outcome: { xpGained: 20, healthChange: 0, itemDropped: { name: "Goblin-Stitched Pouch", description: "A surprisingly sturdy pouch.", type: 'armor', attack: 0, defense: 2, blockChance: 1 } } }
            ]
        },
        {
            text: "Leave it. Not your problem.",
            possibleOutcomes: [
                { chance: 100, aftermath: "You turn your back on the creature's plight and continue on your way, the whimpering fading behind you.", outcome: { xpGained: 0, healthChange: 0, itemDropped: null } }
            ]
        },
        {
            text: "Investigate for loot.",
            possibleOutcomes: [
                { chance: 60, aftermath: "You rummage through its dirty loincloth but find nothing of value. The goblin snarls at you.", outcome: { xpGained: 5, healthChange: 0, itemDropped: null } },
                { chance: 30, aftermath: "You find a shiny rock, but as you reach for it, the goblin bites your hand!", outcome: { xpGained: 5, healthChange: -10, itemDropped: null } },
                { chance: 10, aftermath: "It seems the goblin was guarding a small, hidden stash! You find a crude but sharp dagger.", outcome: { xpGained: 10, healthChange: 0, itemDropped: { name: "Goblin Shiv", description: "A nasty-looking pointed blade.", type: 'weapon', attack: 4, defense: 0, critChance: 1 } } }
            ]
        }
    ]
};

const mockMerchantEvent = (playerLevel: number): JourneyEvent => {
    const levelMultiplier = 1 + (playerLevel / 5);
    return {
        type: 'merchant',
        narrative: "You find a mysterious, hooded figure tending a small stall. Their wares glitter with arcane energy.",
        inventory: [
            {
                id: 'potion_1',
                name: 'Minor Health Potion',
                description: 'A bubbling red liquid that restores a bit of health.',
                cost: Math.floor(25 * levelMultiplier),
                type: 'potion',
                healthValue: 50
            },
            {
                id: 'item_1',
                name: 'Traveler\'s Blade',
                description: 'A well-balanced shortsword.',
                cost: Math.floor(60 * levelMultiplier),
                type: 'item',
                itemBase: {
                    name: 'Traveler\'s Blade',
                    description: 'A well-balanced shortsword, perfect for a long journey.',
                    type: 'weapon',
                    attack: Math.floor(5 * levelMultiplier),
                    defense: 0,
                    critChance: 2,
                }
            },
            {
                id: 'item_2',
                name: 'Reinforced Leather Jerkin',
                description: 'A sturdy piece of armor.',
                cost: Math.floor(55 * levelMultiplier),
                type: 'item',
                itemBase: {
                    name: 'Reinforced Leather Jerkin',
                    description: 'Tough boiled leather provides decent protection.',
                    type: 'armor',
                    attack: 0,
                    defense: Math.floor(4 * levelMultiplier),
                    blockChance: 1,
                }
            }
        ]
    };
};

const mockJourneyAssets = [
    { narrative: "The air grows cold as you enter the Shadowfen Marshes.", mapPrompt: "A fantasy map of a dark, swampy marshland." },
    { narrative: "Sun-scorched rocks surround you in the Dragon's Tooth canyon.", mapPrompt: "A fantasy map of a dry, rocky canyon pass." },
    { narrative: "You push through the unnaturally thick vines of the Whispering Jungle.", mapPrompt: "A fantasy map of a dense, mystical jungle." }
];

export const generateEnemy = async (difficulty: number, playerLevel: number, forceNoLoot: boolean): Promise<Omit<Enemy, 'health' | 'imageBase64'>> => {
    let monsterPool: Omit<Enemy, 'health' | 'imageBase64'>[];

    // Use victories (difficulty) to determine the monster tier for better progression.
    if (difficulty <= 5) {
        monsterPool = mockEnemiesTier1;
    } else if (difficulty <= 15) {
        monsterPool = mockEnemiesTier2;
    } else if (difficulty <= 25) {
        monsterPool = mockEnemiesTier3;
    } else {
        monsterPool = mockEnemiesTier4;
    }

    const randomIndex = Math.floor(Math.random() * monsterPool.length);
    // Deep copy to avoid modifying the original mock object
    const enemy = JSON.parse(JSON.stringify(monsterPool[randomIndex]));
    
    // Add a slight scaling based on player level to make enemies tougher over time within a tier.
    // This ensures progression doesn't feel stalled if the player levels up but stays in the same victory tier.
    const levelScaleFactor = 1 + (playerLevel - 1) * 0.075; // 7.5% stat increase per level
    enemy.maxHealth = Math.floor(enemy.maxHealth * levelScaleFactor);
    enemy.attack = Math.floor(enemy.attack * levelScaleFactor);
    enemy.defense = Math.floor(enemy.defense * levelScaleFactor);
    enemy.level = playerLevel;

    if (forceNoLoot) {
        enemy.loot = null;
    }

    return Promise.resolve(enemy);
};

export const generateJourneyEvent = async (playerLevel: number, victories: number, eventType?: JourneyEventType): Promise<JourneyEvent> => {
    if (eventType === 'merchant') {
        return Promise.resolve(mockMerchantEvent(playerLevel));
    }
    if (eventType === 'dilemma') {
        return Promise.resolve(JSON.parse(JSON.stringify(mockDilemmaEvent)));
    }
    
    let eventTemplate;
    if (eventType) {
        eventTemplate = mockJourneyEvents.find(e => e.type === eventType) || mockJourneyEvents[0];
    } else {
        const randomIndex = Math.floor(Math.random() * mockJourneyEvents.length);
        eventTemplate = mockJourneyEvents[randomIndex];
    }
    
    const event = JSON.parse(JSON.stringify(eventTemplate)); // Deep copy

    if (event.type === 'trap' && event.outcome) {
        const minDamage = 10;
        const maxDamage = 25;
        // Scale damage based on victories, capping at 50 victories for max scaling.
        const scaleFactor = Math.min(1, victories / 50);
        
        const scaledMin = minDamage;
        const scaledMax = minDamage + Math.floor((maxDamage - minDamage) * scaleFactor);
        
        const damage = Math.floor(Math.random() * (scaledMax - scaledMin + 1)) + scaledMin;
        
        event.outcome.healthChange = -damage;
    }

    return Promise.resolve(event);
};


export const generateJourneyAssets = async (victories: number, playerLevel: number): Promise<{narrative: string, mapPrompt: string}> => {
    const randomIndex = Math.floor(Math.random() * mockJourneyAssets.length);
    return Promise.resolve(mockJourneyAssets[randomIndex]);
};

export const generateMapImage = async (prompt: string): Promise<string | null> => {
    // Return a placeholder image URL for mock mode.
    // Using a random seed to get different maps.
    const seed = Math.floor(Math.random() * 1000);
    return Promise.resolve(`https://picsum.photos/seed/${seed}/1280/720`);
};

export const generateEnemyImage = async (description: string): Promise<string | null> => {
    // Returning null to indicate no AI image generation in mock mode
    return Promise.resolve(null);
};

export const streamCombatNarrative = async function*(outcome: CombatOutcome): AsyncGenerator<string, void, undefined> {
    const { actorName, targetName, damage, isCrit, didProc, didBlock } = outcome;
    
    if(didBlock) {
      yield `${targetName} blocks the attack from ${actorName}!`;
      return;
    }

    let message = `${actorName} strikes ${targetName} for ${damage} damage.`;
    if (isCrit) message = `${actorName} lands a CRITICAL HIT on ${targetName} for ${damage} damage!`;
    if (didProc) message += ` The attack inflicts ${didProc}!`;
    yield message;
};

export const streamIdleNarrative = async function*(victories: number): AsyncGenerator<string, void, undefined> {
    yield `You have defeated ${victories} foes and continue your journey.`;
};