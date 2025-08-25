

import React, { useState, useMemo } from 'react';
import type { Player, Item, Enchant, Equipment } from '../types';
import ItemCard from './ItemCard';
import { Sparkles, ArrowLeft, Gem } from 'lucide-react';
import { RARITY_BORDER_COLORS, RARITY_COLORS, ENCHANT_COST_MODIFIERS, RARITY_ESSENCE_MAP } from '../constants';

interface EnchantingPhaseProps {
  player: Player;
  onApplyEnchant: (slot: keyof Equipment, enchant: Enchant) => void;
  onExit: () => void;
}

const EnchantCard: React.FC<{
    enchant: Enchant;
    onSelect: () => void;
    isSelected: boolean;
}> = ({ enchant, onSelect, isSelected }) => {
    const borderColor = isSelected ? 'border-yellow-400' : RARITY_BORDER_COLORS[enchant.rarity];
    const ring = isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : '';

    return (
        <button
            onClick={onSelect}
            className={`bg-black/30 border p-3 rounded-lg flex items-center gap-3 text-left w-full transition-all duration-200 hover:bg-purple-900/50 ${borderColor} ${ring}`}
        >
            <Sparkles className="w-8 h-8 text-yellow-300 flex-shrink-0" />
            <div>
                <p className={`font-bold ${RARITY_COLORS[enchant.rarity]}`}>{enchant.name}</p>
                <p className="text-sm text-gray-400">{enchant.effects.map(e => e.description).join(' ')}</p>
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
            <p className={`${RARITY_COLORS[item.rarity]} font-bold`}>{item.name}</p>
        </button>
    );
};


const EnchantingPhase: React.FC<EnchantingPhaseProps> = ({ player, onApplyEnchant, onExit }) => {
    const [selectedSlot, setSelectedSlot] = useState<keyof Equipment | null>(null);
    const [selectedEnchant, setSelectedEnchant] = useState<Enchant | null>(null);

    const itemToEnchant = selectedSlot ? player.equipment[selectedSlot] : null;

    const enchantCost = itemToEnchant ? ENCHANT_COST_MODIFIERS[itemToEnchant.rarity] : 0;
    const canAfford = player.essence >= enchantCost;
    
    const refundAmount = itemToEnchant?.enchant?.rarity ? Math.floor(RARITY_ESSENCE_MAP[itemToEnchant.enchant.rarity] * 0.5) : 0;

    const previewItem = useMemo(() => {
        if (!itemToEnchant) return null;
        if (!selectedEnchant) return itemToEnchant;
        return { ...itemToEnchant, enchant: selectedEnchant };
    }, [itemToEnchant, selectedEnchant]);

    const handleApply = () => {
        if (selectedSlot && selectedEnchant) {
            onApplyEnchant(selectedSlot, selectedEnchant);
            // After applying, clear the selected enchant to prevent re-applying
            setSelectedEnchant(null); 
        }
    };

    return (
        <div className="animate-fadeIn">
             <button onClick={onExit} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                <ArrowLeft className="w-5 h-5" />
                Back to Camp
            </button>
            <header className="text-center mb-6">
                <h2 className="text-4xl font-cinzel text-purple-300">Enchant Item</h2>
                <p className="text-gray-400 italic mt-1">Imbue your gear with permanent power.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Equipment & Enchants */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div>
                        <h3 className="font-cinzel text-xl mb-3 text-purple-300">1. Select Item</h3>
                        <div className="space-y-3">
                           <EquipmentSlot item={player.equipment.weapon} slot="weapon" onSelect={() => setSelectedSlot('weapon')} isSelected={selectedSlot === 'weapon'} />
                           <EquipmentSlot item={player.equipment.armor} slot="armor" onSelect={() => setSelectedSlot('armor')} isSelected={selectedSlot === 'armor'} />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-cinzel text-xl mb-3 text-purple-300">2. Select Enchant</h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                           {player.enchants.length > 0 ? player.enchants.map(enchant => (
                                <EnchantCard key={enchant.id} enchant={enchant} onSelect={() => setSelectedEnchant(enchant)} isSelected={selectedEnchant?.id === enchant.id}/>
                           )) : (
                                <div className="h-24 bg-black/20 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600">
                                    <p>No enchants found</p>
                                </div>
                           )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview & Confirmation */}
                <div className="lg:col-span-2 bg-black/30 border border-purple-800/30 rounded-lg p-6">
                    <h3 className="font-cinzel text-xl mb-4 text-purple-300">3. Confirmation</h3>
                    {previewItem ? (
                        <ItemCard item={previewItem} />
                    ) : (
                         <div className="h-48 bg-black/20 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                            <p>Select an item and an enchant to see a preview</p>
                        </div>
                    )}
                    <div className="mt-6 flex flex-col items-center gap-3">
                         {refundAmount > 0 && (
                            <p className="text-sm text-yellow-400">Overwriting will grant <span className="font-bold">{refundAmount}</span> essence.</p>
                         )}
                         <div className="flex items-center gap-2 text-lg">
                            <span className="text-gray-300">Cost:</span>
                             <div className="flex items-center gap-1.5 font-bold">
                                <Sparkles className="w-5 h-5 text-cyan-300" />
                                <span className={canAfford ? 'text-cyan-300' : 'text-red-400'}>{enchantCost}</span>
                            </div>
                         </div>

                        <button
                            onClick={handleApply}
                            disabled={!itemToEnchant || !selectedEnchant || !canAfford}
                            className="w-full max-w-sm py-3 bg-green-800/70 border-2 border-green-600 rounded-lg text-white font-bold text-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-900/50 disabled:bg-gray-800 disabled:border-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 disabled:shadow-none"
                        >
                            Enchant Item
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnchantingPhase;