import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { JourneyEventOutcome } from '../types';
import ItemCard from './ItemCard';
import { Heart, GitBranch, Package } from 'lucide-react';

interface DilemmaResultPhaseProps {
  result: {
    aftermath: string;
    outcome: JourneyEventOutcome;
  };
  onContinue: () => void;
}

const DilemmaResultPhase: React.FC<DilemmaResultPhaseProps> = ({ result, onContinue }) => {
  const DURATION = 5000;
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const onContinueCalled = useRef(false);

  const handleContinue = useCallback(() => {
    if (!onContinueCalled.current) {
        onContinueCalled.current = true;
        onContinue();
    }
  }, [onContinue]);

  useEffect(() => {
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
  }, [handleContinue]);

  const handleClick = () => {
      setTimeLeft(prev => {
          const newTime = prev - DURATION * 0.34;
          if (newTime <= 0) {
              handleContinue();
              return 0;
          }
          return newTime;
      });
  };

  const { aftermath, outcome } = result;
  const { xpGained, healthChange, itemDropped } = outcome;
  const progress = 100 - (timeLeft / DURATION) * 100;

  return (
    <div 
        className="flex flex-col items-center justify-center text-center animate-fadeIn py-24 cursor-pointer"
        onClick={handleClick}
    >
      <GitBranch className="w-20 h-20 text-blue-400 mb-4" />
      
      <h2 className="text-4xl font-cinzel mb-2 capitalize">The Aftermath</h2>
      <p className="text-gray-400 mb-8 italic max-w-2xl">{aftermath}</p>

      <div className="space-y-4 w-full max-w-md pointer-events-none">
        {xpGained > 0 && (
            <div className="flex items-center justify-center gap-3 bg-purple-500/20 border border-purple-500 p-3 rounded-lg">
                <p className="font-semibold text-lg text-purple-300">XP Gained: {xpGained}</p>
            </div>
        )}
        {healthChange > 0 && (
            <div className="flex items-center justify-center gap-3 bg-green-500/20 border border-green-500 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-green-300" />
                <p className="font-semibold text-lg text-green-300">Health Restored: {healthChange}</p>
            </div>
        )}
        {healthChange < 0 && (
            <div className="flex items-center justify-center gap-3 bg-red-500/20 border border-red-500 p-3 rounded-lg">
                <p className="font-semibold text-lg text-red-300">Health Lost: {Math.abs(healthChange)}</p>
            </div>
        )}
        {itemDropped && (
             <div className="flex flex-col items-center gap-3 bg-yellow-500/10 border border-yellow-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                    <Package className="w-6 h-6 text-yellow-300" />
                    <p className="font-semibold text-lg text-yellow-300">Item Found!</p>
                </div>
                <ItemCard item={itemDropped} />
            </div>
        )}
        {xpGained === 0 && healthChange === 0 && !itemDropped && (
             <div className="flex items-center justify-center gap-3 bg-gray-500/20 border border-gray-500 p-3 rounded-lg">
                <p className="text-lg text-gray-300">Your choice is made.</p>
            </div>
        )}
      </div>
      
      <div className="w-full max-w-sm mt-12 pointer-events-none">
        <div className="w-full bg-black/60 rounded-full h-2.5 border border-gray-600 p-0.5">
            <div
                className="h-full rounded-full bg-gray-400"
                style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
            ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Continuing journey... (Click to accelerate)</p>
      </div>
    </div>
  );
};

export default DilemmaResultPhase;