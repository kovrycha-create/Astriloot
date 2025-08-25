
import { GoogleGenAI, Type } from "@google/genai";
import type { Enemy, CombatOutcome, Item, JourneyEvent, JourneyEventType } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// In-memory cache for generated images. Key: enemy name, Value: base64 string
const enemyImageCache = new Map<string, string>();
const itemImageCache = new Map<string, string>();


const procEffectSchema = {
    type: Type.OBJECT,
    description: "An on-hit status effect the weapon can apply.",
    properties: {
        type: { type: Type.STRING, enum: ['Bleed', 'Poison', 'Burn'], description: "The type of damage over time." },
        chance: { type: Type.INTEGER, description: "The percentage chance (1-100) to apply the effect." },
        damage: { type: Type.INTEGER, description: "The damage dealt per turn by the effect." },
        duration: { type: Type.INTEGER, description: "The number of turns the effect lasts." },
    },
    required: ["type", "chance", "damage", "duration"],
};

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The item's evocative and cool name." },
        description: { type: Type.STRING, description: "A brief, flavorful description of the item." },
        type: { type: Type.STRING, enum: ['weapon', 'armor'], description: "The item's type." },
        attack: { type: Type.INTEGER, description: "Base attack power. 0 for most armor." },
        defense: { type: Type.INTEGER, description: "Base defense granted. 0 for most weapons." },
        critChance: { type: Type.INTEGER, description: "Bonus critical hit chance percentage. Optional.", nullable: true },
        critDamage: { type: Type.INTEGER, description: "Bonus critical hit damage percentage. Optional.", nullable: true },
        doubleStrikeChance: { type: Type.INTEGER, description: "Bonus double strike chance percentage. Optional.", nullable: true },
        blockChance: { type: Type.INTEGER, description: "Bonus block chance percentage. Optional for armor.", nullable: true },
        procEffect: { ...procEffectSchema, nullable: true, description: "An on-hit effect. Only for weapons. Optional." }
    },
    required: ["name", "description", "type", "attack", "defense"],
};

const enemySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The creature's unique and evocative name." },
        level: { type: Type.INTEGER, description: "The creature's level, which should be equal to the player's level." },
        description: { type: Type.STRING, description: "A brief, two-sentence description of the creature's appearance and nature." },
        maxHealth: { type: Type.INTEGER, description: "The creature's maximum health points, between 50 and 300." },
        attack: { type: Type.INTEGER, description: "The creature's attack power." },
        defense: { type: Type.INTEGER, description: "The creature's defense value." },
        critChance: { type: Type.INTEGER, description: "The creature's base critical hit chance (e.g., 5 for 5%)." },
        critDamage: { type: Type.INTEGER, description: "The creature's base critical damage multiplier (e.g., 150 for 150%)." },
        doubleStrikeChance: { type: Type.INTEGER, description: "The creature's base double strike chance (e.g., 2 for 2%)." },
        blockChance: { type: Type.INTEGER, description: "The creature's base block chance percentage (e.g., 5 for 5%)." },
        vasDropped: { type: Type.INTEGER, description: "Amount of Vas (common currency) dropped on defeat. Should be a reasonable amount for the creature's level." },
        loot: {
            type: Type.OBJECT,
            description: "An item the creature might drop. Can be null.",
            properties: itemSchema.properties,
            nullable: true,
        },
        activeStatusEffects: {
            type: Type.ARRAY,
            description: "Should always be an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['Bleed', 'Poison', 'Burn'] },
                    damage: { type: Type.INTEGER },
                    duration: { type: Type.INTEGER },
                },
            }
        }
    },
    required: ["name", "level", "description", "maxHealth", "attack", "defense", "critChance", "critDamage", "doubleStrikeChance", "blockChance", "vasDropped", "loot", "activeStatusEffects"],
};

const journeyEventOutcomeSchema = {
    type: Type.OBJECT,
    properties: {
        xpGained: { type: Type.INTEGER, description: "Experience points gained. Can be 0." },
        healthChange: { type: Type.INTEGER, description: "Player health change. Positive for healing, negative for damage. Can be 0." },
        itemDropped: {
            type: Type.OBJECT,
            description: "An item found during the event. Can be null.",
            properties: itemSchema.properties,
            nullable: true,
        },
    },
    required: ["xpGained", "healthChange", "itemDropped"],
};

const priceSchema = {
    type: Type.OBJECT,
    description: "The cost of the item in one or both currencies. At least one currency must be present.",
    properties: {
        vas: { type: Type.INTEGER, nullable: true, description: "Cost in Vas, the common currency." },
        ae: { type: Type.INTEGER, nullable: true, description: "Cost in Arcane Essence (AE), the rare currency." },
    },
};

const shopItemSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique ID for the item, e.g., 'potion_1' or 'sword_of_embers'." },
        name: { type: Type.STRING, description: "The item's name." },
        description: { type: Type.STRING, description: "A brief, flavorful description." },
        price: priceSchema,
        type: { type: Type.STRING, enum: ['potion', 'item'], description: "The type of shop item." },
        healthValue: { type: Type.INTEGER, nullable: true, description: "If it's a potion, how much health it restores." },
        itemBase: { ...itemSchema, nullable: true, description: "If it's an item, the base stats object. Omit rarity." }
    },
    required: ["id", "name", "description", "price", "type"]
};

const possibleOutcomeSchema = {
    type: Type.OBJECT,
    properties: {
        chance: { type: Type.INTEGER, description: "The percentage chance (1-100) of this outcome occurring. The sum of chances for all outcomes within a choice must equal 100." },
        aftermath: { type: Type.STRING, description: "A one to two sentence narrative describing the immediate result of this outcome." },
        outcome: journeyEventOutcomeSchema,
    },
    required: ["chance", "aftermath", "outcome"],
};

const dilemmaChoiceSchema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING, description: "The text for the choice button, e.g., 'Investigate the light'." },
        possibleOutcomes: {
            type: Type.ARRAY,
            description: "An array of possible outcomes for this choice. The sum of 'chance' for all items in this array must be 100.",
            items: possibleOutcomeSchema,
        }
    },
    required: ["text", "possibleOutcomes"],
};

const valueBuySchema = {
    type: Type.OBJECT,
    properties: {
        enabled: { type: Type.BOOLEAN },
        itemId: { type: Type.STRING, nullable: true, description: "The ID of an item from the main inventory that is the value buy." },
        discountPct: { type: Type.NUMBER, nullable: true, description: "The discount percentage as a decimal (e.g., 0.3 for 30% off)." },
    },
    required: ["enabled"],
};

const journeyEventSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['treasure', 'shrine', 'trap', 'discovery', 'merchant', 'dilemma', 'echoing_cairn'], description: "The type of event." },
        narrative: { type: Type.STRING, description: "A brief, two to three sentence, evocative description of the event." },
        outcome: {
            ...journeyEventOutcomeSchema,
            nullable: true,
            description: "Outcome for standard events. Null for merchant, dilemma, or echoing_cairn events."
        },
        inventory: {
            type: Type.ARRAY,
            nullable: true,
            description: "An array of items for sale. Only for merchant events.",
            items: shopItemSchema
        },
        choices: {
            type: Type.ARRAY,
            nullable: true,
            description: "An array of choices for the player. Only for dilemma or echoing_cairn events.",
            items: dilemmaChoiceSchema
        },
        locationTag: {
            type: Type.STRING,
            enum: ['camp', 'town'],
            nullable: true,
            description: "For merchant events, specifies the location type. Use 'camp'."
        },
        valueBuy: {
            ...valueBuySchema,
            nullable: true,
            description: "For merchant events, specifies a special deal."
        }
    },
    required: ["type", "narrative"],
};


export const generateJourneyEvent = async (playerLevel: number, victories: number, eventType: JourneyEventType): Promise<JourneyEvent> => {
    let prompt;
    if (eventType === 'merchant') {
         prompt = `You are a dungeon master for an idle RPG with a dual-currency economy: common 'Vas' and rare 'Arcane Essence' (ae).
Generate a 'merchant' journey event for a level ${playerLevel} hero.
- The merchant's 'narrative' field should be unique and thematic.
- The 'locationTag' should be 'camp'.
- The 'inventory' should contain 2-4 items.
- Prices should be balanced for a level ${playerLevel} hero. Use Vas for common items (potions), AE for powerful item bases, and sometimes a mix of both.
- For example: A health potion might cost { "vas": 150 }. A basic sword might cost { "vas": 400 }. A magical item base might cost { "ae": 50 }, or a powerful one could cost { "vas": 500, "ae": 25 }.
- The 'valueBuy' should have enabled: false, as this is a simple camp merchant.
- Return a single JSON object matching the required schema. The 'outcome' and 'choices' properties must be null.`;
    } else if (eventType === 'dilemma') {
        prompt = `You are a dungeon master for an idle RPG. Generate a 'dilemma' journey event for a level ${playerLevel} hero.
The event must be of type 'dilemma'.
The 'narrative' should be an evocative, two to three sentence description of a choice-based scenario.
The 'choices' array must contain 2 or 3 distinct options for the player.
Each choice must have a 'possibleOutcomes' array containing 1 to 3 possible results.
For each possible outcome, provide:
- 'chance': An integer percentage (1-100). The sum of chances for all outcomes within a single choice MUST equal 100.
- 'aftermath': A short narrative describing what happens for that specific outcome.
- 'outcome': An object with XP, health change, and loot, balanced for the hero's level. Outcomes should be logical consequences.
For example, a risky choice might have a 10% chance of a great reward, a 60% chance of a minor penalty, and a 30% chance of nothing happening. A safe choice might have a 100% chance of a small, predictable outcome.
Return a single JSON object matching the required schema. The top-level 'outcome' and 'inventory' properties must be null.`;
    } else {
        const eventTypeInstruction = `The event must be of type '${eventType}'.`;
        
        let trapDamageInstruction = "For 'trap' events, healthChange should be negative.";
        if (eventType === 'trap') {
            trapDamageInstruction = `For this 'trap' event, the healthChange must be a negative number representing damage. This damage must be between 10 and 25. The amount of damage MUST scale with the hero's ${victories} victories. For example, a hero with 0 victories takes around -10 damage, while a hero with 50+ victories takes closer to -25 damage.`;
        }
        
        prompt = `You are a dungeon master for an idle RPG. Generate a random, non-combat journey event for a level ${playerLevel} hero with ${victories} victories.
${eventTypeInstruction}
The outcome (XP, health change, loot) should be balanced for the hero's level.
For 'shrine' events, healthChange should be positive. ${trapDamageInstruction} For 'treasure' events, an item should be dropped. For 'discovery' events, award some XP.
For 'echoing_cairn' events, the 'outcome' must be null. The narrative should describe a mysterious, humming stone that seems to react to the hero's memories.
Return a single JSON object matching the required schema. The item should have base stats, its final power will be determined by a game mechanic. Items can have bonus stats like critChance, critDamage, or on-hit procEffects. The 'inventory' and 'choices' properties must be null.`;
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: journeyEventSchema,
            temperature: 1,
        },
    });
    
    const jsonString = response.text.trim();
    let parsedEvent = JSON.parse(jsonString) as JourneyEvent;
    // Ensure the generated event type matches the requested type
    parsedEvent.type = eventType;
    return parsedEvent;
};


export const generateEnemy = async (difficulty: number, playerLevel: number, forceNoLoot: boolean): Promise<Omit<Enemy, 'health' | 'imageBase64'>> => {
    const lootInstruction = forceNoLoot
        ? "IMPORTANT: The hero recently found treasure, so this enemy MUST NOT drop any loot. The 'loot' property must be null."
        : "It has a chance to drop a piece of loot (a weapon or armor) with base stats and potentially bonus stats (crit, block, etc) or a procEffect for weapons. The item's final power will be determined by a game mechanic.";

    const prompt = `Generate a unique, fantasy RPG monster for a level ${playerLevel} hero who has defeated ${difficulty} enemies. The monster should be a suitable challenge.
The monster's level must be ${playerLevel}.
The monster's stats (health, attack, defense, etc.) should be balanced for a hero of the same level. A moderately geared hero should be able to win, but it should be a challenge. Avoid making the monster overwhelmingly powerful or trivially easy.
Thematically, for low-level heroes (1-5), generate common fantasy creatures like wolves, or large insects. For mid-level heroes (6-15), create more formidable foes like orcs, trolls, or minor elementals. For high-level heroes (16+), generate epic and dangerous creatures like drakes, demons, or powerful constructs.
It MUST drop an amount of 'vasDropped' (common currency), appropriate for its level. e.g. a level 1 enemy might drop 10-20 vas, a level 20 enemy might drop 200-300 vas.
${lootInstruction} The 'activeStatusEffects' property must be an empty array.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: enemySchema,
            temperature: 1,
        },
    });
    
    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as Omit<Enemy, 'health' | 'imageBase64'>;
};

export const generateJourneyAssets = async (victories: number, playerLevel: number): Promise<{narrative: string, mapPrompt: string}> => {
    const prompt = `You are a dungeon master. A level ${playerLevel} hero has won ${victories} battles.
1.  Write a one or two-sentence, evocative narrative describing the hero's journey into a new, dangerous, and mystical region.
2.  On a new line, write a detailed image prompt for a fantasy world map of this region. The style should be 'fantasy world map, top-down view, intricate details, vibrant colors, ancient style'.

Example:
The hero leaves the Whispering Woods, crossing into the Ashen Plains where the sky is eternally bruised purple.
A top-down fantasy map of the Ashen Plains. A single path winds through cracked, grey earth, past jagged obsidian formations and slumbering, half-buried ruins. The sky is a gradient of dark purple and orange.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    const [narrative, mapPrompt] = response.text.trim().split('\n');
    return { narrative: narrative || "The journey continues...", mapPrompt: mapPrompt || "A mysterious fantasy map." };
};

export const generateMapImage = async (prompt: string): Promise<string> => {
     const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    }
    throw new Error("Image generation failed");
}


export const generateEnemyImage = async (description: string, enemyName: string): Promise<string> => {
    if (enemyImageCache.has(enemyName)) {
        return enemyImageCache.get(enemyName)!;
    }

    const prompt = `${description}. Dark fantasy digital painting, epic, cinematic lighting, high detail.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const imageBytes = response.generatedImages[0].image.imageBytes;
        enemyImageCache.set(enemyName, imageBytes); // Cache the new image
        return imageBytes;
    }
    throw new Error("Image generation failed");
};

export const generateItemImage = async (item: Item): Promise<string> => {
    if (itemImageCache.has(item.name)) {
        return itemImageCache.get(item.name)!;
    }

    const prompt = `A single, high-quality fantasy RPG item icon. The item is a ${item.rarity} ${item.type} named "${item.name}". Description: "${item.description}". The icon should be on a dark, neutral background. No text. Digital art style.`;

    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const imageBytes = response.generatedImages[0].image.imageBytes;
        itemImageCache.set(item.name, imageBytes);
        return imageBytes;
    }
    throw new Error("Item image generation failed");
};

export const streamCombatNarrative = async function*(outcome: CombatOutcome): AsyncGenerator<string, void, undefined> {
    const { actorName, targetName, damage, isPlayer, isCrit, isDoubleStrike, didProc, didBlock } = outcome;
    
    // Use template for blocks, as it's a simple event
    if (didBlock) {
        yield `${targetName} deftly blocks the attack from ${actorName}!`;
        return;
    }

    const isSignificantEvent = isCrit || isDoubleStrike || didProc;

    // Use template for normal hits
    if (!isSignificantEvent && damage > 0) {
        yield `${actorName} strikes ${targetName} for ${damage} damage.`;
        return;
    }

    // Only call AI for significant events (crit, double strike, proc)
    let prompt = isPlayer
        ? `The hero, ${actorName}, attacks the ${targetName}, dealing ${damage} damage.`
        : `The ${actorName} retaliates against the hero, ${targetName}, for ${damage} damage.`;

    if (isCrit) prompt += " It's a CRITICAL HIT!";
    if (isDoubleStrike) prompt += " It's a DOUBLE STRIKE!";
    if (didProc) prompt += ` The attack inflicts ${didProc}!`;
    
    prompt += "\nDescribe this action vividly. IMPORTANT: The description must be very brief, ideally 1 to 2 sentences. Do not exceed 3 sentences."


    const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            temperature: 0.8,
            thinkingConfig: { thinkingBudget: 0 }
        },
    });

    for await (const chunk of responseStream) {
        yield chunk.text;
    }
};
