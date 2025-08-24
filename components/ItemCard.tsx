import React from 'react';
import type { Item, Rarity } from '../types';
import { Shield, Sword, Percent, Zap, Swords, Droplets, Bone, ShieldCheck, Gem } from 'lucide-react';
import { RARITY_COLORS, RARITY_BORDER_COLORS } from '../constants';

const StatRow: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-1.5 text-sm">
        {icon}
        <span className="font-semibold">{label}:</span>
        <span>{value}</span>
    </div>
);

const ItemCard: React.FC<{item: Omit<Item, 'rarity'> & { rarity?: Rarity }, gearScore?: number}> = ({ item, gearScore }) => {
    const rarity = item.rarity;
    const rarityColor = rarity ? RARITY_COLORS[rarity] : 'text-gray-300';
    const rarityBorder = rarity ? RARITY_BORDER_COLORS[rarity] : 'border-dashed border-purple-400';

    return (
        <div className={`relative bg-black/50 border p-4 rounded-lg flex flex-col gap-2 text-left transition-all duration-300 ${rarityBorder}`}>
            {gearScore !== undefined && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full border border-yellow-600">
                    <Gem className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-yellow-300 text-sm">{gearScore}</span>
                </div>
            )}
            <div className="flex items-center gap-4">
                 {item.type === 'weapon' ? <Sword className="w-8 h-8 text-red-400 flex-shrink-0" /> : <Shield className="w-8 h-8 text-blue-400 flex-shrink-0" />}
                <div>
                    <p className={`font-bold ${rarityColor}`}>{item.name} {rarity ? <span className="text-sm opacity-80">({item.rarity})</span> : <span className="text-sm opacity-80 text-purple-300"> (Awaiting Ritual)</span>}</p>
                    <p className="text-sm text-gray-400">{item.description}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300 pl-12">
                {item.attack > 0 && <StatRow icon={<Sword className="w-4 h-4 text-red-500" />} label="ATK" value={item.attack} />}
                {item.defense > 0 && <StatRow icon={<Shield className="w-4 h-4 text-blue-500" />} label="DEF" value={item.defense} />}
                {item.critChance && <StatRow icon={<Percent className="w-4 h-4 text-yellow-500" />} label="Crit" value={`+${item.critChance}%`} />}
                {item.critDamage && <StatRow icon={<Zap className="w-4 h-4 text-orange-500" />} label="Crit DMG" value={`+${item.critDamage}%`} />}
                {item.doubleStrikeChance && <StatRow icon={<Swords className="w-4 h-4 text-purple-500" />} label="Dbl Strike" value={`+${item.doubleStrikeChance}%`} />}
                {item.blockChance && <StatRow icon={<ShieldCheck className="w-4 h-4 text-gray-400" />} label="Block" value={`+${item.blockChance}%`} />}
                {item.procEffect && (
                    <div className="col-span-2 flex items-center gap-1.5 text-sm mt-1 text-orange-400">
                        {item.procEffect.type === 'Bleed' ? <Droplets className="w-4 h-4" /> : <Bone className="w-4 h-4" />}
                        <span>On Hit: {item.procEffect.chance}% chance to apply {item.procEffect.type}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ItemCard;