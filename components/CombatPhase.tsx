import React, { useState } from 'react';
import type { Player, Enemy, Ability, CombatLogEntry } from '../types';
import CharacterDisplay from './CharacterDisplay';
import CombatLog from './CombatLog';
import { Sword, Sparkles, Shield } from 'lucide-react';

interface CombatPhaseProps {
  player: Player;
  enemy: Enemy;
  onPlayerAction: (ability: Ability) => void;
  combatLog: CombatLogEntry[];
  currentNarrative: string;
}

const AbilityIcon: React.FC<{type: Ability['type']}> = ({ type }) => {
    switch (type) {
        case 'attack': return <Sword className="w-4 h-4 mr-2" />;
        case 'defense': return <Shield className="w-4 h-4 mr-2" />;
        case 'utility': return <Sparkles className="w-4 h-4 mr-2" />;
        default: return <Sword className="w-4 h-4 mr-2" />;
    }
}

const CombatPhase: React.FC<CombatPhaseProps> = ({ player, enemy, onPlayerAction, combatLog, currentNarrative }) => {
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const handleAction = (ability: Ability) => {
    setIsPlayerTurn(false);
    onPlayerAction(ability);
    setTimeout(() => setIsPlayerTurn(true), 2500); // Re-enable buttons after enemy turn + buffer
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <CharacterDisplay character={player} isPlayer={true} />
        <CharacterDisplay character={enemy} />
      </div>

      <CombatLog log={combatLog} currentNarrative={currentNarrative} />
      
      <div>
        <h3 className="text-center font-cinzel text-xl mb-3">Choose Your Action</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {player.abilities.map((ability) => (
            <button
              key={ability.name}
              onClick={() => handleAction(ability)}
              disabled={!isPlayerTurn}
              className="group relative flex items-center justify-center text-center px-4 py-3 bg-purple-900/50 border-2 border-purple-700 rounded-lg text-white font-semibold transition-all duration-300 ease-in-out hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/50 disabled:bg-gray-700 disabled:border-gray-500 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              <AbilityIcon type={ability.type} />
              {ability.name}
              <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-gray-900 border border-purple-700 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <p className="font-bold">{ability.name} ({ability.type})</p>
                <p>{ability.description}</p>
                {ability.damage[1] > 0 && <p className="text-red-400">Damage: {ability.damage[0]}-{ability.damage[1]}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CombatPhase;