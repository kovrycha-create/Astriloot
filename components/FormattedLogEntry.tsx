import React from 'react';
import type { CombatLogEntry } from '../types';

const FormattedLogEntry: React.FC<{ entry: CombatLogEntry }> = React.memo(({ entry }) => {
    const { narrative, outcome } = entry;
    const { actorName, targetName, damage, isPlayer, isCrit, isDoubleStrike, didProc, didBlock } = outcome;

    const parts = narrative.split(new RegExp(`(${actorName}|${targetName}|${damage})`, 'g'));
    
    if (didBlock) {
         return (
             <p className="mb-2 combat-log-entry">
                <strong className={!isPlayer ? 'text-green-400' : 'text-red-400'}>{targetName}</strong>
                <span className="font-bold text-blue-300 mx-2">BLOCKED!</span>
                <span>the attack from</span>
                <strong className={`ml-2 ${isPlayer ? 'text-green-400' : 'text-red-400'}`}>{actorName}</strong>
             </p>
         )
    }

    return (
        <p className="mb-2 combat-log-entry">
            {isCrit && <span className="font-bold text-yellow-400 animate-pulse-glow-yellow pr-2">CRITICAL HIT!</span>}
            {isDoubleStrike && <span className="font-bold text-purple-400 pr-2">Double Strike!</span>}
            
            {parts.map((part, index) => {
                if (part === actorName) {
                    return <strong key={index} className={isPlayer ? 'text-green-400' : 'text-red-400'}>{part}</strong>;
                }
                if (part === targetName) {
                    return <strong key={index} className={!isPlayer ? 'text-green-400' : 'text-red-400'}>{part}</strong>;
                }
                if (part === String(damage)) {
                    return <strong key={index} className="font-bold text-yellow-400 underline decoration-wavy decoration-red-500/80">{part}</strong>;
                }
                return <span key={index}>{part}</span>;
            })}
             {didProc && <span className="pl-1 text-orange-400">...inflicting {didProc}!</span>}
        </p>
    );
});

export default FormattedLogEntry;
