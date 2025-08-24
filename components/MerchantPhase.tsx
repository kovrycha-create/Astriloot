import React, { useState, useEffect } from 'react';
import type { Player, JourneyEvent, ShopItem } from '../types';
import PlayerStats from './PlayerStats';
import ItemCard from './ItemCard';
import { Sparkles, Heart, Package, LogOut, Clock } from 'lucide-react';

interface MerchantPhaseProps {
  player: Player;
  event: JourneyEvent;
  onPurchase: (item: ShopItem) => void;
  onExit: () => void;
}

const ShopItemCard: React.FC<{
    item: ShopItem;
    playerEssence: number;
    onPurchase: (item: ShopItem) => void;
}> = ({ item, playerEssence, onPurchase }) => {
    const canAfford = playerEssence >= item.cost;
    
    return (
        <div className="bg-black/40 border border-purple-800/30 rounded-lg p-4 flex flex-col justify-between">
            <div>
                 {item.type === 'potion' ? (
                    <div className="flex items-center gap-4">
                        <Heart className="w-8 h-8 text-red-400 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-red-300">{item.name}</p>
                            <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                    </div>
                 ) : (
                    <ItemCard item={item.itemBase!} />
                 )}
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-300" />
                    <span className="font-bold text-lg text-cyan-300">{item.cost}</span>
                </div>
                <button
                    onClick={() => onPurchase(item)}
                    disabled={!canAfford}
                    className="px-4 py-2 bg-purple-800/70 border border-purple-600 rounded-lg text-white font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                    Buy
                </button>
            </div>
        </div>
    );
};


const MerchantPhase: React.FC<MerchantPhaseProps> = ({ player, event, onPurchase, onExit }) => {
  const { narrative, inventory = [] } = event;
  const hasItems = inventory.length > 0;
  const canAffordAnything = hasItems && inventory.some(item => player.essence >= item.cost);

  const DURATION = (hasItems && canAffordAnything) ? 22000 : 5000;

  const [timeLeft, setTimeLeft] = useState(Math.ceil(DURATION / 1000));
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = DURATION - elapsed;

      if (remaining <= 0) {
        clearInterval(timer);
        onExit();
      } else {
        setTimeLeft(Math.ceil(remaining / 1000));
        setProgress((remaining / DURATION) * 100);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [DURATION, onExit]);

  const isTimeLow = hasItems && canAffordAnything && timeLeft <= 5;
  const progressBarColor = isTimeLow ? 'bg-red-500' : 'bg-purple-500';
  const progressBarAnimation = isTimeLow ? 'animate-[pulse-warning_1s_ease-in-out_infinite]' : '';

  return (
    <div className="flex flex-col md:flex-row animate-fadeIn gap-8">
      <div className="w-full md:w-1/3 h-full flex flex-col">
          <PlayerStats player={player} />
          <div className="mt-auto pt-4">
            <button 
                onClick={onExit}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-900/70 border-2 border-red-700 rounded-lg text-white font-semibold transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/50"
            >
                <LogOut className="w-5 h-5" />
                Leave
            </button>
          </div>
      </div>

      <div className="w-full md:w-2/3 h-full flex flex-col">
        <header className="text-center mb-4">
            <h2 className="text-4xl font-cinzel text-purple-300">Wandering Merchant</h2>
            <p className="text-gray-400 italic mt-1">{narrative}</p>
        </header>

        <div className="h-[520px] overflow-y-auto pr-2 space-y-4">
            {hasItems ? (
                inventory.map(item => (
                    <ShopItemCard 
                        key={item.id}
                        item={item}
                        playerEssence={player.essence}
                        onPurchase={onPurchase}
                    />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <Package className="w-16 h-16 mb-4" />
                    <p className="text-xl">The merchant has packed up and moved on.</p>
                </div>
            )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-purple-800/30">
            <div className="w-full bg-black/60 rounded-full h-4 border border-gray-600 p-0.5 relative">
                <div
                    className={`h-full rounded-full transition-all duration-100 ease-linear ${progressBarColor} ${progressBarAnimation}`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="mt-2 text-center text-sm h-5">
                {isTimeLow ? (
                    <div className="flex items-center justify-center gap-2 text-red-400 font-bold animate-pulse">
                        <Clock className="w-5 h-5" />
                        <span>{timeLeft}s</span>
                    </div>
                ) : (!hasItems || !canAffordAnything) ? (
                    <p className="text-gray-500">Leaving shortly...</p>
                ) : null}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantPhase;