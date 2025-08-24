import React from 'react';
import type { Player } from '../types';
import { Percent, Zap, Swords, ShieldCheck } from 'lucide-react';

interface AdvancedStatsTooltipProps {
  player: Player;
}

const StatBreakdownRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    total: number;
    base: number;
    gear: number;
    isPercent?: boolean;
}> = ({ icon, label, total, base, gear, isPercent = true }) => {
    const suffix = isPercent ? '%' : '';
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-gray-300">{label}:</span>
            </div>
            <div className="text-right">
                <p className="font-bold text-white">{total}{suffix}</p>
                <p className="text-xs text-gray-400">(Base: {base}{suffix}, Gear: +{gear}{suffix})</p>
            </div>
        </div>
    );
};


const AdvancedStatsTooltip: React.FC<AdvancedStatsTooltipProps> = ({ player }) => {
    const gearStats = {
        critChance: 0,
        critDamage: 0,
        doubleStrikeChance: 0,
        blockChance: 0,
    };

    for (const item of Object.values(player.equipment)) {
        if (item) {
            gearStats.critChance += item.critChance || 0;
            gearStats.critDamage += item.critDamage || 0;
            gearStats.doubleStrikeChance += item.doubleStrikeChance || 0;
            gearStats.blockChance += item.blockChance || 0;
        }
    }

    const baseStats = {
        critChance: player.critChance - gearStats.critChance,
        critDamage: player.critDamage - gearStats.critDamage,
        doubleStrikeChance: player.doubleStrikeChance - gearStats.doubleStrikeChance,
        blockChance: player.blockChance - gearStats.blockChance,
    };

    return (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-black/80 backdrop-blur-md border border-purple-700 rounded-lg p-4 shadow-2xl shadow-purple-900/50 z-20 animate-fadeIn space-y-3">
             <h4 className="font-cinzel text-lg text-center text-purple-300 border-b border-purple-800/50 pb-2">
                Advanced Stats
            </h4>
            <StatBreakdownRow 
                icon={<Percent className="w-4 h-4 text-yellow-400" />}
                label="Crit Chance"
                total={player.critChance}
                base={baseStats.critChance}
                gear={gearStats.critChance}
            />
            <StatBreakdownRow 
                icon={<Zap className="w-4 h-4 text-orange-400" />}
                label="Crit Damage"
                total={player.critDamage}
                base={baseStats.critDamage}
                gear={gearStats.critDamage}
            />
            <StatBreakdownRow 
                icon={<Swords className="w-4 h-4 text-purple-400" />}
                label="Double Strike"
                total={player.doubleStrikeChance}
                base={baseStats.doubleStrikeChance}
                gear={gearStats.doubleStrikeChance}
            />
            <StatBreakdownRow 
                icon={<ShieldCheck className="w-4 h-4 text-gray-300" />}
                label="Block Chance"
                total={player.blockChance}
                base={baseStats.blockChance}
                gear={gearStats.blockChance}
            />
        </div>
    );
};

export default AdvancedStatsTooltip;