import type { Item } from '../types';
import { GEAR_SCORE_WEIGHTS } from '../constants';

export const calculateGearScore = (item: Item): number => {
    let score = 0;
    score += (item.attack || 0) * GEAR_SCORE_WEIGHTS.attack;
    score += (item.defense || 0) * GEAR_SCORE_WEIGHTS.defense;
    score += (item.critChance || 0) * GEAR_SCORE_WEIGHTS.critChance;
    score += (item.critDamage || 0) * GEAR_SCORE_WEIGHTS.critDamage;
    score += (item.doubleStrikeChance || 0) * GEAR_SCORE_WEIGHTS.doubleStrikeChance;
    score += (item.blockChance || 0) * GEAR_SCORE_WEIGHTS.blockChance;

    if (item.procEffect) {
        score += (item.procEffect.chance || 0) * GEAR_SCORE_WEIGHTS.procChance;
        score += (item.procEffect.damage * item.procEffect.duration) * GEAR_SCORE_WEIGHTS.procDamage;
    }
    
    return Math.round(score);
};
