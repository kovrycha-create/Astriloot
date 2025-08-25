
import React, { useState } from 'react';
import type { Player, Item, ActiveElixirEffect, TemporaryBuff } from '../types';
import HealthBar from './HealthBar';
import { Sword, Shield, Percent, Zap, Swords, ShieldCheck, Sparkles, FlaskConical, Coins } from 'lucide-react';
import ItemCard from './ItemCard';
import { ELIXIRS_DATA } from '../constants';

interface PlayerStatsProps {
  player: Player;
}

const XpBar: React.FC<{current: number, max: number}> = ({ current, max }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full bg-black/60 rounded-full h-4 border-2 border-blue-800/80 p-0.5 relative">
            <div 
                className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
            ></div>
            <span className="absolute w-full text-center top-[-1px] left-0 text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                XP: {current} / {max}
            </span>
        </div>
    );
};

const EquipmentDisplay: React.FC<{ label: string, item: Item | null }> = ({ label, item }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="bg-black/40 p-2 rounded-md text-sm cursor-pointer">
                <span className="text-gray-400">{label}: </span>
                <span className="text-purple-300 font-semibold">{item?.name || 'None'}</span>
            </div>
            {isHovered && item && (
                <div className="absolute top-0 left-full ml-4 w-80 z-50 pointer-events-none animate-fadeIn">
                    <ItemCard item={item} />
                </div>
            )}
        </div>
    );
};

const StatDisplay: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-md">
        {icon}
        <span className="text-gray-300">{label}:</span>
        <span className="font-bold text-white ml-auto">{value}</span>
    </div>
);

const ActiveElixirDisplay: React.FC<{ elixir: ActiveElixirEffect }> = ({ elixir }) => {
    const elixirData = ELIXIRS_DATA.find(e => e.id === elixir.id);
    if (!elixirData) return null;

    const durationText = elixir.type === 'GUARANTEED_POSITIVE_EVENT' ? `${elixir.duration} event` : `${elixir.duration} combats`;

    return (
        <div className="bg-black/40 p-3 rounded-md border border-cyan-700/50">
            <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-cyan-300" />
                <p className="font-bold text-cyan-300">{elixirData.name}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1 pl-7">{elixirData.description}</p>
            <p className="text-xs text-yellow-400 mt-1 pl-7 font-semibold">Duration remaining: {durationText}</p>
        </div>
    );
};

const buffIcons = {
    attack: <Sword className="w-4 h-4 text-red-400" />,
    defense: <Shield className="w-4 h-4 text-blue-400" />,
    critChance: <Percent className="w-4 h-4 text-yellow-400" />,
    critDamage: <Zap className="w-4 h-4 text-orange-400" />,
    doubleStrikeChance: <Swords className="w-4 h-4 text-purple-400" />,
    blockChance: <ShieldCheck className="w-4 h-4 text-gray-300" />,
};

const ActiveBuffsDisplay: React.FC<{ buffs: TemporaryBuff[] }> = ({ buffs }) => {
    return (
        <div className="space-y-2">
            <h4 className="font-cinzel text-lg">Active Buffs</h4>
            {buffs.map((buff, index) => (
                <div key={index} className="bg-black/40 p-2 rounded-md border border-blue-700/50 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        {buffIcons[buff.stat]}
                        <p className="text-gray-300">
                            <span className="font-bold text-white">+{buff.value}{buff.stat.includes('Chance') ? '%' : ''}</span> {buff.stat.replace(/([A-Z])/g, ' $1').replace('Chance', ' Chance')}
                        </p>
                    </div>
                    <p className="text-xs text-yellow-400 font-semibold">{buff.duration} encounters left</p>
                </div>
            ))}
        </div>
    );
};


const PlayerStats: React.FC<PlayerStatsProps> = ({ player }) => {
  return (
    <div className="w-full bg-black/30 border border-purple-800/50 rounded-lg p-4 flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between">
            <h3 className="font-cinzel text-2xl">{player.name}</h3>
        </div>
        <p className="text-yellow-400 font-bold">Level {player.level}</p>
      </div>

      <div className="space-y-2">
        <HealthBar current={player.health} max={player.maxHealth} isPlayer />
        <XpBar current={player.xp} max={player.xpToNextLevel} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
          <StatDisplay icon={<Sword className="w-4 h-4 text-red-400" />} label="Attack" value={player.attack} />
          <StatDisplay icon={<Shield className="w-4 h-4 text-blue-400" />} label="Defense" value={player.defense} />
          <StatDisplay icon={<Percent className="w-4 h-4 text-yellow-400" />} label="Crit Chance" value={`${player.critChance}%`} />
          <StatDisplay icon={<Zap className="w-4 h-4 text-orange-400" />} label="Crit Damage" value={`${player.critDamage}%`} />
          <StatDisplay icon={<Swords className="w-4 h-4 text-purple-400" />} label="Double Strike" value={`${player.doubleStrikeChance}%`} />
          <StatDisplay icon={<ShieldCheck className="w-4 h-4 text-gray-300" />} label="Block Chance" value={`${player.blockChance}%`} />
      </div>
      
      <div className="space-y-2">
        <h4 className="font-cinzel text-lg mt-2">Equipment</h4>
        <EquipmentDisplay label="Weapon" item={player.equipment.weapon} />
        <EquipmentDisplay label="Armor" item={player.equipment.armor} />
      </div>

      {player.activeElixir && (
          <div className="space-y-2">
            <h4 className="font-cinzel text-lg">Active Elixir</h4>
            <ActiveElixirDisplay elixir={player.activeElixir} />
          </div>
      )}
      
      {player.temporaryBuffs.length > 0 && (
          <ActiveBuffsDisplay buffs={player.temporaryBuffs} />
      )}

      <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
          <StatDisplay icon={<Coins className="w-4 h-4 text-yellow-400" />} label="Vas" value={player.vas} />
          <StatDisplay icon={<Sparkles className="w-4 h-4 text-cyan-300" />} label="Arcane Essence" value={player.essence} />
      </div>
    </div>
  );
};

export default PlayerStats;
