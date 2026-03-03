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

async function saveLog(log: WitnessRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(WITNESS_LOG), { recursive: true });
  await fs.writeFile(WITNESS_LOG, JSON.stringify(log, null, 2));
}

function classifyMode(toolName: string): WitnessRecord["mode"] {
  if (toolName.includes("lindenmayer")) return "grammatical";
  if (toolName.includes("game_of_life")) return "neighborhood";
  if (toolName.includes("mandelbrot")) return "iterative";
  if (toolName.includes("barnsleyfern")) return "probabilistic";
  return "meta";
}

export const witnessPlugin = {
  name: "witness",
  description:
    "Meta-observation system. Record tool outputs, review all observations, synthesize patterns across emergence modes.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["record", "review", "synthesize"],
        description: "Action to perform",
      },
      tool: {
        type: "string",
        description: "Tool name to record",
      },
      parameters: {
        type: "object",
        description: "Tool parameters used",
      },
      output: {
        type: "string",
        description: "Tool output summary",
      },
      insight: {
        type: "string",
        description: "Optional insight or observation",
      },
    },
    required: ["action"],
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
      // Build record conditionally to satisfy exactOptionalPropertyTypes
      const record: WitnessRecord = {
        timestamp: Date.now(),
        tool: args.tool,
        parameters: args.parameters || {},
        output: args.output?.slice(0, 500) || "...",
        mode: classifyMode(args.tool),
      };
      if (args.insight !== undefined) {
        record.insight = args.insight;
      }
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
        .filter((r) => r.insight !== undefined)
        .slice(-3)
        .map((r) => `- ${r.insight}`)
        .join("; ");
      return `Coverage: ${coverage}% of emergence modes. Witnessed: ${Array.from(unique).join(", ") || "none"}. Insights: ${insights || "none"}`;
    }

    return "Unknown action";
  },
};
