import type { PathNode, JourneyNode, JourneyEventType } from '../types';

export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 12;

export const generateNodes = (forceFirstNodePositive: boolean = false): JourneyNode[] => {
    const nodes: JourneyNode[] = [];
    const nodeTypes: JourneyEventType[] = ['treasure', 'shrine', 'trap', 'discovery', 'merchant', 'dilemma', 'echoing_cairn'];
    let numberOfNodes = Math.floor(Math.random() * 4) + 3; // 3 to 6 nodes
    const occupiedCoords = new Set<string>();

    if (forceFirstNodePositive) {
        const type = Math.random() > 0.5 ? 'treasure' : 'shrine';
        const x = 3;
        const y = Math.floor(Math.random() * GRID_HEIGHT);
        const coordKey = `${x},${y}`;
        occupiedCoords.add(coordKey);
        nodes.push({ id: `${x}-${y}-forced`, x, y, type });
        numberOfNodes--; // Decrement the total number of nodes to generate
    }

    for (let i = 0; i < numberOfNodes; i++) {
        let x, y;
        let coordKey;
        // Avoid placing nodes in the first 3 and last 3 columns, and don't overlap
        do {
            x = Math.floor(Math.random() * (GRID_WIDTH - 6)) + 3;
            y = Math.floor(Math.random() * GRID_HEIGHT);
            coordKey = `${x},${y}`;
        } while (occupiedCoords.has(coordKey));

        occupiedCoords.add(coordKey);
        const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
        nodes.push({ id: `${x}-${y}-${i}`, x, y, type });
    }
    return nodes;
};

export const calculateNextStep = (currentPos: PathNode, influence: 'up' | 'down' | null): PathNode => {
    const moves = [
        { x: 1, y: 0, weight: 5 },  // Right
        { x: 1, y: -1, weight: 2 }, // Up-Right
        { x: 1, y: 1, weight: 2 },  // Down-Right
        { x: 0, y: -1, weight: 1 }, // Up
        { x: 0, y: 1, weight: 1 },  // Down
    ];
    
    // Apply influence by boosting weights
    if (influence === 'up') {
        moves.find(m => m.y === -1)!.weight *= 3.5; // Up-Right
        moves.find(m => m.x === 0 && m.y === -1)!.weight *= 3.5; // Up
    } else if (influence === 'down') {
        moves.find(m => m.y === 1)!.weight *= 3.5; // Down-Right
        moves.find(m => m.x === 0 && m.y === 1)!.weight *= 3.5; // Down
    }

    // Ensure we can't get stuck by having a tiny chance to move right even from border
    const validMoves = moves.filter(move => {
        const nextY = currentPos.y + move.y;
        const nextX = currentPos.x + move.x;
        // Prevent moving backwards or staying still
        if (nextX < currentPos.x) return false;
        if (nextX === currentPos.x && move.y !== 0) { // Allow pure vertical
             // but de-incentivize it heavily
             move.weight *= 0.1;
        } else if (nextX === currentPos.x && move.y === 0) return false;
        
        // Prevent moving off the y-axis
        return nextY >= 0 && nextY < GRID_HEIGHT;
    });

    const totalWeight = validMoves.reduce((sum, move) => sum + move.weight, 0);
    let random = Math.random() * totalWeight;

    for (const move of validMoves) {
        random -= move.weight;
        if (random <= 0) {
            return {
                x: currentPos.x + move.x,
                y: currentPos.y + move.y,
            };
        }
    }
    
    // Failsafe (e.g. if all moves are filtered out, which is unlikely)
    return { x: currentPos.x + 1, y: currentPos.y };
};