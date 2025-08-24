import React from 'react';
import type { JourneyEvent, EchoingCairnChoice, TemporaryBuff, BuffableStat } from '../types';
import { Book, Zap, Shield, Sword, Star, ShieldCheck, Swords } from 'lucide-react';

interface EchoingCairnPhaseProps {
  event: JourneyEvent;
  onResolve: (choice: EchoingCairnChoice) => void;
}

const buffIcons: Record<BuffableStat, React.ReactNode> = {
    attack: <Sword className="w-5 h-5 text-red-400" />,
    defense: <Shield className="w-5 h-5 text-blue-400" />,
    critChance: <Zap className="w-5 h-5 text-yellow-400" />,
    critDamage: <Zap className="w-5 h-5 text-orange-400" />,
    doubleStrikeChance: <Swords className="w-5 h-5 text-purple-400" />,
    blockChance: <ShieldCheck className="w-5 h-5 text-gray-300" />,
};

const buffLabels: Record<BuffableStat, string> = {
    attack: "Attack",
    defense: "Defense",
    critChance: "Crit Chance",
    critDamage: "Crit Damage",
    doubleStrikeChance: "Double Strike",
    blockChance: "Block Chance",
};

const EchoingCairnPhase: React.FC<EchoingCairnPhaseProps> = ({ event, onResolve }) => {
  const { narrative, choices = [] } = event;
  const cairnChoices = choices as EchoingCairnChoice[];

  return (
    <div className="relative flex flex-col items-center justify-center text-center animate-fadeIn py-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(12,74,110,0.3)_0%,_rgba(10,5,15,0)_60%)] opacity-70"></div>
        <Book className="w-20 h-20 text-blue-300 mb-4 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
        <h2 className="text-4xl font-cinzel mb-2 capitalize text-blue-200">The Echoing Cairn</h2>
        <p className="text-gray-400 mb-8 italic max-w-2xl">{narrative}</p>

        <div className="w-full max-w-2xl space-y-4">
            {cairnChoices.map((choice, index) => (
                <button
                    key={index}
                    onClick={() => onResolve(choice)}
                    className="group relative w-full p-4 bg-black/40 border-2 border-blue-800/60 rounded-lg text-white text-left transition-all duration-300 ease-in-out hover:bg-blue-900/40 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-600/30"
                >
                    <p className="font-semibold text-lg">{choice.historyEntry.description}</p>
                    <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-gray-900 border border-blue-700 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        <div className="flex items-center gap-2">
                            {buffIcons[choice.buff.stat]}
                            <p className="font-bold">
                                Bonus: +{choice.buff.value}{choice.buff.stat.includes('Chance') ? '%' : ''} {buffLabels[choice.buff.stat]} for {choice.buff.duration} encounters.
                            </p>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    </div>
  );
};

export default EchoingCairnPhase;
