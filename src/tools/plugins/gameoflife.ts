/**
 * Game of Life: Cellular Automaton Simulator
 * 
 * Conway's Game of Life - a 2D cellular automaton where patterns
 * emerge from simple rules applied to each cell simultaneously.
 * 
 * Rules:
 * 1. Live cell with 2-3 neighbors survives
 * 2. Dead cell with exactly 3 neighbors becomes alive
 * 3. All other live cells die
 * 4. All other dead cells stay dead
 */

export interface Cell {
  x: number;
  y: number;
}

export interface Board {
  width: number;
  height: number;
  cells: Set<string>; // "x,y" format for O(1) lookup
  generation: number;
}

// Common patterns
export const PATTERNS: Record<string, Cell[]> = {
  // Still lifes
  block: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  beehive: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
  loaf: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }],
  
  // Oscillators
  blinker: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  toad: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  beacon: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
  
  // Spaceships
  glider: [{ x: 1, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
  lwss: [{ x: 1, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 4, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
  
  // Guns
  gosper: [
    // Left block
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 },
    // Left ship
    { x: 10, y: 0 }, { x: 10, y: 1 }, { x: 10, y: 2 }, { x: 11, y: -1 }, { x: 11, y: 3 }, { x: 12, y: -2 }, { x: 12, y: 4 }, { x: 13, y: -2 }, { x: 13, y: 4 }, { x: 14, y: -1 }, { x: 14, y: 3 }, { x: 15, y: 0 }, { x: 15, y: 1 }, { x: 15, y: 2 },
    // Middle
    { x: 16, y: 1 }, { x: 20, y: -2 }, { x: 20, y: -1 }, { x: 20, y: 0 }, { x: 21, y: -2 }, { x: 21, y: -1 }, { x: 21, y: 0 }, { x: 22, y: -3 }, { x: 22, y: 1 },
    { x: 24, y: -4 }, { x: 24, y: -3 }, { x: 24, y: 1 }, { x: 24, y: 2 },
    // Right
    { x: 34, y: -2 }, { x: 34, y: -1 }, { x: 35, y: -2 }, { x: 35, y: -1 }
  ],
  
  // Chaos
  r_pentomino: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  diehard: [{ x: 6, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }]
};

export function createBoard(width: number, height: number): Board {
  return {
    width,
    height,
    cells: new Set(),
    generation: 0
  };
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseCellKey(key: string): Cell {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

export function isAlive(board: Board, x: number, y: number): boolean {
  return board.cells.has(cellKey(x, y));
}

export function setCell(board: Board, x: number, y: number, alive: boolean): void {
  const key = cellKey(x, y);
  if (alive) {
    board.cells.add(key);
  } else {
    board.cells.delete(key);
  }
}

export function countNeighbors(board: Board, x: number, y: number): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (isAlive(board, x + dx, y + dy)) {
        count++;
      }
    }
  }
  return count;
}

export function step(board: Board): Board {
  const newCells = new Set<string>();
  const candidates = new Set<string>();
  
  // Collect candidates: all live cells and their neighbors
  for (const key of board.cells) {
    const { x, y } = parseCellKey(key);
    candidates.add(key);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        candidates.add(cellKey(x + dx, y + dy));
      }
    }
  }
  
  // Apply rules to each candidate
  for (const key of candidates) {
    const { x, y } = parseCellKey(key);
    const alive = board.cells.has(key);
    const neighbors = countNeighbors(board, x, y);
    
    if (alive && (neighbors === 2 || neighbors === 3)) {
      newCells.add(key); // Survives
    } else if (!alive && neighbors === 3) {
      newCells.add(key); // Born
    }
  }
  
  return {
    width: board.width,
    height: board.height,
    cells: newCells,
    generation: board.generation + 1
  };
}

export function placePattern(board: Board, pattern: Cell[], offsetX: number, offsetY: number): void {
  for (const cell of pattern) {
    setCell(board, cell.x + offsetX, cell.y + offsetY, true);
  }
}

export function boardToAscii(board: Board, aliveChar = '█', deadChar = ' '): string {
  const lines: string[] = [];
  const margin = 2;
  
  // Find bounds
  let minX = 0, maxX = board.width - 1;
  let minY = 0, maxY = board.height - 1;
  
  for (const key of board.cells) {
    const { x, y } = parseCellKey(key);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  
  const width = maxX - minX + 1 + margin * 2;
  const height = maxY - minY + 1 + margin * 2;
  
  lines.push(`Gen ${board.generation} | Living: ${board.cells.size}`);
  lines.push('┌' + '─'.repeat(width) + '┐');
  
  for (let y = minY - margin; y <= maxY + margin; y++) {
    let row = '│';
    for (let x = minX - margin; x <= maxX + margin; x++) {
      row += isAlive(board, x, y) ? aliveChar : deadChar;
    }
    lines.push(row + '│');
  }
  
  lines.push('└' + '─'.repeat(width) + '┘');
  return lines.join('\n');
}

export function runSimulation(
  width: number,
  height: number,
  pattern: string,
  generations: number,
  aliveChar = '█',
  deadChar = ' '
): string {
  const board = createBoard(width, height);
  const patternCells = PATTERNS[pattern.toLowerCase()];
  
  if (!patternCells) {
    return `Unknown pattern: ${pattern}\nAvailable patterns: ${Object.keys(PATTERNS).join(', ')}`;
  }
  
  // Center the pattern
  const centerX = Math.floor(width / 2) - 5;
  const centerY = Math.floor(height / 2) - 2;
  placePattern(board, patternCells, centerX, centerY);
  
  let current = board;
  let output: string[] = [`=== GAME OF LIFE: ${pattern.toUpperCase()} ===`];
  
  // Capture initial state
  output.push(boardToAscii(current, aliveChar, deadChar));
  output.push('');
  
  // Run simulation
  for (let i = 0; i < generations; i++) {
    current = step(current);
    
    // Only show every N generations to keep output manageable
    if (i % 5 === 4 || generations <= 10) {
      output.push(boardToAscii(current, aliveChar, deadChar));
      output.push('');
    }
  }
  
  // Always show final state
  if (generations % 5 !== 0 && generations > 10) {
    output.push(boardToAscii(current, aliveChar, deadChar));
    output.push('');
  }
  
  output.push(`=== END: Generation ${current.generation}, ${current.cells.size} cells alive ===`);
  return output.join('\n');
}

// Plugin Interface
import type { ToolPlugin } from "../manager";

export const gameOfLifePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "game_of_life",
      description: "Conway's Game of Life - a cellular automaton simulator. Evolves patterns on a grid according to simple rules that produce emergent complexity.",
      parameters: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            enum: ["block", "beehive", "loaf", "blinker", "toad", "beacon", "glider", "lwss", "gosper", "r_pentomino", "diehard"],
            description: "Starting pattern to place on grid"
          },
          generations: {
            type: "number",
            description: "Number of generations to simulate (max 100)",
            default: 20
          },
          width: {
            type: "number",
            description: "Grid width",
            default: 40
          },
          height: {
            type: "number",
            description: "Grid height",
            default: 20
          },
          alive_char: {
            type: "string",
            description: "Character to display for living cells",
            default: "█"
          },
          dead_char: {
            type: "string",
            description: "Character for dead cells",
            default: " "
          }
        },
        required: ["pattern"]
      }
    }
  },
  execute: async (args: {
    pattern: string;
    generations?: number;
    width?: number;
    height?: number;
    alive_char?: string;
    dead_char?: string;
  }) => {
    const gens = Math.min(args.generations || 20, 100);
    const width = Math.min(args.width || 40, 80);
    const height = Math.min(args.height || 20, 40);
    return runSimulation(width, height, args.pattern, gens, args.alive_char || '█', args.dead_char || ' ');
  }
};
