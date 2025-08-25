
import React, { useState, useMemo } from 'react';
import type { Player, Item, Gem, Equipment, SocketColor, BuffableStat } from '../types';
import ItemCard from './ItemCard';
import { Sparkles, ArrowLeft, Gem as GemIcon, Sword, Shield, Percent, Zap, Swords, ShieldCheck } from 'lucide-react';
import { SOCKET_COLOR_CLASSES } from '../constants';

interface GemSocketingPhaseProps {
  player: Player;
  onSocketGem: (slot: keyof Equipment, socketIndex: number, gem: Gem) => void;
  onExit: () => void;
}

const GemCard: React.FC<{
    gem: Gem;
    onSelect: () => void;
    isSelected: boolean;
}> = ({ gem, onSelect, isSelected }) => {
    const ring = isSelected ? `ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900` : '';

    return (
        <button
            onClick={onSelect}
            className={`bg-black/30 border p-3 rounded-lg flex items-center gap-3 text-left w-full transition-all duration-200 hover:bg-purple-900/50 border-gray-700 ${ring}`}
        >
            <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${SOCKET_COLOR_CLASSES[gem.color].bg}`}>
                <GemIcon className="w-5 h-5 text-white/80" />
            </div>
            <div>
                <p className={`font-bold`}>{gem.name}</p>
                <p className="text-sm text-gray-400">{gem.effects.map(e => `+${e.value}${e.stat.includes('Chance') ? '%' : ''} ${e.stat.replace(/([A-Z])/g, ' $1')}`).join(', ')}</p>
            </div>
        </button>
    );
};

const EquipmentSlot: React.FC<{
    item: Item | null;
    slot: keyof Equipment;
    onSelect: () => void;
    isSelected: boolean;
}> = ({ item, slot, onSelect, isSelected }) => {
    if (!item) {
        return (
            <div className="h-24 bg-black/20 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600">
                <p>No {slot} equipped</p>
            </div>
        );
    }
    const ring = isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : 'ring-purple-800/50';
    return (
        <button onClick={onSelect} className={`w-full p-3 bg-black/40 border-2 border-purple-800/30 rounded-lg text-left transition-all hover:border-purple-600 ${ring}`}>
            <p className="font-semibold capitalize text-gray-400">{slot}</p>
            <p className={`font-bold text-white`}>{item.name}</p>
        </button>
    );
};

const GemSocketingPhase: React.FC<GemSocketingPhaseProps> = ({ player, onSocketGem, onExit }) => {
    const [selectedSlot, setSelectedSlot] = useState<keyof Equipment | null>(null);
    const [selectedGem, setSelectedGem] = useState<Gem | null>(null);
    
    const itemToSocket = selectedSlot ? player.equipment[selectedSlot] : null;

    const handleApply = () => {
        if (selectedSlot && selectedGem && itemToSocket?.sockets) {
            const emptySocketIndex = itemToSocket.sockets.findIndex(s => !s.gem && s.color === selectedGem.color);
            if(emptySocketIndex !== -1) {
                onSocketGem(selectedSlot, emptySocketIndex, selectedGem);
                setSelectedGem(null);
            }
        }
    };
    
    const canSocket = useMemo(() => {
        if (!itemToSocket || !selectedGem) return false;
        return itemToSocket.sockets?.some(s => !s.gem && s.color === selectedGem.color) || false;
    }, [itemToSocket, selectedGem]);

    return (
        <div className="animate-fadeIn">
             <button onClick={onExit} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                <ArrowLeft className="w-5 h-5" />
                Back to Camp
            </button>
            <header className="text-center mb-6">
                <h2 className="text-4xl font-cinzel text-purple-300">Jewelcrafter's Table</h2>
                <p className="text-gray-400 italic mt-1">Socket gems to unlock hidden potential.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Equipment & Gems */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div>
                        <h3 className="font-cinzel text-xl mb-3 text-purple-300">1. Select Item</h3>
                        <div className="space-y-3">
                           <EquipmentSlot item={player.equipment.weapon} slot="weapon" onSelect={() => setSelectedSlot('weapon')} isSelected={selectedSlot === 'weapon'} />
                           <EquipmentSlot item={player.equipment.armor} slot="armor" onSelect={() => setSelectedSlot('armor')} isSelected={selectedSlot === 'armor'} />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-cinzel text-xl mb-3 text-purple-300">2. Select Gem</h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                           {player.gems.length > 0 ? player.gems.map(gem => (
                                <GemCard key={gem.id} gem={gem} onSelect={() => setSelectedGem(gem)} isSelected={selectedGem?.id === gem.id}/>
                           )) : (
                                <div className="h-24 bg-black/20 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600">
                                    <p>No gems found</p>
                                </div>
                           )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview & Confirmation */}
                <div className="lg:col-span-2 bg-black/30 border border-purple-800/30 rounded-lg p-6">
                    <h3 className="font-cinzel text-xl mb-4 text-purple-300">3. Confirmation</h3>
                    {itemToSocket ? (
                        <ItemCard item={itemToSocket} />
                    ) : (
                         <div className="h-48 bg-black/20 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                            <p>Select an item to view its sockets</p>
                        </div>
                    )}
                    <div className="mt-6 flex flex-col items-center gap-3">
                         <div className="text-gray-400 text-sm h-5">
                             {itemToSocket && !itemToSocket.sockets?.length && "This item has no sockets."}
                             {itemToSocket && selectedGem && !canSocket && "No compatible empty sockets."}
                         </div>
                        <button
                            onClick={handleApply}
                            disabled={!canSocket}
                            className="w-full max-w-sm py-3 bg-green-800/70 border-2 border-green-600 rounded-lg text-white font-bold text-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-900/50 disabled:bg-gray-800 disabled:border-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 disabled:shadow-none"
                        >
                            Socket Gem
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GemSocketingPhase;
