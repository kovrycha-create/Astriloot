import React, { useState, useEffect } from 'react';
import type { Item, Rarity } from '../types';
import { Shield, Sword, Percent, Zap, Swords, Droplets, Bone, ShieldCheck, Gem as GemIcon, Sparkles } from 'lucide-react';
import { RARITY_COLORS } from '../constants';

interface ArtifactRevealPhaseProps {
    item: Item;
    onContinue: (item: Item) => void;
}

const rarityStyles: Record<Rarity, { bg: string, text: string, glow: string }> = {
    Common: { bg: 'rarity-bg-common', text: 'text-gray-300', glow: 'shadow-gray-500/30' },
    Uncommon: { bg: 'rarity-bg-uncommon', text: 'text-green-400', glow: 'shadow-green-500/50' },
    Rare: { bg: 'rarity-bg-rare', text: 'text-blue-400', glow: 'shadow-blue-500/50' },
    'Rare+': { bg: 'rarity-bg-rare-plus', text: 'text-blue-300', glow: 'shadow-blue-400/60' },
    Epic: { bg: 'rarity-bg-epic', text: 'text-purple-400', glow: 'shadow-purple-500/60' },
    Legendary: { bg: 'rarity-bg-legendary', text: 'text-orange-400', glow: 'shadow-orange-400/70' },
    Mythic: { bg: 'rarity-bg-mythic', text: 'text-yellow-300', glow: 'shadow-yellow-300/80' },
};

const StatRow: React.FC<{ icon: React.ReactNode, label: string, value: string | number, delay: number }> = ({ icon, label, value, delay }) => (
    <div className="flex items-center gap-2 stat-entry" style={{ animationDelay: `${delay}ms`}}>
        {icon}
        <span className="text-gray-300">{label}:</span>
        <span className="font-bold text-white ml-auto">{value}</span>
    </div>
);


const ArtifactRevealPhase: React.FC<ArtifactRevealPhaseProps> = ({ item, onContinue }) => {
    const [phase, setPhase] = useState<'initial' | 'image' | 'name' | 'stats' | 'done'>('initial');
    const styles = rarityStyles[item.rarity];

    useEffect(() => {
        const timers: number[] = [];
        timers.push(setTimeout(() => setPhase('image'), 100));
        timers.push(setTimeout(() => setPhase('name'), 800));
        timers.push(setTimeout(() => setPhase('stats'), 1500));
        timers.push(setTimeout(() => setPhase('done'), 2500));
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className={`relative flex flex-col items-center justify-center text-center animate-fadeIn p-8 rounded-lg overflow-hidden ${styles.bg}`}>
            <div className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-purple-700/50 rounded-xl p-8 shadow-2xl shadow-purple-900/50 flex flex-col items-center gap-6">
                <div className={`w-48 h-48 rounded-lg overflow-hidden border-2 border-purple-500/50 transition-all duration-700 ease-out transform-gpu ${phase === 'image' || phase === 'name' || phase === 'stats' || phase === 'done' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} ${phase === 'name' || phase === 'stats' || phase === 'done' ? `shadow-2xl ${styles.glow}` : ''}`}>
                   {item.imageBase64 ? (
                        <img src={`data:image/png;base64,${item.imageBase64}`} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-black/30 flex items-center justify-center">
                            {item.type === 'weapon' ? <Sword className="w-24 h-24 text-red-400/70" /> : <Shield className="w-24 h-24 text-blue-400/70" />}
                        </div>
                    )}
                </div>
                
                <div className="h-20 flex flex-col justify-center">
                    <h2 className={`font-cinzel text-3xl transition-all duration-500 ${phase === 'name' || phase === 'stats' || phase === 'done' ? 'opacity-100' : 'opacity-0'} ${styles.text}`}>{item.name}</h2>
                    <p className={`font-bold text-lg transition-all duration-500 delay-200 ${phase === 'name' || phase === 'stats' || phase === 'done' ? 'opacity-100' : 'opacity-0'} ${styles.text}`}>{item.rarity}</p>
                </div>

                <div className={`w-full space-y-2 transition-opacity duration-500 ${phase === 'stats' || phase === 'done' ? 'opacity-100' : 'opacity-0'}`}>
                    {item.attack > 0 && <StatRow icon={<Sword className="w-5 h-5 text-red-500" />} label="Attack" value={item.attack} delay={0}/>}
                    {item.defense > 0 && <StatRow icon={<Shield className="w-5 h-5 text-blue-500" />} label="Defense" value={item.defense} delay={100}/>}
                    {item.critChance && <StatRow icon={<Percent className="w-5 h-5 text-yellow-500" />} label="Crit Chance" value={`+${item.critChance}%`} delay={200}/>}
                    {item.critDamage && <StatRow icon={<Zap className="w-5 h-5 text-orange-500" />} label="Crit Damage" value={`+${item.critDamage}%`} delay={300}/>}
                    {item.doubleStrikeChance && <StatRow icon={<Swords className="w-5 h-5 text-purple-500" />} label="Double Strike" value={`+${item.doubleStrikeChance}%`} delay={400}/>}
                    {item.blockChance && <StatRow icon={<ShieldCheck className="w-5 h-5 text-gray-400" />} label="Block Chance" value={`+${item.blockChance}%`} delay={500}/>}
                </div>
                
                <div className="h-14 mt-4">
                     <button
                        onClick={() => onContinue(item)}
                        className={`px-10 py-3 bg-purple-800/80 border-2 border-purple-600 rounded-lg text-white font-bold text-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/50 transform-gpu ${phase === 'done' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArtifactRevealPhase;
