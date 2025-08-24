import React, { useState } from 'react';
import type { PlayerAchievements, Achievement, AchievementCategory, AchievementTier } from '../types';
import { ACHIEVEMENTS_DATA } from '../constants';
import { X, Trophy, Sparkles, Star, CheckCircle, Sword, Map, ScrollText, BookOpen } from 'lucide-react';

interface AchievementsPhaseProps {
    playerAchievements: PlayerAchievements;
    onClaimReward: (achievementId: string, tierIndex: number) => void;
    onClaimAllRewards: () => void;
    hasUnclaimedRewards: boolean;
    onExit: () => void;
}

const categories: AchievementCategory[] = ['Combat', 'Journey', 'Whispers', 'Legacy'];

const categoryIcons: Record<AchievementCategory, React.ReactNode> = {
    Combat: <Sword className="w-6 h-6" />,
    Journey: <Map className="w-6 h-6" />,
    Whispers: <Sparkles className="w-6 h-6" />,
    Legacy: <BookOpen className="w-6 h-6" />,
};


const ProgressBar: React.FC<{ current: number, goal: number }> = ({ current, goal }) => {
    const percentage = Math.min((current / goal) * 100, 100);
    return (
        <div className="w-full bg-gray-700/50 rounded-full h-2.5 relative">
            <div
                className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            ></div>
            <span className="absolute inset-0 text-center text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                {Math.min(current, goal).toLocaleString()} / {goal.toLocaleString()}
            </span>
        </div>
    );
};

const AchievementEntry: React.FC<{
    achievement: Achievement;
    progress: PlayerAchievements[string];
    onClaimReward: (achievementId: string, tierIndex: number) => void;
}> = ({ achievement, progress, onClaimReward }) => {
    const highestUnlocked = progress.unlockedTier;
    const highestClaimed = progress.claimedTier;

    return (
        <div className="bg-black/20 border border-purple-800/20 rounded-lg p-4">
            <div className="flex items-start gap-4">
                <Trophy className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-cinzel text-lg text-purple-300">{achievement.name}</h4>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                </div>
            </div>
            <div className="mt-4 space-y-3 pl-12">
                {achievement.tiers.map((tier, index) => {
                    const isUnlocked = highestUnlocked >= index;
                    const isClaimed = highestClaimed >= index;
                    const canClaim = isUnlocked && !isClaimed;

                    return (
                        <div key={index} className={`p-3 rounded-md transition-all ${isUnlocked ? 'bg-gray-800/50' : 'bg-gray-900/30 opacity-60'}`}>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-grow">
                                    <p className="text-sm text-gray-300">{tier.description}</p>
                                    <ProgressBar current={progress.currentValue} goal={tier.goal} />
                                </div>
                                {isClaimed ? (
                                    <div className="flex flex-col items-center text-green-400 w-24">
                                        <CheckCircle className="w-6 h-6" />
                                        <span className="text-xs font-semibold">Claimed</span>
                                    </div>
                                ) : canClaim ? (
                                    <button
                                        onClick={() => onClaimReward(achievement.id, index)}
                                        className="w-24 flex-shrink-0 py-2 px-3 bg-yellow-600 border border-yellow-500 rounded-lg text-white font-semibold hover:bg-yellow-500 transition-colors animate-pulse-glow-gold"
                                    >
                                        Claim
                                    </button>
                                ) : (
                                    <div className="w-24 flex-shrink-0 text-center">
                                        <div className="flex items-center justify-center gap-1.5 font-semibold text-gray-400">
                                            {tier.reward.type === 'essence' ? <Sparkles className="w-4 h-4 text-cyan-400" /> : <Star className="w-4 h-4 text-blue-400" />}
                                            <span>{tier.reward.value}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AchievementsPhase: React.FC<AchievementsPhaseProps> = ({ playerAchievements, onClaimReward, onClaimAllRewards, hasUnclaimedRewards, onExit }) => {
    const [activeCategory, setActiveCategory] = useState<AchievementCategory>('Combat');

    const filteredAchievements = ACHIEVEMENTS_DATA.filter(ach => ach.category === activeCategory);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-gray-900 border-2 border-purple-700/50 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                <header className="relative flex items-center justify-between p-4 border-b border-purple-800/30">
                    <div className="w-1/3">
                        {hasUnclaimedRewards && (
                            <button
                                onClick={onClaimAllRewards}
                                className="px-4 py-2 bg-yellow-600 border border-yellow-500 rounded-lg text-white font-semibold hover:bg-yellow-500 transition-colors animate-pulse-glow-gold text-sm"
                            >
                                Claim All
                            </button>
                        )}
                    </div>
                    <h2 className="font-cinzel text-3xl text-purple-300 text-center w-1/3">The Hero's Ledger</h2>
                    <div className="w-1/3 flex justify-end">
                        <button onClick={onExit} className="p-2 text-gray-400 hover:text-white transition-colors">
                            <X className="w-7 h-7" />
                        </button>
                    </div>
                </header>
                <div className="flex flex-grow overflow-hidden">
                    <nav className="w-24 flex flex-col items-center border-r border-purple-800/30 p-4">
                        <ul className="space-y-4">
                            {categories.map(cat => (
                                <li key={cat}>
                                    <button
                                        onClick={() => setActiveCategory(cat)}
                                        title={cat}
                                        className={`w-14 h-14 flex items-center justify-center rounded-lg transition-colors ${activeCategory === cat ? 'bg-purple-800/50 text-white' : 'text-gray-400 hover:bg-purple-900/30'}`}
                                    >
                                        {categoryIcons[cat]}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <main className="flex-grow p-4 overflow-y-auto achievement-scrollbar">
                        {filteredAchievements.length > 0 ? (
                            <div className="space-y-4">
                                {filteredAchievements.map(ach => (
                                    <AchievementEntry
                                        key={ach.id}
                                        achievement={ach}
                                        progress={playerAchievements[ach.id]}
                                        onClaimReward={onClaimReward}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <BookOpen className="w-16 h-16 mb-4" />
                                <p>No achievements recorded in this category yet.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AchievementsPhase;