import React, { useState } from 'react';
import type { CharacterData } from '../types';
import { CHARACTERS_DATA } from '../constants';

interface CharacterSelectionPhaseProps {
    onSelect: (character: CharacterData) => void;
}

const CharacterSelectionPhase: React.FC<CharacterSelectionPhaseProps> = ({ onSelect }) => {
    const [selectedId, setSelectedId] = useState<CharacterData['id'] | null>(null);
    const selectedCharacter = CHARACTERS_DATA.find(c => c.id === selectedId);

    const handleSelect = (character: CharacterData) => {
        setSelectedId(character.id);
    };

    const handleBegin = () => {
        if (selectedCharacter) {
            onSelect(selectedCharacter);
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fadeIn py-8">
            <h1 className="text-5xl font-cinzel text-purple-200 drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)]">Choose Your Vessel</h1>
            <p className="text-gray-400 mt-2">Your choices will shape the cosmos.</p>

            <div className="flex flex-col md:flex-row items-end gap-4 md:gap-8 my-10">
                {CHARACTERS_DATA.map(char => {
                    const isComingSoon = char.status === 'coming_soon';
                    const isSelected = selectedId === char.id;

                    const glowClasses: Record<CharacterData['id'], string> = {
                        ymzo: 'border-purple-500 hover:border-purple-400',
                        kiox: 'border-[#2f7e04] hover:border-[#4db312]',
                        nippy: '',
                        sinira: '',
                    };
                    const selectedGlowClasses: Record<CharacterData['id'], string> = {
                        ymzo: 'border-purple-400 ring-2 ring-purple-400',
                        kiox: 'border-[#4db312] ring-2 ring-[#4db312]',
                        nippy: '',
                        sinira: '',
                    };

                    const CharacterVisuals = (
                        <div className="group">
                            <img src={char.nameImageUrl} alt={`${char.name}'s name`} className="h-20 mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div 
                                className={`relative w-72 h-72 rounded-full border-4 bg-gray-800 shadow-2xl transition-all duration-300 ${!isComingSoon ? `animate-float ${isSelected ? selectedGlowClasses[char.id] : glowClasses[char.id]}` : 'border-gray-600'}`}
                                style={{ animationDelay: `${char.id === 'kiox' ? '2s' : '0s'}`}}
                            >
                                <img 
                                    src={char.portraitImageUrl} 
                                    alt={char.name} 
                                    className="w-full h-full object-cover rounded-full"
                                />
                                {!isComingSoon && <div className={`absolute inset-0 rounded-full ${char.id === 'ymzo' ? 'shadow-[0_0_30px_rgba(168,85,247,0.7)]' : 'shadow-[0_0_30px_rgba(47,126,4,0.7)]'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>}
                                {isComingSoon && (
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                        <div className="text-center border-2 border-yellow-500 bg-black/70 px-4 py-2 rounded-lg">
                                            <p className="font-cinzel text-yellow-300 tracking-widest">IN DEVELOPMENT</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );

                    return (
                        <div 
                            key={char.id} 
                            className={`flex flex-col items-center gap-4 transition-transform duration-300 ${isComingSoon ? 'transform scale-90 filter grayscale' : ''}`}
                        >
                            {isComingSoon ? (
                                <div className="group cursor-help" title="Coming in a future expansion!">
                                    {CharacterVisuals}
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleSelect(char)}
                                    className="group transition-transform duration-300 hover:scale-105"
                                >
                                    {CharacterVisuals}
                                </button>
                            )}
                            <p className="max-w-xs text-gray-300">{char.description}</p>
                        </div>
                    );
                })}
            </div>
            
            <button
                onClick={handleBegin}
                disabled={!selectedCharacter}
                className="w-full max-w-sm py-4 bg-purple-800/80 border-2 border-purple-600 rounded-lg text-white font-bold text-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/50 disabled:bg-gray-800 disabled:border-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 disabled:shadow-none disabled:scale-100 hover:scale-105"
            >
                {selectedCharacter ? `Begin as ${selectedCharacter.name}` : 'Select a Character'}
            </button>
        </div>
    );
};

export default CharacterSelectionPhase;