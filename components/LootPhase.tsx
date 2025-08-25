


import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { LootPhaseResult, RunHistoryEntry, RunHistoryEntryType, RunStats, Enchant, Gem } from '../types';
import { Award, Frown, Star, Package, Sword, HeartPulse, Shield, Zap, Swords, ShieldCheck, Gem as GemIcon, Sparkles, Brain, AlertTriangle, Heart, HelpCircle, Store, GitBranch, Pause, Play } from 'lucide-react';
import ItemCard from './ItemCard';
import FormattedLogEntry from './FormattedLogEntry';
import { RARITY_BORDER_COLORS, RARITY_COLORS, SOCKET_COLOR_CLASSES } from '../constants';


interface LootPhaseProps {
  result: LootPhaseResult;
  onContinue: () => void;
  enemyName: string;
}

const historyIconMap: Record<RunHistoryEntryType, React.ReactNode> = {
    'victory': <Sword className="w-5 h-5 text-green-400" />,
    'level-up': <Star className="w-5 h-5 text-yellow-400" />,
    'item-forged': <GemIcon className="w-5 h-5 text-purple-400" />,
    'event-trap': <AlertTriangle className="w-5 h-5 text-red-500" />,
    'event-shrine': <Heart className="w-5 h-5 text-green-300" />,
    'event-treasure': <Package className="w-5 h-5 text-yellow-500" />,
    'event-discovery': <HelpCircle className="w-5 h-5 text-blue-400" />,
    'event-merchant': <Store className="w-5 h-5 text-cyan-400" />,
    'event-dilemma-choice': <GitBranch className="w-5 h-5 text-blue-300" />,
};

const StatDisplay: React.FC<{ icon: React.ReactNode, label: string, value: number }> = ({ icon, label, value }) => (
    <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-md">
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-gray-300">{label}</span>
        </div>
        <span className="font-bold text-white">{value.toLocaleString()}</span>
    </div>
);


const DefeatScreen: React.FC<{ result: LootPhaseResult; onContinue: () => void; enemyName: string }> = ({ result, onContinue, enemyName }) => {
    const { victoryCount = 0, runStats, runHistory, finalLog } = result;
    
    return (
        <div className="flex flex-col items-center justify-center text-center animate-fadeIn py-12">
            <Frown className="w-20 h-20 text-red-500 mb-4" />
            <h2 className="text-4xl font-cinzel mb-2">Defeated</h2>
            <p className="text-gray-400 mb-2">You were defeated by {enemyName}.</p>
            <p className="font-cinzel text-xl text-yellow-400 mb-6">Your journey of <span className="text-2xl font-bold">{victoryCount}</span> victories has ended.</p>
            
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Run Analysis */}
                <div className="bg-black/30 border border-red-800/50 rounded-lg p-4 text-left">
                    <h3 className="font-cinzel text-xl text-red-300 mb-3 text-center border-b border-red-900/50 pb-2">Run Analysis</h3>
                    {runStats ? (
                        <div className="space-y-2">
                            <StatDisplay icon={<HeartPulse className="w-5 h-5 text-red-400" />} label="Damage Dealt" value={runStats.damageDealt} />
                            <StatDisplay icon={<Shield className="w-5 h-5 text-red-500" />} label="Damage Taken" value={runStats.damageTaken} />
                            <StatDisplay icon={<Zap className="w-5 h-5 text-yellow-400" />} label="Critical Hits" value={runStats.criticalHits} />
                            <StatDisplay icon={<Swords className="w-5 h-5 text-purple-400" />} label="Double Strikes" value={runStats.doubleStrikes} />
                            <StatDisplay icon={<ShieldCheck className="w-5 h-5 text-blue-300" />} label="Attacks Blocked" value={runStats.attacksBlocked} />
                            <StatDisplay icon={<Sword className="w-5 h-5 text-gray-300" />} label="Enemies Defeated" value={runStats.enemiesDefeated} />
                            <StatDisplay icon={<GemIcon className="w-5 h-5 text-purple-300" />} label="Items Forged" value={runStats.itemsForged} />
                            <StatDisplay icon={<Sparkles className="w-5 h-5 text-cyan-300" />} label="Essence Spent" value={runStats.essenceSpent} />
                             <StatDisplay icon={<Brain className="w-5 h-5 text-blue-300" />} label="Dilemmas Faced" value={runStats.dilemmasFaced} />
                        </div>
                    ) : <p className="text-gray-500">No stats recorded.</p>}
                </div>
                
                {/* Journey Log */}
                <div className="bg-black/30 border border-red-800/50 rounded-lg p-4 text-left flex flex-col">
                    <h3 className="font-cinzel text-xl text-red-300 mb-3 text-center border-b border-red-900/50 pb-2">Journey Log</h3>
                    {runHistory && runHistory.length > 0 ? (
                        <div className="space-y-2 overflow-y-auto pr-2 flex-grow h-64">
                            {runHistory.map((entry: RunHistoryEntry) => (
                                <div key={entry.id} className="flex items-start gap-3 text-sm">
                                    <div className="flex-shrink-0 mt-0.5">{historyIconMap[entry.type]}</div>
                                    <p className="text-gray-400">{entry.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500 text-center mt-4">The journey was too short to be remembered.</p>}
                </div>
            </div>

             {finalLog && (
                <div className="w-full max-w-md mb-6 bg-black/30 p-4 rounded-lg border border-red-800/50">
                    <h3 className="font-cinzel text-lg text-red-300 mb-2">Final Moments</h3>
                    <div className="text-left text-sm italic text-gray-400">
                        {finalLog.map(entry => (
                            <FormattedLogEntry key={entry.id} entry={entry} />
                        ))}
                    </div>
                </div>
            )}
            
            <button onClick={onContinue} className="w-full max-w-sm py-3 bg-purple-800/80 border-2 border-purple-600 rounded-lg text-white font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/50">
                Begin Anew
            </button>
        </div>
    );
}

const AnimatedXpBar: React.FC<{
    xpBefore: number;
    xpAfter: number;
    xpToNextLevel: number;
}> = ({ xpBefore, xpAfter, xpToNextLevel }) => {
    const [animatedXp, setAnimatedXp] = useState(xpBefore);

    useEffect(() => {
        const diff = xpAfter - xpBefore;
        if (diff <= 0) {
            setAnimatedXp(xpAfter);
            return;
        }

        let start: number | null = null;
        const duration = 1500;

        const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percentage = Math.min(progress / duration, 1);
            
            setAnimatedXp(xpBefore + diff * percentage);

            if (progress < duration) {
                window.requestAnimationFrame(step);
            } else {
                setAnimatedXp(xpAfter);
            }
        };

        const frameId = window.requestAnimationFrame(step);
        return () => window.cancelAnimationFrame(frameId);

    }, [xpBefore, xpAfter]);

    const percentage = xpToNextLevel > 0 ? (animatedXp / xpToNextLevel) * 100 : 0;
    
    return (
        <div className="w-full bg-black/60 rounded-full h-5 border-2 border-blue-800/80 p-0.5 relative">
            <div 
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${percentage}%`, transition: 'width 100ms linear' }}
            ></div>
            <span className="absolute w-full text-center inset-0 text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)] flex items-center justify-center">
                XP: {Math.floor(animatedXp)} / {xpToNextLevel}
            </span>
        </div>
    );
};

const NoLootDisplay: React.FC = () => (
    <div className="h-full flex flex-col items-center justify-center bg-black/30 border border-gray-700/50 rounded-lg p-6 text-center text-gray-500">
        <Package className="w-12 h-12 mb-2" />
        <p className="font-semibold">The foe turned to dust...</p>
        <p className="text-sm">...leaving no spoils behind.</p>
    </div>
);

const EnchantDisplay: React.FC<{ enchant: Enchant }> = ({ enchant }) => (
    <div className={`bg-black/30 border p-3 rounded-lg flex items-center gap-3 ${RARITY_BORDER_COLORS[enchant.rarity]}`}>
        <Sparkles className="w-8 h-8 text-yellow-300 flex-shrink-0" />
        <div>
            <p className={`font-bold ${RARITY_COLORS[enchant.rarity]}`}>{enchant.name}</p>
            <p className="text-sm text-gray-400">{enchant.effects.map(e => e.description).join(' ')}</p>
        </div>
    </div>
);

const GemDisplay: React.FC<{ gem: Gem }> = ({ gem }) => (
    <div className={`bg-black/30 border p-3 rounded-lg flex items-center gap-3 border-gray-600`}>
        <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${SOCKET_COLOR_CLASSES[gem.color].bg}`}>
            <GemIcon className="w-5 h-5 text-white/80" />
        </div>
        <div>
            <p className={`font-bold text-white`}>{gem.name}</p>
            <p className="text-sm text-gray-400">{gem.effects.map(e => `+${e.value}${e.stat.includes('Chance') ? '%' : ''} ${e.stat.replace(/([A-Z])/g, ' $1')}`).join(', ')}</p>
        </div>
    </div>
);


const VictoryStatDisplay: React.FC<{ icon: React.ReactNode, label: string, value: number }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-md border border-gray-700/50">
        <div className="w-8 h-8 flex items-center justify-center text-purple-300 flex-shrink-0">{icon}</div>
        <div className="flex-grow">
            <p className="text-gray-400 text-sm">{label}</p>
            <p className="font-bold text-white text-lg">{value.toLocaleString()}</p>
        </div>
    </div>
);


const VictoryScreen: React.FC<{ result: LootPhaseResult; onContinue: () => void; enemyName: string }> = ({ result, onContinue, enemyName }) => {
    const { xpGained, itemDropped, enchantDropped, gemsDropped, levelUp, xpBefore, xpAfter, xpToNextLevel, combatStats } = result;
    const DURATION = 3000;
    const [timeLeft, setTimeLeft] = useState(DURATION);
    const [isPaused, setIsPaused] = useState(false);
    const onContinueCalled = useRef(false);

    const handleContinue = useCallback(() => {
        if (!onContinueCalled.current) {
            onContinueCalled.current = true;
            onContinue();
        }
    }, [onContinue]);

    useEffect(() => {
        if (isPaused) return;

        const INTERVAL = 50;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev - INTERVAL;
                if (newTime <= 0) {
                    clearInterval(timer);
                    handleContinue();
                    return 0;
                }
                return newTime;
            });
        }, INTERVAL);
        return () => clearInterval(timer);
    }, [handleContinue, isPaused]);

    const handleClick = () => {
        if (isPaused) return;

        setTimeLeft(prev => {
            const newTime = prev - DURATION * 0.34; // 3 clicks to skip
            if (newTime <= 0) {
                handleContinue();
                return 0;
            }
            return newTime;
        });
    };

    const progress = 100 - (timeLeft / DURATION) * 100;

    return (
        <div
            className="relative flex flex-col items-center justify-center text-center animate-fadeIn p-4 sm:p-6 md:p-8 cursor-pointer overflow-hidden rounded-lg"
            onClick={handleClick}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsPaused(p => !p);
                }}
                className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white/80 hover:bg-purple-800 hover:text-white transition-colors"
                aria-label={isPaused ? "Resume" : "Pause"}
            >
                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
            </button>
            
             <div className="absolute inset-0 overflow-hidden -z-10 rounded-lg">
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"></div>
                <div 
                    className="absolute left-1/2 top-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(250,204,21,0)_0%,rgba(250,204,21,0.15)_15%,rgba(250,204,21,0)_25%,rgba(250,204,21,0)_50%,rgba(250,204,21,0.15)_65%,rgba(250,204,21,0)_75%,rgba(250,204,21,0)_100%)]"
                    style={{ animation: 'victory-rays-rotate 20s linear infinite' }}
                ></div>
            </div>

            <div className="flex flex-col items-center gap-6 w-full animate-[victory-entry-fade-in-up_0.8s_ease-out]">
                <header className="flex flex-col items-center gap-2">
                    <Award className="w-24 h-24 text-yellow-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.7)] animate-pulse" />
                     <h2 className="text-6xl font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-500" style={{ textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                        VICTORY
                    </h2>
                    <p className="text-gray-300 -mt-2">You have vanquished <span className="font-bold text-white">{enemyName}</span>!</p>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl">
                    {/* Left Column: Rewards */}
                    <div className="flex flex-col gap-4 bg-black/30 border border-gray-700/50 rounded-lg p-4">
                        <h3 className="font-cinzel text-xl text-purple-300 border-b border-purple-800/50 pb-2">Rewards</h3>
                         {levelUp && (
                            <div className="flex items-center justify-center gap-3 bg-yellow-900/50 border border-yellow-500 p-3 rounded-lg animate-level-up-glow">
                                <Star className="w-6 h-6 text-yellow-300" />
                                <p className="font-bold text-lg text-yellow-300">LEVEL UP!</p>
                            </div>
                        )}
                        {xpGained > 0 && xpBefore !== undefined && xpAfter !== undefined && xpToNextLevel !== undefined && (
                           <AnimatedXpBar 
                               xpBefore={xpBefore}
                               xpAfter={xpAfter}
                               xpToNextLevel={xpToNextLevel}
                           />
                        )}
                        {itemDropped && <ItemCard item={itemDropped} />}
                        {enchantDropped && <EnchantDisplay enchant={enchantDropped} />}
                        {gemsDropped && gemsDropped.map((gem, index) => <GemDisplay key={index} gem={gem} />)}
                        {!itemDropped && !enchantDropped && (!gemsDropped || gemsDropped.length === 0) && <NoLootDisplay />}
                    </div>

                    {/* Right Column: Combat Report */}
                     <div className="flex flex-col gap-4 bg-black/30 border border-gray-700/50 rounded-lg p-4">
                        <h3 className="font-cinzel text-xl text-purple-300 border-b border-purple-800/50 pb-2">Combat Report</h3>
                        {combatStats ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <VictoryStatDisplay icon={<HeartPulse className="w-6 h-6 text-red-400" />} label="Damage Dealt" value={combatStats.damageDealt || 0} />
                                <VictoryStatDisplay icon={<Shield className="w-6 h-6 text-blue-400" />} label="Damage Taken" value={combatStats.damageTaken || 0} />
                                <VictoryStatDisplay icon={<Zap className="w-6 h-6 text-yellow-400" />} label="Critical Hits" value={combatStats.criticalHits || 0} />
                                <VictoryStatDisplay icon={<Swords className="w-6 h-6 text-purple-400" />} label="Double Strikes" value={combatStats.doubleStrikes || 0} />
                                <VictoryStatDisplay icon={<ShieldCheck className="w-6 h-6 text-gray-300" />} label="Attacks Blocked" value={combatStats.attacksBlocked || 0} />
                            </div>
                        ) : <p className="text-gray-500">No combat data available.</p>}
                    </div>
                </div>

                <div className="w-full max-w-sm mt-4">
                    <div className="relative w-full py-3 bg-gray-800/80 border-2 border-purple-700 rounded-lg text-white font-bold text-lg overflow-hidden">
                        <div 
                             className="absolute top-0 left-0 h-full bg-purple-600/50"
                             style={{ width: `${progress}%`, transition: isPaused ? 'none' : 'width 100ms linear' }}
                        ></div>
                        <span className="relative z-10">CONTINUE</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Click anywhere to accelerate</p>
                </div>
            </div>
        </div>
    );
};

const LootPhase: React.FC<LootPhaseProps> = ({ result, onContinue, enemyName }) => {
  if (result.playerWon) {
    return <VictoryScreen result={result} onContinue={onContinue} enemyName={enemyName} />;
  } else {
    return <DefeatScreen result={result} onContinue={onContinue} enemyName={enemyName} />;
  }
};

export default LootPhase;