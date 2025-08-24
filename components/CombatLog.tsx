import React, { useEffect, useRef } from 'react';
import type { CombatLogEntry } from '../types';
import FormattedLogEntry from './FormattedLogEntry';

interface CombatLogProps {
  log: CombatLogEntry[];
  currentNarrative: string;
}

const CombatLog: React.FC<CombatLogProps> = ({ log, currentNarrative }) => {
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log, currentNarrative]);

  return (
    <div className="h-52 bg-black/50 border border-purple-800/30 rounded-lg p-4 overflow-y-auto text-gray-300 italic">
      {log.map((entry) => (
        <FormattedLogEntry key={entry.id} entry={entry} />
      ))}
      {currentNarrative && <p className="text-purple-300">{currentNarrative}<span className="animate-pulse">|</span></p>}
      <div ref={logEndRef} />
    </div>
  );
};

export default CombatLog;