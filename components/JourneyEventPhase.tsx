import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { JourneyEvent } from '../types';
import ItemCard from './ItemCard';
import { Heart, HelpCircle, AlertTriangle, Gift } from 'lucide-react';

interface JourneyEventPhaseProps {
  event: JourneyEvent;
  onContinue: () => void;
}

const eventConfig = {
    treasure: {
        icon: <Gift className="w-20 h-20 text-yellow-400 mb-4" />,
        title: "Treasure Found!"
    },
    shrine: {
        icon: <Heart className="w-20 h-20 text-green-400 mb-4" />,
        title: "A Sacred Shrine"
    },
    trap: {
        icon: <AlertTriangle className="w-20 h-20 text-red-500 mb-4" />,
        title: "A Perilous Trap"
    },
    discovery: {
        icon: <HelpCircle className="w-20 h-20 text-blue-400 mb-4" />,
        title: "A Mysterious Discovery"
    }
};

const JourneyEventPhase: React.FC<JourneyEventPhaseProps> = ({ event, onContinue }) => {
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

  const { type, narrative, outcome } = event;
  const config = eventConfig[type];
  const progress = 100 - (timeLeft / DURATION) * 100;

  return (
    <div 
        className="flex flex-col items-center justify-center text-center animate-fadeIn py-24 cursor-pointer"
        onClick={handleClick}
    >
      {config.icon}
      
      <h2 className="text-4xl font-cinzel mb-2 capitalize">{config.title}</h2>
      <p className="text-gray-400 mb-8 italic max-w-2xl">{narrative}</p>

      <div className="space-y-4 w-full max-w-md pointer-events-none">
        {outcome.xpGained > 0 && (
            <div className="flex items-center justify-center gap-3 bg-purple-500/20 border border-purple-500 p-3 rounded-lg">
                <p className="font-semibold text-lg text-purple-300">XP Gained: {outcome.xpGained}</p>
            </div>
        )}
        {outcome.healthChange > 0 && (
            <div className="flex items-center justify-center gap-3 bg-green-500/20 border border-green-500 p-3 rounded-lg">
                <p className="font-semibold text-lg text-green-300">Health Restored: {outcome.healthChange}</p>
            </div>
        )}
        {outcome.healthChange < 0 && (
            <div className="flex items-center justify-center gap-3 bg-red-500/20 border border-red-500 p-3 rounded-lg">
                <p className="font-semibold text-lg text-red-300">Health Lost: {Math.abs(outcome.healthChange)}</p>
            </div>
        )}
        {outcome.itemDropped && (
            <ItemCard item={outcome.itemDropped} />
        )}
        {outcome.xpGained === 0 && outcome.healthChange === 0 && !outcome.itemDropped && (
             <div className="flex items-center justify-center gap-3 bg-gray-500/20 border border-gray-500 p-3 rounded-lg">
                <p className="text-lg text-gray-300">The path is clear.</p>
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

export default JourneyEventPhase;