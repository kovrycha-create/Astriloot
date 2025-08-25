

import React, { useState } from 'react';
import type { Player, CampState, CampUpgrades, Elixir } from '../types';
import PlayerStats from './PlayerStats';
import { Sparkles, Hammer, LogOut, FlaskConical, PenSquare, Gem } from 'lucide-react';
import { UPGRADE_COSTS, UPGRADE_DESCRIPTIONS, ELIXIRS_DATA } from '../constants';

interface CampPhaseProps {
  player: Player;
  campState: CampState;
  onPurchaseUpgrade: (upgrade: keyof CampUpgrades) => void;
  onBrewElixir: (elixir: Elixir) => void;
  onExit: (spentEssence: boolean) => void;
  onEnterEnchanting: () => void;
  onEnterGemSocketing: () => void;
}

const ElixirCard: React.FC<{
    elixir: Elixir;
    player: Player;
    onBrew: (elixir: Elixir) => void;
}> = ({ elixir, player, onBrew }) => {
    const canAfford = player.essence >= elixir.cost;
    const hasElixir = !!player.activeElixir;

    return (
        <div className={`bg-black/20 border border-cyan-800/30 rounded-lg p-3 transition-all ${hasElixir ? 'opacity-50' : ''}`}>
            <p className="font-semibold text-cyan-300">{elixir.name}</p>
            <p className="text-xs text-gray-400 mt-1">{elixir.description}</p>
            <div className="mt-3 flex justify-end">
                <button
                    onClick={() => onBrew(elixir)}
                    disabled={!canAfford || hasElixir}
                    className="flex items-center justify-center gap-2 py-1.5 px-3 bg-cyan-800/70 border border-cyan-600 rounded-lg text-white font-semibold text-sm hover:bg-cyan-700 transition-colors disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                    <span>Brew</span>
                    <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-cyan-300" />
                        <span className="font-bold">{elixir.cost}</span>
                    </div>
                </button>
            </div>
        </div>
    )
}

const CampPhase: React.FC<CampPhaseProps> = ({ player, campState, onPurchaseUpgrade, onBrewElixir, onExit, onEnterEnchanting, onEnterGemSocketing }) => {
    const [spentEssence, setSpentEssence] = useState(false);
    const [forgeTab, setForgeTab] = useState<'upgrade' | 'enchant'>('upgrade');
    
    const labLevel = campState.upgrades.alchemistsLab;
    const forgeLevel = campState.upgrades.soulfireForge;
    const jewelcrafterLevel = campState.upgrades.jewelcraftersTable;
    const availableElixirs = ELIXIRS_DATA.filter(e => e.requiredLabLevel <= labLevel);

    const handlePurchase = (upgrade: keyof CampUpgrades) => {
        onPurchaseUpgrade(upgrade);
        setSpentEssence(true);
    };

    const handleBrew = (elixir: Elixir) => {
        onBrewElixir(elixir);
        setSpentEssence(true);
    }

    const healPercent = spentEssence ? 35 : 50;
    const healAmount = Math.floor(player.maxHealth * (healPercent / 100));

    // Common upgrade button logic
    const renderUpgradeButton = (upgrade: keyof CampUpgrades, level: number) => {
        const isMaxLevel = level >= UPGRADE_COSTS[upgrade].length;
        if (isMaxLevel) {
            return (
                <div className="w-full text-center py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-yellow-400 font-semibold opacity-60">
                    Max Level
                </div>
            );
        }
        const cost = UPGRADE_COSTS[upgrade][level];
        const canAfford = player.essence >= cost;
        return (
             <button
                onClick={() => handlePurchase(upgrade)}
                disabled={!canAfford}
                className="w-full flex items-center justify-center gap-2 py-2 bg-purple-800/70 border border-purple-600 rounded-lg text-white font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
            >
                <span>Upgrade</span>
                <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span className="font-bold">{cost}</span>
                </div>
            </button>
        );
    };

    return (
        <div className="flex flex-col md:flex-row animate-fadeIn gap-8">
            <div className="w-full md:w-1/3 h-full flex flex-col">
                <PlayerStats player={player} />
                <div className="mt-4 bg-black/30 border border-purple-800/50 rounded-lg p-4 text-center">
                    <p className="text-gray-300">Resting now will heal for <strong className="text-green-400">{healAmount} HP</strong> ({healPercent}% of Max Health).</p>
                </div>
                <div className="mt-auto pt-4">
                    <button
                        onClick={() => onExit(spentEssence)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-green-900/70 border-2 border-green-700 rounded-lg text-white font-semibold transition-all hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/50"
                    >
                        <LogOut className="w-5 h-5" />
                        Rest and Continue Journey
                    </button>
                </div>
            </div>

            <div className="w-full md:w-2/3 h-full flex flex-col">
                <header className="text-center mb-4">
                    <h2 className="text-4xl font-cinzel text-purple-300">Ymzo's Camp</h2>
                    <p className="text-gray-400 italic mt-1">A brief respite. A moment to grow stronger.</p>
                </header>

                <div className="h-[520px] overflow-y-auto pr-2 space-y-4">
                     <div className="bg-black/40 border border-purple-800/30 rounded-lg p-4 flex flex-col">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 text-purple-300 flex-shrink-0"><Hammer className="w-full h-full" /></div>
                            <div>
                                <p className="font-cinzel text-xl text-purple-300">Soulfire Forge</p>
                                <p className="text-sm text-yellow-400">Level {forgeLevel}</p>
                            </div>
                        </div>
                        {forgeLevel > 0 && (
                            <div className="flex border-b border-purple-800/50 mt-4">
                                <button onClick={() => setForgeTab('upgrade')} className={`px-4 py-2 text-sm font-semibold transition-colors ${forgeTab === 'upgrade' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}>Upgrade</button>
                                <button onClick={() => setForgeTab('enchant')} className={`px-4 py-2 text-sm font-semibold transition-colors ${forgeTab === 'enchant' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}>Enchant</button>
                            </div>
                        )}
                        <div className="mt-4">
                            {forgeTab === 'upgrade' || forgeLevel === 0 ? (
                                <>
                                    <p className="text-sm text-gray-400 h-16">{UPGRADE_DESCRIPTIONS.soulfireForge[forgeLevel]}</p>
                                    <div className="mt-4">
                                        {renderUpgradeButton('soulfireForge', forgeLevel)}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <p className="text-sm text-gray-300 mb-4">Empower your equipment with permanent enchants, overwriting any existing ones.</p>
                                    <button
                                        onClick={onEnterEnchanting}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-800/70 border border-yellow-600 rounded-lg text-white font-semibold hover:bg-yellow-700 transition-colors"
                                    >
                                        <PenSquare className="w-5 h-5"/>
                                        Enchant Item
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                     {/* Jewelcrafter's Table */}
                    <div className="bg-black/40 border border-purple-800/30 rounded-lg p-4 flex flex-col">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 text-purple-300 flex-shrink-0"><Gem className="w-full h-full" /></div>
                            <div>
                                <p className="font-cinzel text-xl text-purple-300">Jewelcrafter's Table</p>
                                <p className="text-sm text-yellow-400">Level {jewelcrafterLevel}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-3 h-16">{UPGRADE_DESCRIPTIONS.jewelcraftersTable[jewelcrafterLevel]}</p>
                        <div className="mt-4">
                            {jewelcrafterLevel > 0 ? (
                                 <div className="grid grid-cols-2 gap-3">
                                    {renderUpgradeButton('jewelcraftersTable', jewelcrafterLevel)}
                                     <button
                                        onClick={onEnterGemSocketing}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-800/70 border border-yellow-600 rounded-lg text-white font-semibold hover:bg-yellow-700 transition-colors"
                                    >
                                        <Gem className="w-5 h-5"/>
                                        Socket Gems
                                    </button>
                                </div>
                            ) : (
                                renderUpgradeButton('jewelcraftersTable', jewelcrafterLevel)
                            )}
                        </div>
                    </div>


                    {/* Alchemist's Lab */}
                     <div className="bg-black/40 border border-purple-800/30 rounded-lg p-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 text-purple-300 flex-shrink-0"><FlaskConical className="w-full h-full" /></div>
                                <div>
                                    <p className="font-cinzel text-xl text-purple-300">Alchemist's Lab</p>
                                    <p className="text-sm text-yellow-400">Level {labLevel}</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 mt-3 h-16">{UPGRADE_DESCRIPTIONS.alchemistsLab[labLevel]}</p>
                        </div>
                        <div className="mt-4">
                            {renderUpgradeButton('alchemistsLab', labLevel)}
                        </div>
                     </div>


                    {labLevel > 0 && (
                        <div className="bg-black/20 border border-cyan-800/50 rounded-lg p-4">
                            <h3 className="font-cinzel text-lg text-cyan-300 mb-3">Available Elixirs</h3>
                            {player.activeElixir ? (
                                <div className="text-center text-gray-400 p-4 bg-gray-900/50 rounded-md">
                                    You already have an active elixir for your next journey.
                                </div>
                            ) : availableElixirs.length > 0 ? (
                                <div className="space-y-2">
                                    {availableElixirs.map(elixir => (
                                        <ElixirCard key={elixir.id} elixir={elixir} player={player} onBrew={handleBrew} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 p-4">
                                    Upgrade the lab to unlock more powerful elixirs.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampPhase;