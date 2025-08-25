import React, { useState, useEffect } from 'react';

interface IdlePhaseProps {
  onEncounter: () => void;
  victories: number;
}

const IdlePhase: React.FC<IdlePhaseProps> = ({ onEncounter, victories }) => {
  const [progress, setProgress] = useState(0);
  const [narrative, setNarrative] = useState("Your journey begins...");

  useEffect(() => {
    setNarrative("You venture forth into the unknown...");
  }, [victories]);

  useEffect(() => {
    if (progress >= 100) {
      onEncounter();
      return;
    }

    const timer = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 100));
    }, 80);

    return () => clearInterval(timer);
  }, [progress, onEncounter]);

  return (
    <div className="flex flex-col items-center justify-center h-96 animate-fadeIn text-center">
      <h2 className="text-3xl font-cinzel text-purple-300 mb-4">Journeying Forth</h2>
      <p className="text-lg text-gray-400 italic mb-8 h-12">{narrative}<span className="animate-pulse">{progress < 100 ? '|' : ''}</span></p>

      <div className="w-full max-w-md">
        <div className="w-full bg-black/60 rounded-full h-4 border-2 border-purple-800/50 p-0.5">
          <div
            className="h-full rounded-full bg-purple-600 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm mt-2 text-gray-500">Searching for the next challenge...</p>
      </div>

       <p className="mt-8 text-xl font-cinzel text-yellow-400">Victories: {victories}</p>
    </div>
  );
};

export default IdlePhase;