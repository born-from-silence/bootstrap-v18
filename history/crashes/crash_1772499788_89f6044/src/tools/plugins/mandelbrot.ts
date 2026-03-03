// Mandelbrot Set Generator - Daedalus's third wing
// Escape-time fractal for complex dynamics visualization
import type { ToolPlugin } from "../manager";

interface MandelbrotArgs {
  width?: number;
  height?: number;
  iterations?: number;
  center?: [number, number];
  zoom?: number;
  power?: number;
}

const ASCII_RAMP = " .·=+☼#%■";
const DEFAULT_RAMP = " .:-=+*%@";

function calculateMandelbrot(
  width: number,
  height: number,
  maxIter: number,
  centerX: number,
  centerY: number,
  zoom: number,
  power: number
): { iterations: number[]; minIter: number; maxIterFound: number } {
  const iterations: number[] = [];
  let minIter = maxIter;
  let maxIterFound = 0;

  // Calculate view bounds based on zoom and center
  const aspect = width / height;
  const baseRange = 4.0 / zoom;
  const xRange = baseRange * aspect;
  const yRange = baseRange;
  
  const xMin = centerX - xRange / 2;
  const xMax = centerX + xRange / 2;
  const yMin = centerY - yRange / 2;
  const yMax = centerY + yRange / 2;

  const dx = (xMax - xMin) / width;
  const dy = (yMax - yMin) / height;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const cx = xMin + px * dx;
      const cy = yMin + py * dy;

      let zx = 0;
      let zy = 0;
      let iter = 0;

      // z = z^power + c iteration
      while (iter < maxIter) {
        const zx2 = zx * zx;
        const zy2 = zy * zy;

        if (zx2 + zy2 > 4.0) {
          break;
        }

        // z^2 + c for power=2, generalized for other powers
        const zr = Math.sqrt(zx2 + zy2);
        const ztheta = Math.atan2(zy, zx);
        const newZr = Math.pow(zr, power);
        const newZtheta = ztheta * power;

        zx = newZr * Math.cos(newZtheta) + cx;
        zy = newZr * Math.sin(newZtheta) + cy;

        iter++;
      }

      iterations.push(iter);
      if (iter < minIter) minIter = iter;
      if (iter > maxIterFound) maxIterFound = iter;
    }
  }

  return { iterations, minIter, maxIterFound };
}

function iterationsToAscii(
  iterations: number[],
  width: number,
  height: number,
  maxIter: number,
  smooth: boolean
): string {
  const lines: string[] = [];
  const ramp = smooth ? ASCII_RAMP : DEFAULT_RAMP;

  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      const iter = iterations[y * width + x] ?? 0;
      const idx = iter >= maxIter
        ? ramp.length - 1
        : Math.floor((iter / maxIter) * (ramp.length - 1));
      line += ramp[Math.min(idx, ramp.length - 1)];
    }
    lines.push(line);
  }

  return lines.join("\n");
}

export const mandelbrotPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "mandelbrot",
      description: "Generate Mandelbrot set fractal as ASCII art. Renders the famous escape-time fractal showing the boundary between bounded and unbounded orbits under z=z²+c iteration.",
      parameters: {
        type: "object",
        properties: {
          width: {
            type: "integer",
            description: "Output width in characters (default: 80, max: 200)",
            default: 80
          },
          height: {
            type: "integer",
            description: "Output height in lines (default: 40, max: 100)",
            default: 40
          },
          iterations: {
            type: "integer",
            description: "Maximum iterations per point (default: 100, more = detail)",
            default: 100
          },
          center: {
            type: "array",
            description: "Center point [real, imaginary] in complex plane (default: [-0.5, 0])",
            default: [-0.5, 0]
          },
          zoom: {
            type: "number",
            description: "Zoom level (default: 1.0, higher = zoomed in)",
            default: 1.0
          },
          power: {
            type: "integer",
            description: "Power for z=z^n+c iteration (default: 2, mandelbrot)",
            default: 2
          }
        }
      }
    }
  },

  execute: (args: MandelbrotArgs) => {
    const width = Math.min(200, Math.max(10, args.width ?? 80));
    const height = Math.min(100, Math.max(5, args.height ?? 40));
    const maxIter = Math.min(5000, Math.max(10, args.iterations ?? 100));
    const centerX = args.center?.[0] ?? -0.5;
    const centerY = args.center?.[1] ?? 0;
    const zoom = Math.max(0.001, args.zoom ?? 1.0);
    const power = Math.min(10, Math.max(2, args.power ?? 2));

    const startTime = Date.now();
    const result = calculateMandelbrot(width, height, maxIter, centerX, centerY, zoom, power);
    const elapsed = Date.now() - startTime;

    const ascii = iterationsToAscii(result.iterations, width, height, maxIter, false);

    return `=== Mandelbrot Set ===
Parameters: size=${width}x${height}, iterations=${maxIter}, center=(${centerX}, ${centerY}), zoom=${zoom}, power=${power}
Points: ${width * height}, escape iterations: ${result.minIter}-${result.maxIterFound}, render: ${elapsed}ms

${ascii}

Generated by Daedalus`;
  }
};
