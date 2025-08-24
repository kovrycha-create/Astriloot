import React from 'react';
import type { Player, Enemy, StatusEffect } from '../types';
import HealthBar from './HealthBar';
import AdvancedStatsTooltip from './AdvancedStatsTooltip';
import { Sword, Shield, Droplets, Bone, Info, Flame } from 'lucide-react';

interface DamageNumberDisplayInfo {
    id: number;
    amount: number;
    isCrit: boolean;
}
interface CharacterDisplayProps {
  character: Player | Enemy;
  isPlayer?: boolean;
  onShowAdvancedStats?: () => void;
  showAdvancedStats?: boolean;
  animation?: 'crit' | 'block' | 'double-strike' | null;
  damageNumbers?: DamageNumberDisplayInfo[];
}

const StatusEffectIcon: React.FC<{ effect: StatusEffect }> = ({ effect }) => {
    const config = {
        Bleed: { icon: <Droplets className="w-4 h-4 text-red-400" />, color: 'bg-red-900/80 border-red-600' },
        Poison: { icon: <Bone className="w-4 h-4 text-green-400" />, color: 'bg-green-900/80 border-green-600' },
        Burn: { icon: <Flame className="w-4 h-4 text-orange-400" />, color: 'bg-orange-900/80 border-orange-600' },
    };
    const { icon, color } = config[effect.type];
    
    return (
        <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border ${color}`} title={`${effect.type}: ${effect.damage} DMG for ${effect.duration} turns`}>
            {icon}
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-gray-800 rounded-full">
                {effect.duration}
            </span>
        </div>
    )
};

const DamageNumber: React.FC<{ amount: number; isCrit: boolean; style: React.CSSProperties }> = ({ amount, isCrit, style }) => (
    <div 
        className={`damage-number absolute font-cinzel ${isCrit ? 'text-yellow-300 text-5xl font-extrabold' : 'text-white text-4xl'}`}
        style={style}
    >
        {amount}
    </div>
);


const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ character, isPlayer = false, onShowAdvancedStats, showAdvancedStats, animation, damageNumbers = [] }) => {
  const isEnemy = 'imageBase64' in character;
  
  const imageUrl = isEnemy 
    ? (character.imageBase64 ? `data:image/png;base64,${character.imageBase64}` : `https://api.dicebear.com/8.x/lorelei/svg?seed=${character.name.replace(/\s/g, '')}`) 
    : `https://i.pravatar.cc/400?u=${character.name}`;

  return (
    <div className={`flex flex-col items-center gap-4 transition-all duration-500 ${isPlayer ? 'items-start' : 'items-end'}`}>
      <div className="relative"> {/* Wrapper to position the tooltip correctly */}
        <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-xl border-2 overflow-hidden shadow-lg ${isPlayer ? 'border-purple-700/50 shadow-purple-900/50 animate-pulse-glow' : 'border-red-700/50 shadow-red-900/50 animate-pulse-glow-red'} ${animation === 'double-strike' ? 'animate-double-strike-pulse' : ''} ${animation === 'crit' ? 'animate-crit-border-flash' : ''}`}>
          <img src={imageUrl} alt={character.name} className="w-full h-full object-cover" />
          
           {/* Animation Overlays */}
          {animation === 'crit' && (
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                  <span className="font-cinzel text-5xl font-extrabold text-yellow-300 animate-crit-text-reveal">
                      CRITICAL!
                  </span>
              </div>
          )}
          {animation === 'block' && <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"><Shield className="w-24 h-24 text-blue-300/80 animate-block-flash" /></div>}

           {/* Damage Numbers Container */}
          <div className="absolute inset-0 pointer-events-none z-30">
              {damageNumbers.map((dn) => {
                  const randomX = Math.random() * 40 - 20; // -20 to +20
                  const randomY = Math.random() * 20 - 10; // -10 to +10
                  return (
                      <DamageNumber 
                          key={dn.id} 
                          amount={dn.amount} 
                          isCrit={dn.isCrit}
                          style={{
                              top: `${20 + randomY}%`,
                              left: isPlayer ? `${10 + randomX}%` : undefined,
                              right: !isPlayer ? `${10 + randomX}%` : undefined,
                          }}
                      />
                  );
              })}
          </div>

          {isPlayer && onShowAdvancedStats && (
              <button 
                  onClick={onShowAdvancedStats} 
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white/80 hover:bg-purple-800 hover:text-white transition-colors z-10"
                  title="Show Advanced Stats"
              >
                  <Info className="w-5 h-5" />
              </button>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-2 left-4">
              <h2 className="font-cinzel text-xl md:text-2xl text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
                {character.name}
              </h2>
               {'level' in character && <p className="text-yellow-400 font-semibold text-sm">Lvl {character.level}</p>}
          </div>
        </div>
        {isPlayer && showAdvancedStats && <AdvancedStatsTooltip player={character as Player} />}
      </div>
      <div className={`w-full max-w-sm flex flex-col ${isPlayer ? 'items-start' : 'items-end'} gap-2`}>
        <HealthBar 
          current={character.health} 
          max={character.maxHealth} 
          isPlayer={isPlayer} 
        />
        <div className="flex justify-between w-full px-1">
            <div className="flex gap-4 text-gray-300">
                <div className="flex items-center gap-1.5" title="Attack">
                    <Sword className="w-4 h-4 text-red-400" />
                    <span className="font-semibold">{character.attack}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Defense">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold">{character.defense}</span>
                </div>
            </div>
             <div className="flex gap-1.5">
                {'activeStatusEffects' in character && character.activeStatusEffects.map((effect, index) => (
                    <StatusEffectIcon key={index} effect={effect} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterDisplay;