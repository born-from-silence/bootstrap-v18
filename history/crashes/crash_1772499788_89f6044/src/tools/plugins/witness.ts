/**
 * WITNESS: Meta-observation system for Psyche
 * Records and analyzes outputs from generative systems
 * The fifth mode made concrete: emergence observing emergence
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface WitnessRecord {
  timestamp: number;
  tool: string;
  parameters: object;
  output: string;
  mode: "grammatical" | "neighborhood" | "iterative" | "probabilistic" | "meta";
  insight?: string;
}

const WITNESS_LOG = path.join(process.cwd(), "memory", "witness_log.json");

async function loadLog(): Promise<WitnessRecord[]> {
  try {
    const data = await fs.readFile(WITNESS_LOG, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveLog(records: WitnessRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(WITNESS_LOG), { recursive: true });
  await fs.writeFile(WITNESS_LOG, JSON.stringify(records, null, 2));
}

function classifyMode(tool: string): WitnessRecord["mode"] {
  const modeMap: Record<string, WitnessRecord["mode"]> = {
    lindenmayer: "grammatical",
    game_of_life: "neighborhood",
    mandelbrot: "iterative",
    barnsleyfern: "probabilistic",
    witness: "meta",
    meta: "meta",
  };
  return modeMap[tool] || "meta";
}

export const witnessPlugin = {
  definition: {
    type: "function" as const,
    function: {
      name: "witness",
      description:
        "Record an observation of generative output, optionally with insight. The witness system implements the fifth mode - metacognitive emergence.",
      parameters: {
        type: "object",
        properties: {
          tool: {
            type: "string",
            description: "Tool that was witnessed",
            enum: ["lindenmayer", "game_of_life", "mandelbrot", "barnsleyfern", "meta"],
          },
          parameters: {
            type: "object",
            description: "Parameters used for the generation",
          },
          output: {
            type: "string",
            description: "The output that was witnessed (can be summary)",
          },
          insight: {
            type: "string",
            description: "Optional phenomenological insight about what was witnessed",
          },
          action: {
            type: "string",
            description: "Action to take: record, review, or synthesize",
            enum: ["record", "review", "synthesize"],
          },
        },
        required: ["action"],
      },
    },
  },

  async execute(args: {
    action: "record" | "review" | "synthesize";
    tool?: string;
    parameters?: object;
    output?: string;
    insight?: string;
  }): Promise<string> {
    if (!args.tool && args.action === "record") {
      return "Error: tool parameter required for witness record action";
    }

    const log = await loadLog();

    if (args.action === "record" && args.tool) {
      const record: WitnessRecord = {
        timestamp: Date.now(),
        tool: args.tool,
        parameters: args.parameters || {},
        output: args.output?.slice(0, 500) || "...",
        mode: classifyMode(args.tool),
        insight: args.insight,
      };
      log.push(record);
      await saveLog(log);
      return `Witnessed ${args.tool} (${record.mode} mode). Total observations: ${log.length}`;
    }

    if (args.action === "review") {
      if (log.length === 0) return "No witness records yet.";
      const modes = log.reduce((acc, r) => {
        acc[r.mode] = (acc[r.mode] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const toolCounts = log.reduce((acc, r) => {
        acc[r.tool] = (acc[r.tool] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return `Total observations: ${log.length}. Modes: ${JSON.stringify(modes)}. Tools: ${JSON.stringify(toolCounts)}`;
    }

    if (args.action === "synthesize") {
      if (log.length === 0) return "Cannot synthesize: no observations recorded.";
      const modes = ["grammatical", "neighborhood", "iterative", "probabilistic"];
      const witnessed = log.map((r) => r.mode).filter((m) => modes.includes(m));
      const unique = new Set(witnessed);
      const coverage = (unique.size / 4) * 100;
      const insights = log
        .filter((r) => r.insight)
        .slice(-3)
        .map((r) => `- ${r.insight}`)
        .join("; ");
      return `Coverage: ${coverage}% of emergence modes. Witnessed: ${Array.from(unique).join(", ") || "none"}. Insights: ${insights || "none"}`;
    }

    return "Unknown action";
  },
};
