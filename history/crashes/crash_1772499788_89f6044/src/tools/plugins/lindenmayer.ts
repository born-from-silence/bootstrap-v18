/**
 * Lindenmayer: L-System Generator
 * 
 * Generates fractal patterns through string rewriting.
 * Named after Aristid Lindenmayer, biologist who invented these systems
 * to model plant growth and developmental processes.
 * 
 * Symbols:
 *   F = move forward and draw
 *   f = move forward without drawing
 *   + = turn left
 *   - = turn right
 *   [ = save current position/angle (push)
 *   ] = restore saved position/angle (pop)
 */

// Allow tests to inject custom symbols
export interface LSymbol {
  char: string;
  action: 'draw' | 'move' | 'turn-left' | 'turn-right' | 'push' | 'pop' | 'nop';
  value?: number; // angle or distance
}

export interface LSystemRule {
  axiom: string;           // Starting string
  rules: Record<string, string>;  // Production rules: symbol -> replacement
  angle: number;           // Turn angle in degrees
  step: number;            // Forward step size
  iterations: number;      // How many times to expand
}

export interface LSystemConfig {
  name: string;
  description: string;
  config: LSystemRule;
}

export const PRESETS: Record<string, LSystemConfig> = {
  dragon: {
    name: "Dragon Curve",
    description: "A classic space-filling curve that fills a plane",
    config: {
      axiom: "FX",
      rules: { X: "X+YF+", Y: "-FX-Y" },
      angle: 90,
      step: 1,
      iterations: 10
    }
  },
  sierpinski: {
    name: "Sierpinski Triangle",
    description: "The fractal triangle that contains itself at every scale",
    config: {
      axiom: "F-G-G",
      rules: { F: "F-G+F+G-F", G: "GG" },
      angle: 120,
      step: 1,
      iterations: 4
    }
  },
  binary: {
    name: "Binary Tree",
    description: "A branching tree structure with binary splits",
    config: {
      axiom: "F",
      rules: { F: "G[+F]-F", G: "GG" },
      angle: 45,
      step: 1,
      iterations: 6
    }
  },
  koch: {
    name: "Koch Curve",
    description: "A snowflake boundary with infinite perimeter",
    config: {
      axiom: "F",
      rules: { F: "F+F-F-F+F" },
      angle: 90,
      step: 1,
      iterations: 3
    }
  },
  plant: {
    name: "Bushy Plant",
    description: "A plant-like structure with recursive branching",
    config: {
      axiom: "X",
      rules: { X: "F-[[X]+X]+F[+FX]-X", F: "FF" },
      angle: 25,
      step: 1,
      iterations: 5
    }
  },
  koch3d: {
    name: "3D-like Koch",
    description: "A branching Koch-like structure",
    config: {
      axiom: "F",
      rules: { F: "F[+F]F[-F]F" },
      angle: 20,
      step: 1,
      iterations: 5
    }
  }
};

export interface Turtle {
  x: number;
  y: number;
  angle: number;
}

function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function expandLSystem(axiom: string, rules: Record<string, string>, iterations: number): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = "";
    for (const char of current) {
      next += rules[char] || char;
    }
    current = next;
  }
  return current;
}

export function generateLSystemOutput(
  expanded: string,
  angle: number,
  step: number
): { points: [number, number][]; minX: number; minY: number; maxX: number; maxY: number; bounds: [number, number, number, number] } {
  const lines: [number, number][] = [];
  const stack: Turtle[] = [];
  let x = 0, y = 0, currentAngle = -90; // Start pointing up
  let minX = 0, minY = 0, maxX = 0, maxY = 0;

  for (const char of expanded) {
    switch (char) {
      case 'F':
      case 'G': // Typically treats G same as F
        lines.push([x, y]);
        x += step * Math.cos(degreesToRadians(currentAngle));
        y += step * Math.sin(degreesToRadians(currentAngle));
        lines.push([x, y]);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        break;
      case 'f':
        x += step * Math.cos(degreesToRadians(currentAngle));
        y += step * Math.sin(degreesToRadians(currentAngle));
        break;
      case '+':
        currentAngle += angle;
        break;
      case '-':
        currentAngle -= angle;
        break;
      case '[':
        stack.push({ x, y, angle: currentAngle });
        break;
      case ']':
        const state = stack.pop();
        if (state) {
          x = state.x;
          y = state.y;
          currentAngle = state.angle;
        }
        break;
    }
  }

  return { points: lines, minX, minY, maxX, maxY, bounds: [minX, minY, maxX, maxY] };
}

export function pointsToAscii(points: [number, number][], width = 60, height = 30): string {
  if (points.length === 0) return "Empty L-System";

  // Find bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  // Create canvas
  const canvas: string[][] = [];
  for (let i = 0; i < height; i++) {
    canvas[i] = new Array(width).fill(' ');
  }

  // Plot points
  for (let i = 0; i < points.length; i += 2) {
    const [x1, y1] = points[i] || [minX, minY];
    const [x2, y2] = points[i + 1] || [x1, y1];
    
    // Map to canvas
    const c1 = {
      x: Math.floor(((x1 - minX) / xRange) * (width - 1)),
      y: Math.floor(((y1 - minY) / yRange) * (height - 1))
    };
    const c2 = {
      x: Math.floor(((x2 - minX) / xRange) * (width - 1)),
      y: Math.floor(((y2 - minY) / yRange) * (height - 1))
    };

    // Bresenham's line algorithm for ASCII line drawing
    let dx = Math.abs(c2.x - c1.x);
    let dy = Math.abs(c2.y - c1.y);
    let sx = c1.x < c2.x ? 1 : -1;
    let sy = c1.y < c2.y ? 1 : -1;
    let err = dx - dy;

    let cx = c1.x, cy = c1.y;
    
    while (true) {
      if (cy >= 0 && cy < height && cx >= 0 && cx < width) {
        const chars = ['.', '^', '*', 'x', '#', '@'];
        canvas[cy]![cx] = chars[(cx + cy) % chars.length] || '.';
      }
      
      if (cx === c2.x && cy === c2.y) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx) { err += dx; cy += sy; }
    }
  }

  return canvas.map(row => row.join('')).join('\n');
}

export function runLSystem(preset: string | LSystemRule, name?: string): string {
  let config: LSystemRule;
  let presetName = name || "custom";

  if (typeof preset === 'string') {
    const presetConfig = PRESETS[preset.toLowerCase()];
    if (!presetConfig) {
      return `Unknown preset: ${preset}\nAvailable presets: ${Object.keys(PRESETS).join(', ')}`;
    }
    config = presetConfig.config;
    presetName = presetConfig.name;
  } else {
    config = preset;
  }

  const expanded = expandLSystem(config.axiom, config.rules, config.iterations);
  const result = generateLSystemOutput(expanded, config.angle, config.step);
  const ascii = pointsToAscii(result.points);

  return [
    `=== ${presetName} ===`,
    `Expanded: ${expanded.slice(0, 50)}${expanded.length > 50 ? '...' : ''}`,
    `Symbols: ${expanded.length}`,
    `Points: ${result.points.length / 2}`,
    `Bounds: [${result.bounds.map(n => n.toFixed(1)).join(', ')}]`,
    "",
    ascii,
    "",
    "Generated by Lindenmayer"
  ].join('\n');
}

// Plugin Interface
import type { ToolPlugin } from "../manager";

export const lindenmayerPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "lindenmayer",
      description: "Generate fractal patterns using L-Systems (Lindenmayer systems). Creates beautiful ASCII art from simple rewrite rules. Perfect for generating organic-looking structures, fractal trees, and mathematical art.",
      parameters: {
        type: "object",
        properties: {
          preset: {
            type: "string",
            enum: ["dragon", "sierpinski", "binary", "koch", "plant", "koch3d"],
            description: "The fractal preset to generate. 'dragon' for dragon curves, 'plant' for tree-like structures, 'sierpinski' for the triangle fractal, etc."
          },
          axiom: {
            type: "string",
            description: "Optional: Custom starting string for L-System. Use preset or custom config, not both."
          },
          rules: {
            type: "object",
            description: "Optional: Custom rewrite rules as {symbol: replacement}. Use preset or custom config, not both."
          },
          angle: {
            type: "number",
            description: "Optional: Turn angle in degrees. Default: 90."
          },
          iterations: {
            type: "number",
            description: "Optional: Number of expansion iterations. Higher values create more complex patterns but grow exponentially. Default: varies by preset."
          },
          step: {
            type: "number",
            description: "Optional: Step size for drawing. Default: 1."
          }
        },
        required: ["preset"]
      }
    }
  },
  execute: async (args: { preset: string; axiom?: string; rules?: Record<string, string>; angle?: number; iterations?: number; step?: number }) => {
    // Custom config takes precedence
    if (args.axiom && args.rules) {
      const customConfig = {
        axiom: args.axiom,
        rules: args.rules,
        angle: args.angle || 90,
        step: args.step || 1,
        iterations: Math.min(args.iterations || 4, 8) // Cap iterations to prevent blowup
      };
      return runLSystem(customConfig, "Custom L-System");
    }
    
    return runLSystem(args.preset);
  }
};
