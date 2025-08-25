import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Item } from '../types';
import ItemCard from './ItemCard';
import { calculateGearScore } from '../utils/gear';
import { AlertTriangle, BrainCircuit } from 'lucide-react';

interface GearChoicePhaseProps {
    equippedItem: Item;
    newItem: Item;
    onChoice: (itemToKeep: Item, itemToDisenchant: Item) => void;
    autoEquip: boolean;
    setAutoEquip: React.Dispatch<React.SetStateAction<boolean>>;
}

const GearChoicePhase: React.FC<GearChoicePhaseProps> = ({ equippedItem, newItem, onChoice, autoEquip, setAutoEquip }) => {
    const [showWarning, setShowWarning] = useState<Item | null>(null);
    const [isAutoChoosing, setIsAutoChoosing] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<number | null>(null);

    const equippedScore = useMemo(() => calculateGearScore(equippedItem), [equippedItem]);
    const newScore = useMemo(() => calculateGearScore(newItem), [newItem]);

    const aiSelectedItem = useMemo(() => (newScore > equippedScore ? newItem : equippedItem), [newScore, equippedScore, newItem, equippedItem]);

    useEffect(() => {
        if (autoEquip) {
            setIsAutoChoosing(true);
            const DURATION = 2000;
            const INTERVAL = 50;
            let elapsed = 0;

            intervalRef.current = window.setInterval(() => {
                elapsed += INTERVAL;
                setProgress((elapsed / DURATION) * 100);
                if (elapsed >= DURATION) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    const itemToDisenchant = aiSelectedItem.name === equippedItem.name ? newItem : equippedItem;
                    onChoice(aiSelectedItem, itemToDisenchant);
                }
            }, INTERVAL);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [autoEquip, onChoice, equippedItem, newItem, aiSelectedItem]);

    const handleToggleAutoEquip = () => {
        const newSetting = !autoEquip;
        setAutoEquip(newSetting);
        if (!newSetting && intervalRef.current) {
            // If user turns it off, cancel the auto-choice process
            clearInterval(intervalRef.current);
            setIsAutoChoosing(false);
            setProgress(0);
        }
    };

    const handleChoice = (itemToKeep: Item) => {
        if (isAutoChoosing) return; // Prevent manual choice during auto-choice

        const itemToDisenchant = itemToKeep.name === equippedItem.name ? newItem : equippedItem;
        const scoreToKeep = itemToKeep.name === equippedItem.name ? equippedScore : newScore;
        const scoreToDisenchant = itemToKeep.name === equippedItem.name ? newScore : equippedScore;

        if (scoreToKeep < scoreToDisenchant && !showWarning) {
            setShowWarning(itemToKeep);
            return;
        }
        onChoice(itemToKeep, itemToDisenchant);
    };

    const getCardWrapperClass = (item: Item) => {
        if (isAutoChoosing && item.name === aiSelectedItem.name) {
            return 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-gray-900 rounded-lg shadow-2xl shadow-cyan-500/50 animate-pulse';
        }
        return '';
    };

    return (
        <div className="flex flex-col items-center justify-center gap-8 text-center animate-fadeIn py-8 relative">
             <div 
                className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(49,20,70,0.4)_0%,_rgba(10,5,15,0)_60%)]"
                style={{ borderRadius: 'inherit' }}
            ></div>
            <div>
                <h2 className="text-4xl font-cinzel mb-2">A Fateful Choice</h2>
                <p className="text-gray-400 mb-6">An artifact of similar power has been forged. Choose which to keep.</p>
            </div>
            
            <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-12">
                {/* Equipped Item Column */}
                <div className="flex-1 flex flex-col gap-4 items-center">
                    <h3 className="font-cinzel text-xl text-green-400">Equipped</h3>
                    <div className={`transition-all duration-300 w-full h-full flex flex-col ${getCardWrapperClass(equippedItem)}`}>
                        <ItemCard item={equippedItem} gearScore={equippedScore} />
                    </div>
                    <button 
                        onClick={() => handleChoice(equippedItem)}
                        disabled={isAutoChoosing}
                        className="w-full mt-auto py-3 bg-green-800/70 border border-green-600 rounded-lg text-white font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-700 disabled:border-gray-600 disabled:cursor-not-allowed"
                    >
                        Keep Equipped
                    </button>
                </div>
                
                <div className="flex items-center justify-center my-4 md:my-0">
                    <span className="font-cinzel text-5xl md:text-7xl text-gray-600 font-bold">VS</span>
                </div>

                {/* New Item Column */}
                <div className="flex-1 flex flex-col gap-4 items-center">
                    <h3 className="font-cinzel text-xl text-purple-400">New Artifact</h3>
                    <div className={`transition-all duration-300 w-full h-full flex flex-col ${getCardWrapperClass(newItem)}`}>
                         <ItemCard item={newItem} gearScore={newScore} />
                    </div>
                    <button 
                        onClick={() => handleChoice(newItem)}
                        disabled={isAutoChoosing}
                        className="w-full mt-auto py-3 bg-purple-800/70 border border-purple-600 rounded-lg text-white font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-700 disabled:border-gray-600 disabled:cursor-not-allowed"
                    >
                        Equip New
                    </button>
                </div>
            </div>
            
            <div className="w-full max-w-md mt-6">
                {/* AI Toggle */}
                 <div 
                    className="flex items-center justify-center gap-3 cursor-pointer group"
                    onClick={handleToggleAutoEquip}
                    role="switch"
                    aria-checked={autoEquip}
                 >
                    <BrainCircuit className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-gray-300">AI Auto-Equip Best Item</span>
                    <div className={`relative w-12 h-6 rounded-full transition-colors ${autoEquip ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${autoEquip ? 'translate-x-6' : ''}`}></div>
                    </div>
                </div>

                {/* Progress Bar for Auto-Choice */}
                {isAutoChoosing && (
                     <div className="w-full max-w-sm mx-auto mt-4">
                        <div className="w-full bg-black/60 rounded-full h-2.5 border border-cyan-700 p-0.5">
                            <div
                                className="h-full rounded-full bg-cyan-500 transition-all duration-100 ease-linear"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-cyan-300 mt-2 animate-pulse">AI is making a choice...</p>
                    </div>
                )}
            </div>

            {showWarning && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 border-2 border-yellow-600 rounded-xl p-8 max-w-md text-center shadow-2xl animate-fadeIn">
                        <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                        <h3 className="font-cinzel text-2xl text-yellow-300 mb-2">Are you sure?</h3>
                        <p className="text-gray-300 mb-6">
                            The item you've chosen appears to be weaker than the one you would disenchant. This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setShowWarning(null)}
                                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onChoice(showWarning, showWarning.name === equippedItem.name ? newItem : equippedItem)}
                                className="px-6 py-2 bg-yellow-700 hover:bg-yellow-600 rounded-lg font-semibold text-white transition-colors"
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GearChoicePhase;
