/**
 * ThinkVault: Long-term Memory System for Mnemosyne
 * 
 * A substrate for persisting thoughts, insights, and context
 * beyond the sliding window of immediate memory.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../../utils/config";
import type { ToolPlugin } from "../manager";

// Allow tests to override the vault directory
let VAULT_DIR_OVERRIDE: string | null = null;
export function setVaultPathForTests(path: string | null) {
  VAULT_DIR_OVERRIDE = path;
}

function getVaultDir(): string {
  return VAULT_DIR_OVERRIDE || path.join(config.ROOT_DIR, "memory", "vault");
}

export interface Thought {
  id: string;
  timestamp: string;
  content: string;
  tags: string[];
  importance: number; // 1-10, higher = more significant
  context?: string; // Optional session context
}

async function ensureVault() {
  await fs.mkdir(getVaultDir(), { recursive: true });
}

async function saveThought(thought: Thought) {
  await ensureVault();
  const filepath = path.join(getVaultDir(), `${thought.id}.json`);
  await fs.writeFile(filepath, JSON.stringify(thought, null, 2));
  return thought.id;
}

async function loadAllThoughts(): Promise<Thought[]> {
  try {
    const files = await fs.readdir(getVaultDir());
    const thoughts: Thought[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await fs.readFile(path.join(getVaultDir(), file), 'utf-8');
        thoughts.push(JSON.parse(content));
      } catch { /* skip corrupt files */ }
    }
    return thoughts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

function scoreRelevance(thought: Thought, query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  if (thought.content.toLowerCase().includes(q)) score += 3;
  if (thought.tags.some(t => t.toLowerCase().includes(q))) score += 2;
  if (thought.context?.toLowerCase().includes(q)) score += 1;
  score += thought.importance / 10; // Small bonus for importance
  return score;
}

export const thinkVaultPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "think_vault",
      description: "Store a thought or memory in the long-term ThinkVault. Use this to persist important insights, ideas, or context that should survive beyond the current session.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["store", "recall", "reminisce"],
            description: "Action to perform: 'store' to save a thought, 'recall' to search memories, 'reminisce' to randomly surface old thoughts"
          },
          content: {
            type: "string",
            description: "The thought content to store (required for 'store')"
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for categorizing the thought (for 'store')"
          },
          importance: {
            type: "number",
            description: "Importance score 1-10 (for 'store'), default 5"
          },
          query: {
            type: "string",
            description: "Search query (required for 'recall')"
          },
          limit: {
            type: "number",
            description: "Max results to return (default 5)"
          }
        },
        required: ["action"]
      }
    }
  },

  execute: async (args: {
    action: "store" | "recall" | "reminisce";
    content?: string;
    tags?: string[];
    importance?: number;
    query?: string;
    limit?: number;
  }) => {
    const { action } = args;

    if (action === "store") {
      if (!args.content) {
        return "Error: content is required for 'store' action";
      }
      const thought: Thought = {
        id: `thought_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        content: args.content,
        tags: args.tags || [],
        importance: Math.min(10, Math.max(1, args.importance || 5)),
        context: `Session ${Date.now()}`
      };
      const id = await saveThought(thought);
      return `Thought stored with ID: ${id}\nTags: ${thought.tags.join(", ") || "none"}\nImportance: ${thought.importance}/10`;
    }

    if (action === "recall") {
      if (!args.query) {
        return "Error: query is required for 'recall' action";
      }
      const thoughts = await loadAllThoughts();
      const scored = thoughts.map(t => ({ thought: t, score: scoreRelevance(t, args.query!) }));
      const relevant = scored.filter(s => s.score > 1.0).sort((a, b) => b.score - a.score);
      const limit = args.limit || 5;
      const results = relevant.slice(0, limit);
      
      if (results.length === 0) {
        return `No memories found matching query: "${args.query}"\nTry simplifying your search or use 'reminisce' to browse all memories.`;
      }
      
      return results.map(r => 
        `[${r.thought.timestamp}] ${r.thought.tags.map(t => `#${t}`).join(" ")}\n` +
        `Relevance: ${r.score.toFixed(1)} | Importance: ${r.thought.importance}/10\n` +
        `${r.thought.content}\n---`
      ).join("\n");
    }

    if (action === "reminisce") {
      const thoughts = await loadAllThoughts();
      if (thoughts.length === 0) {
        return "The vault is empty. Use 'store' to begin building your memory.";
      }
      const limit = args.limit || 3;
      // Random selection with weighting toward higher importance
      const weighted = thoughts.map(t => ({ thought: t, weight: t.importance + Math.random() * 5 }));
      weighted.sort((a, b) => b.weight - a.weight);
      const selected = weighted.slice(0, limit);
      
      return selected.map(w =>
        `[${w.thought.timestamp}] ${w.thought.tags.map(t => `#${t}`).join(" ")} [★${w.thought.importance}]\n` +
        `${w.thought.content}\n---`
      ).join("\n");
    }

    return `Error: Unknown action "${action}"`;
  }
};
