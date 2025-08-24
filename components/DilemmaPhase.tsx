import React, { useEffect, useState, useRef } from 'react';
import type { JourneyEvent, DilemmaChoice } from '../types';
import { GitBranch, Clock } from 'lucide-react';

interface DilemmaPhaseProps {
  event: JourneyEvent;
  onResolve: (choice: DilemmaChoice) => void;
}

const DilemmaPhase: React.FC<DilemmaPhaseProps> = ({ event, onResolve }) => {
  const { narrative } = event;
  // When in DilemmaPhase, the event choices are guaranteed to be of type DilemmaChoice.
  const choices = (event.choices || []) as DilemmaChoice[];

  const DURATION = 10000; // 10 seconds
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!choices || choices.length === 0) return;
    
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 50;
        if (newTime <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Auto-resolve with a random choice
          const randomChoice = choices[Math.floor(Math.random() * choices.length)];
          onResolve(randomChoice);
          return 0;
        }
        return newTime;
      });
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [choices, onResolve]);

  const handleChoice = (choice: DilemmaChoice) => {
    if (timerRef.current) clearInterval(timerRef.current);
    onResolve(choice);
  };

  const progress = (timeLeft / DURATION) * 100;

  return (
    <div className="flex flex-col items-center justify-center text-center animate-fadeIn py-12">
      <GitBranch className="w-20 h-20 text-blue-400 mb-4" />
      <h2 className="text-4xl font-cinzel mb-2 capitalize">A Dilemma</h2>
      <p className="text-gray-400 mb-8 italic max-w-2xl">{narrative}</p>

      <div className="w-full max-w-md space-y-4">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleChoice(choice)}
            className="w-full py-3 bg-purple-900/50 border-2 border-purple-700 rounded-lg text-white font-semibold transition-all duration-300 ease-in-out hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/50"
          >
            {choice.text}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm mt-12">
        <div className="w-full bg-black/60 rounded-full h-2.5 border border-gray-600 p-0.5 relative">
            <div
                className="h-full rounded-full bg-gray-400"
                style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
            ></div>
             <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                <Clock className="w-3 h-3 mr-1" />
                Auto-selecting in {Math.ceil(timeLeft / 1000)}s...
            </div>
        </div>
      </div>
    </div>
  );
};

export default DilemmaPhase;