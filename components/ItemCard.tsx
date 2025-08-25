



import React from 'react';
import type { Item, Rarity, Enchant } from '../types';
import { Shield, Sword, Percent, Zap, Swords, Droplets, Bone, ShieldCheck, Gem as GemIcon, Sparkles, Download } from 'lucide-react';
import { RARITY_COLORS, RARITY_BORDER_COLORS, SOCKET_COLOR_CLASSES } from '../constants';

const IS_DEV_MODE = true;

const StatRow: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-1.5 text-sm">
        {icon}
        <span className="font-semibold">{label}:</span>
        <span>{value}</span>
    </div>
);

const ItemCard: React.FC<{item: Omit<Item, 'rarity'> & { rarity?: Rarity, enchant?: Enchant | null }, gearScore?: number}> = ({ item, gearScore }) => {
    const rarity = item.rarity;
    const rarityColor = rarity ? RARITY_COLORS[rarity] : 'text-gray-300';
    const rarityBorder = rarity ? RARITY_BORDER_COLORS[rarity] : 'border-dashed border-purple-400';

    const handleDownload = (base64Data: string, filename: string) => {
        if (!base64Data || base64Data.startsWith('http')) return;
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64Data}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={`relative bg-black/50 border p-4 rounded-lg flex flex-col gap-3 text-left transition-all duration-300 ${rarityBorder}`}>
            {gearScore !== undefined && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full border border-yellow-600 z-10">
                    <GemIcon className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-yellow-300 text-sm">{gearScore}</span>
                </div>
            )}
            <div className="flex items-center gap-4">
                 <div className="relative w-20 h-20 flex-shrink-0 bg-black/30 rounded-md flex items-center justify-center border border-purple-800/50">
                    {item.imageBase64 ? (
                        <img src={`data:image/png;base64,${item.imageBase64}`} alt={item.name} className="w-full h-full object-cover rounded-md" />
                    ) : (
                        item.type === 'weapon' ? <Sword className="w-10 h-10 text-red-400/70" /> : <Shield className="w-10 h-10 text-blue-400/70" />
                    )}
                    {IS_DEV_MODE && item.imageBase64 && !item.imageBase64.startsWith('http') && (
                        <button 
                          onClick={() => handleDownload(item.imageBase64!, `${item.name.replace(/\s+/g, '-')}.png`)}
                          className="absolute bottom-1 right-1 p-1 bg-black/60 rounded-full text-white/70 hover:bg-blue-800 hover:text-white transition-colors z-10"
                          title="Download Item Image"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div>
                    <p className={`font-bold ${rarityColor}`}>{item.name} {rarity ? <span className="text-sm opacity-80">({item.rarity})</span> : <span className="text-sm opacity-80 text-purple-300"> (Awaiting Ritual)</span>}</p>
                    <p className="text-sm text-gray-400">{item.description}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300 border-t border-purple-900/50 pt-3">
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
             {item.sockets && item.sockets.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-800/40 flex items-center gap-2">
                    <div className="flex gap-2">
                        {item.sockets.map((socket, index) => (
                            <div key={index} className="relative w-7 h-7 rounded-full group flex items-center justify-center">
                                {socket.gem ? (
                                    <>
                                        <div className={`w-full h-full rounded-full border-2 ${SOCKET_COLOR_CLASSES[socket.color].border} ${SOCKET_COLOR_CLASSES[socket.color].bg} shadow-inner flex items-center justify-center`}>
                                             <GemIcon className="w-4 h-4 text-white/70" />
                                        </div>
                                    </>
                                ) : (
                                    <div className={`w-6 h-6 rounded-full border-2 border-dashed ${SOCKET_COLOR_CLASSES[socket.color].empty}`}></div>
                                )}
                                {socket.gem && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-xs p-2 bg-gray-900 border border-purple-700 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                                        <p className="font-bold">{socket.gem.name}</p>
                                        {socket.gem.effects.map((eff, i) => (
                                            <p key={i}>+{eff.value}{eff.stat.includes('Chance') || eff.stat.includes('Damage') ? '%' : ''} {eff.stat.replace(/([A-Z])/g, ' $1')}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {item.enchant && (
                <div className="mt-2 pt-2 border-t border-purple-800/40">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                        <div>
                            <p className={`font-bold text-yellow-300`}>{item.enchant.name}</p>
                            <p className="text-xs text-gray-400 italic">
                                {item.enchant.effects.map(e => e.description).join(' ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ItemCard;