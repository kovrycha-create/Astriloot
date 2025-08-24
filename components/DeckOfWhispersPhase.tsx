import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Item, Rarity, RitualStep, Card, YlemModifier, CardType } from '../types';
import { runRitualSimulation } from '../utils/deckOfWhispers';
import { RARITY_COLORS, RARITY_STAT_MODIFIERS, DECK_OF_WHISPERS_CARDS, RARITY_BORDER_COLORS } from '../constants';
import ItemCard from './ItemCard';
import { HelpCircle, Gem, Waves, Biohazard, Zap, Atom, Sparkles, Eye, CircleDashed } from 'lucide-react';

interface DeckOfWhispersPhaseProps {
  item: Omit<Item, 'rarity'>;
  onComplete: (baseItem: Omit<Item, 'rarity'>, rarity: Rarity) => void;
}

// --- Sub-components for visual representation ---
const cardIcons: Record<string, React.ReactNode> = {
    "Ylem Fragment": <Gem className="w-full h-full" />,
    "Zya's Echo": <Waves className="w-full h-full" />,
    "Corrupted Ylem": <Biohazard className="w-full h-full text-red-400" />,
    "Unstable Ylem": <Zap className="w-full h-full text-yellow-400" />,
    "Harmonized Ylem": <Atom className="w-full h-full text-green-300" />,
    "AHYBE Resonance": <Sparkles className="w-full h-full" />,
    "Fyxion's Glimpse": <Eye className="w-full h-full" />,
    "Void's Whisper": <CircleDashed className="w-full h-full" />,
};

const CardDisplay: React.FC<{ card: Card }> = ({ card }) => (
    <div className="w-40 h-60 bg-gray-800 border-2 border-purple-500 rounded-lg p-3 flex flex-col justify-between text-center animate-fadeIn shadow-lg shadow-purple-500/30">
        <p className="font-cinzel text-xl leading-tight">{card.name}</p>
        <div className="w-16 h-16 mx-auto my-2 text-purple-200/70">
            {cardIcons[card.name]}
        </div>
        <p className="text-base text-purple-300">{card.type}</p>
    </div>
);

const CardBack: React.FC<{ remaining: number; isReshuffling: boolean; }> = ({ remaining, isReshuffling }) => {
    const cardBackUrl = 'https://deffy.me/imgs/card-back.png';
    
    const totalCards = DECK_OF_WHISPERS_CARDS.length;
    const glowIntensity = Math.min(1, ((totalCards - remaining) / (totalCards - 1)) * 1.5);
    const glowOpacity = glowIntensity ** 2;
    const glowColor = `rgba(168, 85, 247, ${glowOpacity * 0.7})`;
    const animationDuration = `${Math.max(0.5, 2.5 - glowIntensity * 2)}s`;

    return (
        <div className={`relative w-40 h-60 ${isReshuffling ? 'animate-deck-shuffle' : ''}`}>
            {Array.from({ length: Math.min(remaining, 8) }).map((_, i) => (
                 <img 
                    key={i}
                    src={cardBackUrl}
                    alt="Card Back"
                    className="absolute w-full h-full rounded-lg shadow-xl"
                    style={{ top: `${i * 2}px`, left: `${i * 2}px`, zIndex: 8-i }}
                 />
            ))}
            {remaining > 0 && (
                <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg z-10 transition-all duration-500"
                    style={{ 
                        boxShadow: `0 0 20px ${glowColor}`,
                        animation: `pulse-glow ${animationDuration} infinite ease-in-out`
                    }}
                >
                    <span className="text-5xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 0 3px black, 0 0 3px black' }}>{remaining}</span>
                </div>
            )}
        </div>
    );
};

const DrawnCardDisplay: React.FC<{ card: Card | null }> = ({ card }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const prevCardId = useRef<number | null>(null);
    const cardBackUrl = 'https://deffy.me/imgs/card-back.png';

    useEffect(() => {
        if (card && card.id !== prevCardId.current) {
            setIsRevealed(false); // Start as face-down
            const timer = setTimeout(() => setIsRevealed(true), 100); // Flip after a moment
            prevCardId.current = card.id;
            return () => clearTimeout(timer);
        }
    }, [card]);
    
    if (!card) {
        return <CardPlaceholder text="Drawing..." />;
    }

    return (
        <div className={`w-40 h-60 card-flipper ${isRevealed ? 'flipped' : ''}`}>
            <div className="card-inner">
                <div className="card-front">
                    <img src={cardBackUrl} alt="Card Back" className="w-full h-full rounded-lg shadow-xl" />
                </div>
                <div className="card-back">
                    <CardDisplay card={card} />
                </div>
            </div>
        </div>
    );
};


const CardPlaceholder: React.FC<{ text: string }> = ({ text }) => (
     <div className="w-40 h-60 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-center">
        <p className="text-gray-500">{text}</p>
    </div>
);

const DiscardPile: React.FC<{ cards: Card[]; isReshuffling: boolean; }> = ({ cards, isReshuffling }) => (
    <div className={`relative w-40 h-60 ${isReshuffling ? 'animate-discard-fly' : ''}`}>
        {cards.length > 0 ? (
            cards.slice(-5).map((card, index) => (
                <div key={card.id + '-' + index} className="absolute w-full h-full discard-card" style={{ top: `${index * 2}px`, left: `${index * 2}px`}}>
                    <div className="w-full h-full bg-gray-900/80 border border-gray-700 rounded-lg p-2 flex flex-col justify-center items-center text-center opacity-80">
                        <div className="w-8 h-8 text-gray-500">{cardIcons[card.name]}</div>
                    </div>
                </div>
            ))
        ) : (
             <CardPlaceholder text="Discard" />
        )}
    </div>
);

const cardTypeColors: Record<CardType, string> = {
    Ascendant: 'text-purple-400',
    Revelation: 'text-blue-400',
    Fluon: 'text-green-400',
    Ashard: 'text-red-400',
};

const FormattedRitualLogEntry: React.FC<{ entry: string }> = ({ entry }) => {
    const originalMessage = entry.substring(2);

    if (entry.startsWith('> Drawn:')) {
        const parts = originalMessage.match(/Drawn: (.*) \((.*)\)/);
        if (parts) {
            const [, name, type] = parts;
            const color = cardTypeColors[type as CardType] || 'text-gray-300';
            return <p className="mb-1 animate-fadeIn">{'> '}Drawn: <strong className="font-semibold text-white">{name}</strong> (<span className={`font-bold ${color}`}>{type}</span>)</p>;
        }
    }

    if (entry.startsWith('> Ylem Modifier Applied:')) {
        const modifier = originalMessage.split(': ')[1];
        return <p className="mb-1 animate-fadeIn font-bold text-yellow-400">{'> '}Ylem Modifier Applied: <span className="underline">{modifier}</span></p>;
    }

    if (entry.includes('Decision Phase begins!')) {
         return <p className="mb-1 animate-fadeIn font-bold text-red-400">{'> '}{originalMessage}</p>;
    }
    
    if (entry.includes('cards are reshuffled!')) {
         return <p className="mb-1 animate-fadeIn font-semibold text-cyan-400">{'> '}{originalMessage}</p>;
    }

    if (entry.startsWith('> Ritual Complete! Rarity Forged:')) {
        const rarity = originalMessage.split(': ')[1].replace('!', '') as Rarity;
        const color = RARITY_COLORS[rarity] || 'text-white';
        return <p className="mb-1 animate-fadeIn text-lg font-bold"><span className={color}>{`> Ritual Complete! Rarity Forged: ${rarity}!`}</span></p>;
    }

    return <p className="mb-1 animate-fadeIn">{entry}</p>;
}

const SimpleRules = () => (
    <div className="text-gray-300 space-y-3 max-h-[70vh] overflow-y-auto pr-4">
        <p className="font-bold">Goal:</p>
        <p>Draw cards to forge an artifact of immense power. The final card drawn determines the item's Rarity, which grants it powerful stat bonuses.</p>
        
        <p className="font-bold mt-4">The Cards:</p>
        <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-red-400">Ashard:</strong> The most basic essence. Drawing this usually results in a <strong className={RARITY_COLORS['Common']}>Common</strong> item, ending the ritual.</li>
            <li><strong className="text-green-400">Fluon:</strong> A catalyst. The first Fluon drawn applies a powerful <strong className="text-yellow-400">Ylem Modifier</strong> to the ritual and reshuffles the deck. A second Fluon results in an <strong className={RARITY_COLORS['Uncommon']}>Uncommon</strong> item.</li>
            <li><strong className="text-blue-400">Revelation:</strong> An echo of power. When drawn after a reshuffle, it can forge <strong className={RARITY_COLORS['Rare']}>Rare</strong> or even <strong className={RARITY_COLORS['Epic']}>Epic</strong> items, depending on the active modifier.</li>
            <li><strong className="text-purple-400">Ascendant:</strong> A fragment of truth. Drawing two Ascendants in a row triggers the <strong className="text-red-400">Decision Phase</strong>. The next card drawn will guarantee a high-tier outcome, from <strong className={RARITY_COLORS['Rare']}>Rare</strong> to <strong className={RARITY_COLORS['Legendary']}>Legendary</strong>.</li>
        </ul>
        
        <p className="font-bold mt-4">The Ultimate Prize:</p>
        <p>Achieving a <strong className={RARITY_COLORS['Mythic']}>Mythic</strong> rarity is a rare event, requiring a legendary sequence of cards, such as drawing three Ascendants followed by a final, decisive Revelation. Only the truly fortunate will witness such power.</p>
    </div>
);

const AdvancedRules = () => (
    <div className="text-gray-300 space-y-3 max-h-[70vh] overflow-y-auto pr-4">
        <h4 className="font-cinzel text-xl text-yellow-300 border-b border-yellow-800/50 pb-2">Advanced Ritual Mechanics</h4>
        
        <p className="font-bold">Ylem Modifiers:</p>
        <p>Drawing a <strong className="text-green-400">Fluon</strong> for the first time applies a modifier from its card and reshuffles the deck. This significantly alters outcomes:</p>
        <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Corrupted Ylem:</strong> Supercharges <strong className="text-blue-400">Revelation</strong> cards drawn after the reshuffle, leading to an <strong className={RARITY_COLORS['Epic']}>Epic</strong> result.</li>
            <li><strong>Unstable Ylem:</strong> Reacts with <strong className="text-red-400">Ashard</strong> cards, forcing an additional draw that can result in a <strong className={RARITY_COLORS['Rare+']}>Rare+</strong> item.</li>
            <li><strong>Harmonized Ylem:</strong> Stabilizes the ritual. It dampens a <strong className="text-green-400">Fluon</strong> drawn during the Decision Phase, resulting in an <strong className={RARITY_COLORS['Uncommon']}>Uncommon</strong> item instead of <strong className={RARITY_COLORS['Epic']}>Epic</strong>.</li>
        </ul>

        <p className="font-bold mt-4">The Decision Phase:</p>
        <p>Drawing two <strong className="text-purple-400">Ascendant</strong> cards consecutively triggers this high-stakes phase. The very next card determines the high-rarity outcome:</p>
        <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong className="text-purple-400">Ascendant:</strong> Guarantees a <strong className={RARITY_COLORS['Legendary']}>Legendary</strong> item.</li>
            <li><strong className="text-green-400">Fluon:</strong> Forges an <strong className={RARITY_COLORS['Epic']}>Epic</strong> item (unless Harmonized).</li>
            <li><strong className="text-red-400">Ashard:</strong> Results in a <strong className={RARITY_COLORS['Rare']}>Rare</strong> item.</li>
            <li><strong className="text-blue-400">Revelation:</strong> Creates a feedback loop, forcing another draw within the Decision Phase, extending the chance for a top-tier reward.</li>
        </ul>

        <p className="font-bold mt-4">Unseen Laws (Special Combinations):</p>
         <ul className="list-disc list-inside space-y-2 pl-4">
             <li><strong>Unstable Reaction:</strong> Unstable Ylem + Ashard → Draw again → (Ascendant/Revelation/Fluon) = <strong className={RARITY_COLORS['Rare+']}>Rare+</strong>.</li>
             <li><strong>Corrupted Echo:</strong> Corrupted Ylem + Revelation (after reshuffle) = <strong className={RARITY_COLORS['Epic']}>Epic</strong>.</li>
             <li><strong>The Mythic Invocation:</strong> The ultimate sequence. Drawing three consecutive <strong className="text-purple-400">Ascendants</strong>, with the final card in the deck being a <strong className="text-blue-400">Revelation</strong>, forges a <strong className={RARITY_COLORS['Mythic']}>Mythic</strong> artifact.</li>
         </ul>
    </div>
);


const DeckOfWhispersPhase: React.FC<DeckOfWhispersPhaseProps> = ({ item, onComplete }) => {
    const [ritualLog, setRitualLog] = useState<string[]>([]);
    const [drawnCard, setDrawnCard] = useState<Card | null>(null);
    const [finalRarity, setFinalRarity] = useState<Rarity | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [showAdvancedRules, setShowAdvancedRules] = useState(false);
    
    const [deckSize, setDeckSize] = useState(DECK_OF_WHISPERS_CARDS.length);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);
    const [modifierCard, setModifierCard] = useState<Card | null>(null);
    const [isReshuffling, setIsReshuffling] = useState(false);
    
    const simulationRef = useRef(runRitualSimulation());
    const logContainerRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<number | null>(null);
    
    const DURATION = 4000;
    const [timeLeft, setTimeLeft] = useState(DURATION);
    const onCompleteCalled = useRef(false);
    
    const handleComplete = useCallback(() => {
        if (!onCompleteCalled.current && finalRarity) {
            onCompleteCalled.current = true;
            onComplete(item, finalRarity);
        }
    }, [finalRarity, item, onComplete]);

    useEffect(() => {
        if (isComplete) {
            const INTERVAL = 50;
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    const newTime = prev - INTERVAL;
                    if (newTime <= 0) {
                        clearInterval(timer);
                        handleComplete();
                        return 0;
                    }
                    return newTime;
                });
            }, INTERVAL);
            return () => clearInterval(timer);
        }
    }, [isComplete, handleComplete]);

    const handleClick = () => {
        setTimeLeft(prev => {
            const newTime = prev - DURATION * 0.34; // 3 clicks to skip
            if (newTime <= 0) {
                handleComplete();
                return 0;
            }
            return newTime;
        });
    };

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [ritualLog]);

    const handleShowHelp = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setIsHelpVisible(true);
    };

    const handleHideHelp = () => {
        setIsHelpVisible(false);
        setShowAdvancedRules(false); // Reset to simple rules when closing
        runSimulation(); // Resume simulation
    };

    const processNextStep = (step: IteratorResult<RitualStep, any>) => {
        if (step.done) {
            const result = step.value;
            setFinalRarity(result.rarity);
            setRitualLog(prev => [...prev, `> Ritual Complete! Rarity Forged: ${result.rarity}!`]);
            // Don't discard the final card, leave it visible
            setTimeout(() => setIsComplete(true), 1500);
            return;
        }

        const currentStep = step.value;
        switch (currentStep.type) {
            case 'START':
                setDeckSize(currentStep.deckSize);
                setRitualLog(prev => [...prev, `> The Deck of Whispers awakens... ${currentStep.deckSize} cards are shuffled.`]);
                break;
            case 'DRAW':
                if (drawnCard) {
                    setDiscardPile(prev => [...prev, drawnCard]);
                }
                setDrawnCard(currentStep.card);
                setDeckSize(currentStep.remaining);
                setRitualLog(prev => [...prev, `> Drawn: ${currentStep.card.name} (${currentStep.card.type})`]);
                break;
            case 'MODIFIER':
                // Move the modifier card to its slot and the discard pile.
                setDiscardPile(prev => [...prev, currentStep.card]);
                setModifierCard(currentStep.card);
                setDrawnCard(null);
                setRitualLog(prev => [...prev, `> Ylem Modifier Applied: ${currentStep.modifier}!`]);
                break;
            case 'RESHUFFLE':
                setIsReshuffling(true);
                setRitualLog(prev => [...prev, `> The remaining ${currentStep.deckSize} cards are reshuffled!`]);
                setTimeout(() => {
                    setIsReshuffling(false);
                    setDiscardPile([]); // Clear the pile after animation
                }, 1000); // Animation is ~0.8s, this gives a small buffer
                break;
            case 'DECISION_PHASE':
                setRitualLog(prev => [...prev, '> Two Ascendants drawn... The Decision Phase begins!']);
                break;
            case 'LOG':
                setRitualLog(prev => [...prev, `> ${currentStep.message}`]);
                break;
        }
    };

    const runSimulation = (fastForward = false) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        if (finalRarity) return;

        if (fastForward) {
             let lastStep: IteratorResult<RitualStep, any>;
            do {
                lastStep = simulationRef.current.next();
                processNextStep(lastStep);
            } while (!lastStep.done);
            return;
        }

        const step = simulationRef.current.next();
        processNextStep(step);

        if (!step.done) {
            timerRef.current = window.setTimeout(() => runSimulation(), 1200);
        }
    };
    
    useEffect(() => {
        timerRef.current = window.setTimeout(() => runSimulation(), 500);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isComplete && finalRarity) {
        const modifierValue = RARITY_STAT_MODIFIERS[finalRarity];
        const finalItem: Item = {
            ...item,
            rarity: finalRarity,
            attack: Math.round((item.attack || 0) * modifierValue),
            defense: Math.round((item.defense || 0) * modifierValue),
            critChance: item.critChance ? Math.round(item.critChance * modifierValue) : undefined,
            critDamage: item.critDamage ? Math.round(item.critDamage * modifierValue) : undefined,
            doubleStrikeChance: item.doubleStrikeChance ? Math.round(item.doubleStrikeChance * modifierValue) : undefined,
            blockChance: item.blockChance ? Math.round(item.blockChance * modifierValue) : undefined,
        };
        
        const RARITY_BG_CLASSES: Record<Rarity, string> = {
            Common: 'rarity-bg-common',
            Uncommon: 'rarity-bg-uncommon',
            Rare: 'rarity-bg-rare',
            'Rare+': 'rarity-bg-rare-plus',
            Epic: 'rarity-bg-epic',
            Legendary: 'rarity-bg-legendary',
            Mythic: 'rarity-bg-mythic',
        };
        const bgClass = RARITY_BG_CLASSES[finalRarity];
        const progress = 100 - (timeLeft / DURATION) * 100;

        return (
             <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-50 animate-fadeIn cursor-pointer"
                onClick={handleClick}
            >
                <div className={`relative p-6 md:p-8 rounded-2xl shadow-2xl border-2 ${RARITY_BORDER_COLORS[finalRarity]} ${bgClass} w-full max-w-lg pointer-events-none`}>
                    <div className="text-center">
                        <h2 className={`font-cinzel text-3xl md:text-4xl mb-6 drop-shadow-lg ${RARITY_COLORS[finalRarity]}`}>
                            {finalRarity} Artifact Forged!
                        </h2>
                    </div>

                    <div className="mb-6">
                        <ItemCard item={finalItem} />
                    </div>
        
                    <div className="w-full max-w-sm mx-auto">
                        <div className="w-full bg-black/60 rounded-full h-2.5 border border-gray-600 p-0.5">
                            <div
                                className="h-full rounded-full bg-gray-400"
                                style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 text-center">Continuing journey... (Click to accelerate)</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col justify-center animate-fadeIn bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-purple-950 to-black p-4 gap-3">
             <button 
                onClick={handleShowHelp}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
                aria-label="Show ritual rules"
            >
                <HelpCircle className="w-8 h-8" />
            </button>

            <header className="text-center w-full">
                <h2 className="text-4xl font-cinzel text-purple-300">Deck of Whispers</h2>
                <p className="text-gray-400">The ritual determines the artifact's true power.</p>
            </header>

            <div className="w-full h-24 flex items-center justify-center">
                {modifierCard ? (
                    <div className="flex flex-col items-center animate-fadeIn">
                        <p className="font-cinzel text-sm text-yellow-400 mb-1">Active Modifier</p>
                        <div className="w-48 h-auto bg-gray-800 border-2 border-yellow-500 rounded p-2 text-center shadow-lg shadow-yellow-500/40 animate-pulse-glow">
                           <p className="font-cinzel text-lg leading-tight text-white">{modifierCard.name}</p>
                           <p className="text-base text-yellow-300 mt-1">{modifierCard.modifier}</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-48 h-full border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center opacity-50">
                        <p className="text-gray-600">Modifier Slot</p>
                    </div>
                )}
            </div>

            <div className="w-full grid grid-cols-3 gap-4 items-center justify-items-center h-full px-4">
                <div className="flex flex-col items-center gap-2">
                    {deckSize > 0 ? <CardBack remaining={deckSize} isReshuffling={isReshuffling} /> : <CardPlaceholder text="Deck Empty"/>}
                    <p className="font-semibold text-gray-400">Deck</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <DrawnCardDisplay key={drawnCard?.id || 'placeholder'} card={drawnCard} />
                     <p className="font-semibold text-gray-400 h-6">{drawnCard ? "Drawn Card" : ""}</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <DiscardPile cards={discardPile} isReshuffling={isReshuffling} />
                    <p className="font-semibold text-gray-400">Discard</p>
                </div>
            </div>
            
            <div className="w-full max-w-3xl self-center">
                <div ref={logContainerRef} className="w-full h-28 bg-black/50 border border-purple-800/30 rounded-lg p-3 overflow-y-auto text-sm text-gray-300 italic shadow-inner">
                    {ritualLog.map((entry, index) => <FormattedRitualLogEntry key={index} entry={entry} />)}
                </div>
                
                {!finalRarity && !isHelpVisible && (
                    <div className="text-center">
                        <button 
                            onClick={() => runSimulation(true)}
                            className="mt-4 px-6 py-2 bg-purple-800/70 border border-purple-600 rounded-lg text-white font-semibold hover:bg-purple-700 transition-colors"
                        >
                            Skip Ritual
                        </button>
                    </div>
                )}
            </div>

             {isHelpVisible && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-gray-900 border-2 border-purple-700 rounded-xl p-8 max-w-2xl w-11/12 md:w-full text-left shadow-2xl relative">
                        <h3 className="font-cinzel text-3xl text-purple-300 mb-4 text-center">The Deck of Whispers</h3>
                        
                        {showAdvancedRules ? <AdvancedRules /> : <SimpleRules />}
                        
                        <div className="flex items-center mt-6 gap-4">
                            <button
                                onClick={() => setShowAdvancedRules(prev => !prev)}
                                className="w-1/3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors text-sm"
                            >
                                {showAdvancedRules ? 'Simple Rules' : 'Advanced Rules'}
                            </button>
                            <button
                                onClick={handleHideHelp}
                                className="w-2/3 py-2 bg-purple-800 hover:bg-purple-700 rounded-lg font-semibold text-white transition-colors"
                            >
                                Resume Ritual
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeckOfWhispersPhase;