
import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  isPlayer?: boolean;
}

const HealthBar: React.FC<HealthBarProps> = ({ current, max, isPlayer = false }) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  
  let barColorClass = 'bg-red-500';
  if (percentage > 50) {
    barColorClass = 'bg-green-500';
  } else if (percentage > 25) {
    barColorClass = 'bg-yellow-500';
  }
  
  if(isPlayer) barColorClass = 'bg-green-500';

  return (
    <div className="w-full bg-black/60 rounded-full h-6 border-2 border-gray-600 p-1 relative">
      <div 
        className={`h-full rounded-full transition-all duration-500 ease-out ${barColorClass}`}
        style={{ width: `${percentage}%` }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
            {Math.ceil(current)} / {max}
        </span>
      </div>
    </div>
  );
};

export default HealthBar;