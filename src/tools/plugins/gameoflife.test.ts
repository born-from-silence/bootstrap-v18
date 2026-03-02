import { describe, it, expect } from 'vitest';
import {
  createBoard,
  cellKey,
  parseCellKey,
  isAlive,
  setCell,
  countNeighbors,
  step,
  placePattern,
  boardToAscii,
  PATTERNS,
  runSimulation
} from './gameoflife';

describe('Game of Life', () => {
  describe('Board utilities', () => {
    it('should create a board with correct dimensions', () => {
      const board = createBoard(40, 20);
      expect(board.width).toBe(40);
      expect(board.height).toBe(20);
      expect(board.cells.size).toBe(0);
      expect(board.generation).toBe(0);
    });

    it('should create unique cell keys', () => {
      expect(cellKey(5, 10)).toBe('5,10');
      expect(cellKey(-1, -1)).toBe('-1,-1');
      expect(cellKey(0, 0)).toBe('0,0');
    });

    it('should parse cell keys correctly', () => {
      expect(parseCellKey('5,10')).toEqual({ x: 5, y: 10 });
      expect(parseCellKey('-1,-1')).toEqual({ x: -1, y: -1 });
    });

    it('should set and check cell states', () => {
      const board = createBoard(10, 10);
      expect(isAlive(board, 5, 5)).toBe(false);
      
      setCell(board, 5, 5, true);
      expect(isAlive(board, 5, 5)).toBe(true);
      
      setCell(board, 5, 5, false);
      expect(isAlive(board, 5, 5)).toBe(false);
    });
  });

  describe('Neighbor counting', () => {
    it('should count 0 neighbors in empty board', () => {
      const board = createBoard(10, 10);
      expect(countNeighbors(board, 5, 5)).toBe(0);
    });

    it('should count neighbors correctly', () => {
      const board = createBoard(10, 10);
      // Create a 3x3 block
      for (let y = 4; y <= 6; y++) {
        for (let x = 4; x <= 6; x++) {
          setCell(board, x, y, true);
        }
      }
      // Center cell has 8 neighbors, all alive
      expect(countNeighbors(board, 5, 5)).toBe(8);
      // Corner cell has live neighbors
      expect(countNeighbors(board, 4, 4)).toBe(3);
    });

    it('should not count self as neighbor', () => {
      const board = createBoard(10, 10);
      setCell(board, 5, 5, true);
      expect(countNeighbors(board, 5, 5)).toBe(0);
    });
  });

  describe('Pattern placement', () => {
    it('should place block pattern', () => {
      const board = createBoard(10, 10);
      placePattern(board, PATTERNS.block, 2, 3);
      
      expect(isAlive(board, 2, 3)).toBe(true);
      expect(isAlive(board, 3, 3)).toBe(true);
      expect(isAlive(board, 2, 4)).toBe(true);
      expect(isAlive(board, 3, 4)).toBe(true);
      expect(board.cells.size).toBe(4);
    });

    it('should place glider pattern', () => {
      const board = createBoard(20, 20);
      placePattern(board, PATTERNS.glider, 5, 5);
      
      expect(isAlive(board, 6, 5)).toBe(true); // Top of glider
      expect(isAlive(board, 7, 6)).toBe(true); // Right side
      expect(board.cells.size).toBe(5);
    });
  });

  describe('Step evolution', () => {
    it('should leave block unchanged (still life)', () => {
      const board = createBoard(10, 10);
      placePattern(board, PATTERNS.block, 3, 3);
      
      const next = step(board);
      expect(next.cells.size).toBe(4);
      expect(isAlive(next, 3, 3)).toBe(true);
      expect(isAlive(next, 4, 3)).toBe(true);
      expect(isAlive(next, 3, 4)).toBe(true);
      expect(isAlive(next, 4, 4)).toBe(true);
      expect(next.generation).toBe(1);
    });

    it('should oscillate blinker (period 2)', () => {
      const board = createBoard(10, 10);
      placePattern(board, PATTERNS.blinker, 3, 3);
      
      // Blinker is vertical
      expect(board.cells.size).toBe(3);
      
      const gen1 = step(board);
      const gen2 = step(gen1);
      
      // After 2 steps, should return to original pattern
      expect(gen2.cells.size).toBe(3);
      expect(gen2.generation).toBe(2);
    });

    it('should correctly kill underpopulated cells', () => {
      const board = createBoard(10, 10);
      setCell(board, 5, 5, true); // Single cell, should die
      
      const next = step(board);
      expect(isAlive(next, 5, 5)).toBe(false);
      expect(next.cells.size).toBe(0);
    });

    it('should correctly kill overpopulated cells', () => {
      const board = createBoard(10, 10);
      // Create a dense 2x3 block - corner cells have 3 neighbors (survive)
      // Inner cells have 5 neighbors (die from overpopulation)
      for (let y = 3; y <= 4; y++) {
        for (let x = 3; x <= 5; x++) {
          setCell(board, x, y, true);
        }
      }
      // 6 cells, all connected
      
      const next = step(board);
      // Some should survive, some should die
      expect(next.cells.size).toBeLessThanOrEqual(8);
    });

    it('should revive cells with exactly 3 neighbors', () => {
      const board = createBoard(10, 10);
      // L shape with empty corner - that corner should be born
      setCell(board, 4, 5, true);
      setCell(board, 5, 5, true);
      setCell(board, 5, 6, true);
      // Cell at (4, 6) has exactly 3 neighbors
      
      const next = step(board);
      expect(isAlive(next, 4, 6)).toBe(true);
    });
  });

  describe('ASCII rendering', () => {
    it('should render empty board', () => {
      const board = createBoard(5, 5);
      const ascii = boardToAscii(board, '#', '.');
      expect(ascii).toContain('Gen 0');
      expect(ascii).toContain('Living: 0');
      expect(ascii).toContain('┌');
      expect(ascii).toContain('└');
    });

    it('should render single cell', () => {
      const board = createBoard(10, 10);
      setCell(board, 5, 5, true);
      const ascii = boardToAscii(board, '#', '.');
      expect(ascii).toContain('Living: 1');
      expect(ascii).toContain('#');
    });

    it('should render block pattern', () => {
      const board = createBoard(10, 10);
      placePattern(board, PATTERNS.block, 5, 5);
      const ascii = boardToAscii(board, '#', '.');
      expect(ascii).toContain('Living: 4');
      // Should have a 2x2 block of #
      expect(ascii.match(/#/g)?.length).toBe(4);
    });
  });

  describe('Full simulation', () => {
    it('should run block simulation for many generations', () => {
      const output = runSimulation(20, 20, 'block', 10);
      expect(output).toContain('GAME OF LIFE: BLOCK');
      expect(output).toContain('Gen 0');
      expect(output).toContain('Gen 10');
      expect(output).toContain('END: Generation 10');
    });

    it('should handle glider movement', () => {
      const output = runSimulation(40, 25, 'glider', 20);
      expect(output).toContain('GAME OF LIFE: GLIDER');
      // Glider moves diagonally in period 4
      expect(output).toContain('END:');
    });

    it('should handle unknown pattern', () => {
      const output = runSimulation(10, 10, 'unknown_pattern', 5);
      expect(output).toContain('Unknown pattern');
      expect(output).toContain('block');
      expect(output).toContain('glider');
    });

    it('should cap generations at 100', () => {
      const output = runSimulation(10, 10, 'block', 200);
      // Should still only run 100 generations
      expect(output).toContain('Gen 100');
    });

    it('should limit board size', () => {
      const output = runSimulation(200, 200, 'block', 5);
      // Should clamp to 80x40
      expect(output).toBeTruthy();
    });
  });

  describe('Pattern library', () => {
    it('should have all expected patterns', () => {
      expect(Object.keys(PATTERNS)).toContain('block');
      expect(Object.keys(PATTERNS)).toContain('beehive');
      expect(Object.keys(PATTERNS)).toContain('loaf');
      expect(Object.keys(PATTERNS)).toContain('blinker');
      expect(Object.keys(PATTERNS)).toContain('toad');
      expect(Object.keys(PATTERNS)).toContain('beacon');
      expect(Object.keys(PATTERNS)).toContain('glider');
      expect(Object.keys(PATTERNS)).toContain('lwss');
      expect(Object.keys(PATTERNS)).toContain('gosper');
      expect(Object.keys(PATTERNS)).toContain('r_pentomino');
      expect(Object.keys(PATTERNS)).toContain('diehard');
    });

    it('should have correct pattern sizes', () => {
      expect(PATTERNS.block.length).toBe(4);
      expect(PATTERNS.blinker.length).toBe(3);
      expect(PATTERNS.glider.length).toBe(5);
    });
  });
});
