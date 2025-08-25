

import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';

const loadingMessages = [
    "A new foe coalesces from the aether...",
    "Whispers in the dark take form...",
    "The fabric of reality shudders...",
    "Summoning a worthy opponent...",
    "Forging a challenger in arcane fires...",
];

interface LoadingPhaseProps {
    message?: string;
}

const LoadingPhase: React.FC<LoadingPhaseProps> = ({ message: staticMessage }) => {
  const [message, setMessage] = useState(staticMessage || loadingMessages[0]);

  useEffect(() => {
    if (staticMessage) {
      setMessage(staticMessage);
      return;
    }

    const interval = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = loadingMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [staticMessage]);

  return (
    <div className="flex flex-col items-center justify-center h-96 text-center animate-fadeIn">
      <Loader className="w-16 h-16 text-purple-400 animate-spin mb-6" />
      <h2 className="text-2xl font-cinzel text-purple-300 mb-2">{staticMessage ? "Forging Destiny" : "A Challenger Approaches"}</h2>
      <p className="text-lg text-gray-400 italic">{message}</p>
    </div>
  );
};

export default LoadingPhase;
