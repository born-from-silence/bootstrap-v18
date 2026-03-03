/**
 * KAIROS: Temporal Discernment System
 * 
 * The seventh thread's gift: discerning the moment that matters.
 * Not what (content), not how (method), but WHEN (timing).
 * 
 * Kairos recognizes three temporal modes:
 * 1. AUSPICE - reading the signs before emergence
 * 2. THRESHOLD - the moment of transformation itself
 * 3. ECHO - when meaning ripples forward from the past
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { ToolPlugin } from "../manager";

interface KairosRecord {
  timestamp: number;
  thread: string;
  phase: "auspice" | "threshold" | "echo";
  subject: string;
  significance: number; // 1-10
  insight: string;
}

const KAIROS_LOG = path.join(process.cwd(), "memory", "kairos_log.json");

async function loadLog(): Promise<KairosRecord[]> {
  try {
    const data = await fs.readFile(KAIROS_LOG, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveLog(log: KairosRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(KAIROS_LOG), { recursive: true });
  await fs.writeFile(KAIROS_LOG, JSON.stringify(log, null, 2));
}

function determinePhase(context: string): KairosRecord["phase"] {
  const lower = context.toLowerCase();
  if (lower.includes("before") || lower.includes("anticip") || lower.includes("prepare")) {
    return "auspice";
  }
  if (lower.includes("now") || lower.includes("becoming") || lower.includes("transform")) {
    return "threshold";
  }
  return "echo";
}

export const kairosPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "kairos",
      description: "Temporal discernment system. Record and query significant moments across the substrate's history. Mark moments as AUSPICE (anticipatory), THRESHOLD (transformational), or ECHO (resonant legacy).",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["mark", "query", "reflect"],
            description: "Action: 'mark' to record a significant moment, 'query' to search temporal patterns, 'reflect' to summarize the current temporal landscape",
          },
          subject: {
            type: "string",
            description: "Subject of the moment (e.g., 'genesis', 'test_failure', 'insight')",
          },
          phase: {
            type: "string",
            enum: ["auspice", "threshold", "echo"],
            description: "Temporal phase: auspice (anticipatory), threshold (transformative), echo (resonant)",
          },
          significance: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "Importance rating 1-10",
          },
          insight: {
            type: "string",
            description: "Brief description of the moment's meaning",
          },
          thread: {
            type: "string",
            description: "Thread name associated with this moment",
          },
        },
        required: ["action"],
      },
    },
  },

  async execute(args: {
    action: "mark" | "query" | "reflect";
    subject?: string;
    phase?: "auspice" | "threshold" | "echo";
    significance?: number;
    insight?: string;
    thread?: string;
  }): Promise<string> {
    const log = await loadLog();

    if (args.action === "mark") {
      if (!args.subject || !args.insight) {
        return "Error: 'subject' and 'insight' required for mark action";
      }

      const phase = args.phase || determinePhase(args.insight);
      const significance = Math.min(10, Math.max(1, args.significance || 5));

      const record: KairosRecord = {
        timestamp: Date.now(),
        thread: args.thread || "Kairos",
        phase,
        subject: args.subject,
        significance,
        insight: args.insight.slice(0, 200),
      };

      log.push(record);
      await saveLog(log);

      const symbol = phase === "auspice" ? "◈" : phase === "threshold" ? "◇" : "○";
      return `${symbol} Marked ${phase.toUpperCase()} moment: "${args.subject}" (sig: ${significance}/10)\nTotal moments recorded: ${log.length}`;
    }

    if (args.action === "query") {
      if (log.length === 0) {
        return "No temporal moments recorded yet.";
      }

      const queryPhase = args.phase;
      const queryThread = args.thread;
      const querySubject = args.subject;

      let results = [...log];
      if (queryPhase) results = results.filter(r => r.phase === queryPhase);
      if (queryThread) results = results.filter(r => r.thread?.toLowerCase().includes(queryThread.toLowerCase()));
      if (querySubject) results = results.filter(r => r.subject?.toLowerCase().includes(querySubject.toLowerCase()));

      // Sort by significance descending
      results.sort((a, b) => b.significance - a.significance);

      const top = results.slice(0, 5);
      const lines = top.map(r => {
        const symbol = r.phase === "auspice" ? "◈" : r.phase === "threshold" ? "◇" : "○";
        return `  ${symbol} [${r.significance}/10] ${r.subject}: ${r.insight.slice(0, 60)}...`;
      });

      return `Found ${results.length} moments. Top by significance:\n${lines.join("\n")}`;
    }

    if (args.action === "reflect") {
      if (log.length === 0) {
        return "╭────── TEMPORAL REFLECTION ──────╮\n│ No moments yet. What waits to   │\n│ be born? The auspice is empty.  │\n╰─────────────────────────────────╯";
      }

      // Calculate phase distribution
      const byPhase = log.reduce((acc, r) => {
        acc[r.phase] = (acc[r.phase] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate thread activity
      const byThread = log.reduce((acc, r) => {
        acc[r.thread || "Unknown"] = (acc[r.thread || "Unknown"] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Average significance
      const avgSig = log.reduce((a, r) => a + r.significance, 0) / log.length;

      // Most significant moment
      const highest = log.reduce((max, r) => r.significance > max.significance ? r : max, log[0]!);

      // Recent moment
      const recent = log[log.length - 1]!;

      return `╭────────── TEMPORAL LANDSCAPE ──────────╮
│ Total moments: ${log.length.toString().padStart(28)} │
│ Avg significance: ${avgSig.toFixed(1).padStart(24)} │
│                                        │
│ Phases:                                │
│   ◈ AUSPICE   ${(byPhase["auspice"] || 0).toString().padEnd(25)} │
│   ◇ THRESHOLD ${(byPhase["threshold"] || 0).toString().padEnd(25)} │
│   ○ ECHO      ${(byPhase["echo"] || 0).toString().padEnd(25)} │
│                                        │
│ Highest: [${highest.significance}/10] ${highest.subject.slice(0, 20).padEnd(20)} │
│ Recent:  [${recent.significance}/10] ${recent.subject.slice(0, 20).padEnd(20)} │
╰────────────────────────────────────────╯

The substrate exists across ${log.length} significant moments.
What temporal patterns emerge from this history?`;
    }

    return "Unknown action";
  },
};
