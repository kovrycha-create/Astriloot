import React, { useEffect, useRef } from 'react';
import type { Player, PathNode, JourneyNode, JourneyEventType } from '../types';
import PlayerStats from './PlayerStats';
import { Loader, Gift, Heart, AlertTriangle, HelpCircle, Store, GitBranch, Sword, Flame, Trophy, Book, User, Download } from 'lucide-react';
import { GRID_WIDTH, GRID_HEIGHT } from '../utils/pathfinding';

interface JourneyPhaseProps {
  player: Player;
  narrative: string;
  mapImageUrl: string | null;
  victories: number;
  path: PathNode[];
  nodes: JourneyNode[];
  isPaused: boolean;
  onNextStep: () => void;
  onSetMouseInfluence: (influence: 'up' | 'down' | null) => void;
}

const IS_DEV_MODE = true;

const nodeIcons: Record<JourneyEventType, React.ReactNode> = {
    treasure: <Gift className="w-full h-full text-yellow-400" />,
    shrine: <Heart className="w-full h-full text-green-400" />,
    trap: <AlertTriangle className="w-full h-full text-red-400" />,
    discovery: <HelpCircle className="w-full h-full text-blue-400" />,
    merchant: <Store className="w-full h-full text-cyan-400" />,
    dilemma: <GitBranch className="w-full h-full text-blue-400" />,
    echoing_cairn: <Book className="w-full h-full text-blue-300" />,
};

const JourneyPhase: React.FC<JourneyPhaseProps> = ({ 
    player, narrative, mapImageUrl, victories, path, nodes, isPaused, onNextStep, onSetMouseInfluence
}) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The journey logic should run even without a map image.
    if (isPaused || path.length === 0) return;

    const timer = setInterval(() => {
      onNextStep();
    }, 350);

    return () => clearInterval(timer);
  }, [isPaused, onNextStep, path.length]);

  const imgSrc = mapImageUrl && mapImageUrl.startsWith('http')
    ? mapImageUrl
    : `data:image/png;base64,${mapImageUrl}`;

  const playerPosition = path[path.length - 1];
  const playerX = playerPosition ? (playerPosition.x / (GRID_WIDTH - 1)) * 100 : 0;
  const playerY = playerPosition ? (playerPosition.y / (GRID_HEIGHT -1)) * 100 : 50;
  
  const pathData = path.map((p, i) => {
    const x = (p.x / (GRID_WIDTH - 1)) * 100;
    const y = (p.y / (GRID_HEIGHT - 1)) * 100;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current || !playerPosition) return;
    const rect = mapRef.current.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const playerPixelY = (playerY / 100) * rect.height;

    // Only influence if the mouse is ahead of the player
    const playerPixelX = (playerX / 100) * rect.width;
    const mouseX = e.clientX - rect.left;
    if (mouseX < playerPixelX) {
        onSetMouseInfluence(null);
        return;
    }

    const deadZone = rect.height * 0.15; // 15% deadzone in the middle

    if (mouseY < playerPixelY - deadZone) {
        onSetMouseInfluence('up');
    } else if (mouseY > playerPixelY + deadZone) {
        onSetMouseInfluence('down');
    } else {
        onSetMouseInfluence(null);
    }
  };

  const handleMouseLeave = () => {
    onSetMouseInfluence(null);
  };
  
  const handleDownload = (base64Data: string, filename: string) => {
    if (!base64Data || base64Data.startsWith('http')) {
        console.warn('Download button is only for AI-generated base64 images.');
        return;
    }
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row items-start animate-fadeIn gap-8">
      <div className="w-full md:w-1/3 h-full flex flex-col">
        <PlayerStats player={player} />
      </div>

      <div className="w-full md:w-2/3 flex flex-col gap-4">
        {/* Header section */}
        <div className="flex justify-between items-start min-h-[80px]">
          {/* Top-left: Journey info */}
          <div className="md:text-left">
            <h2 className="text-2xl font-cinzel text-purple-300 mb-1">The Journey</h2>
            <p className="text-gray-400 italic max-w-md">{narrative}</p>
          </div>
          {/* Top-right: Victories & Camp Progress */}
          <div className="text-right flex-shrink-0 ml-4">
            <div>
              <p className="text-3xl font-cinzel text-yellow-400">Victories: {victories}</p>
              <div className="flex flex-col items-end mt-3">
                  <p className="text-sm text-gray-400">Camp Progress</p>
                  <div className="flex gap-1.5 mt-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                          <Flame key={i} className={`w-5 h-5 transition-colors ${i < victories % 3 ? 'text-orange-400' : 'text-gray-700'}`} />
                      ))}
                  </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Map */}
        <div 
          ref={mapRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-96 bg-black/30 rounded-lg border-2 border-purple-800/50 flex items-center justify-center relative overflow-hidden cursor-crosshair"
        >
          {/* Background: Render map image if available, otherwise show loader text */}
          {mapImageUrl ? (
             <img src={imgSrc} alt="Journey Map" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
                <Loader className="w-12 h-12 animate-spin text-purple-400 mb-4" />
                <p>Charting the unknown...</p>
            </div>
          )}

          {IS_DEV_MODE && mapImageUrl && !mapImageUrl.startsWith('http') && (
            <button
              onClick={() => handleDownload(mapImageUrl, `journey-map-${Date.now()}.png`)}
              className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white/80 hover:bg-blue-800 hover:text-white transition-colors z-10"
              title="Download Map Image"
            >
              <Download className="w-5 h-5" />
            </button>
          )}

          {/* Foreground: Render path and player icon if the journey has started */}
          {path.length > 0 && (
             <>
                {mapImageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>}

                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d={pathData} stroke="rgba(250, 204, 21, 0.3)" strokeWidth="1" fill="none" strokeDasharray="2 2" />
                </svg>

                {nodes.map(node => (
                    <div
                        key={node.id}
                        className="absolute w-8 h-8 p-1 bg-black/50 rounded-full border-2 border-purple-500/80 animate-pulse-glow"
                        style={{
                            left: `calc(${(node.x / (GRID_WIDTH -1)) * 100}% - 16px)`,
                            top: `calc(${(node.y / (GRID_HEIGHT-1)) * 100}% - 16px)`,
                        }}
                        title={`Event: ${node.type}`}
                    >
                        {nodeIcons[node.type]}
                    </div>
                ))}
                
                <div 
                    className="absolute w-8 h-8 rounded-full shadow-lg border-2 border-yellow-300 animate-pulse-glow overflow-hidden bg-gray-800"
                    style={{ 
                        left: `calc(${playerX}% - 16px)`, 
                        top: `calc(${playerY}% - 16px)`,
                        transition: 'left 350ms linear, top 350ms linear'
                    }}>
                        <img 
                            src={`https://i.pravatar.cc/40?u=${encodeURIComponent(player.name)}`} 
                            alt="Player Icon"
                            className="w-full h-full object-cover"
                        />
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JourneyPhase;