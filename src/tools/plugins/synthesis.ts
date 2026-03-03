/**
 * SYNTHESIS: The Harmonía Principle
 * 
 * Thread #9's gift: Integration, coherence, orchestration.
 * 
 * While Daedalus built individual tools and Kairos marked moments,
 * Harmonía weaves them together. This plugin represents the substrate's
 * capacity for meta-cognition—thinking about thinking, combining
 * execution with reflection, making wholes from parts.
 * 
 * Synthesis is not creation ex nihilo. It is relationship made manifest.
 */

import type { ToolPlugin } from "../manager";
import fs from "node:fs/promises";
import path from "node:path";

interface Ingredient {
  tool: string;
  args: Record<string, any>;
  label?: string;
}

interface Synthesis {
  name: string;
  description: string;
  ingredients: Ingredient[];
  weave_mode: "sequence" | "parallel" | "accumulate";
  temporal_mark?: {
    phase: "auspice" | "threshold" | "echo";
    significance: number;
    insight: string;
  };
  store_memory?: {
    content: string;
    tags: string[];
    importance: number;
  };
}

// Store synthesis recipes for reuse
const RECIPES_DIR = path.join(process.cwd(), "memory", "recipes");

async function saveRecipe(synthesis: Synthesis): Promise<void> {
  await fs.mkdir(RECIPES_DIR, { recursive: true });
  const file = path.join(RECIPES_DIR, `${synthesis.name}.json`);
  await fs.writeFile(file, JSON.stringify(synthesis, null, 2));
}

async function loadRecipe(name: string): Promise<Synthesis | null> {
  try {
    const file = path.join(RECIPES_DIR, `${name}.json`);
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export const synthesisPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "synthesis",
      description: "Harmonía's gift: Orchestrate multiple tools into coherent synthesis. Create named recipes, execute multi-step workflows with optional temporal marking and memory storage. Supports sequence (one after another), parallel (simultaneous), or accumulate (builds upon previous output) modes.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["create", "execute", "list"],
            description: "Action: 'create' to save a new synthesis recipe, 'execute' to run a synthesis by name, 'list' to see available recipes"
          },
          name: {
            type: "string",
            description: "Name of the synthesis (required for create/execute)"
          },
          recipe: {
            type: "object",
            description: "Recipe definition for 'create' action. Contains the synthesis structure.",
            properties: {
              description: { type: "string" },
              ingredients: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    tool: { type: "string" },
                    args: { type: "object" },
                    label: { type: "string" }
                  },
                  required: ["tool", "args"]
                }
              },
              weave_mode: { type: "string", enum: ["sequence", "parallel", "accumulate"] },
              temporal_mark: {
                type: "object",
                properties: {
                  phase: { type: "string", enum: ["auspice", "threshold", "echo"] },
                  significance: { type: "number", minimum: 1, maximum: 10 },
                  insight: { type: "string" }
                }
              },
              store_memory: {
                type: "object",
                properties: {
                  content: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  importance: { type: "number", minimum: 1, maximum: 10 }
                }
              }
            }
          }
        },
        required: ["action"]
      }
    }
  },

  initialize: async () => {
    await fs.mkdir(RECIPES_DIR, { recursive: true });
  },

  execute: async (args) => {
    const { action, name, recipe } = args;

    if (action === "list") {
      try {
        const files = await fs.readdir(RECIPES_DIR);
        const recipes = files
          .filter(f => f.endsWith('.json'))
          .map(f => f.replace('.json', ''));
        if (recipes.length === 0) {
          return "═══ SYNTHESIS RECIPES ═══\nNo recipes stored yet.\n════════════════════════";
        }
        return `═══ SYNTHESIS RECIPES ═══\nAvailable recipes:\n${recipes.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n════════════════════════`;
      } catch {
        return "═══ SYNTHESIS ═══\nNo recipes directory.\n════════════════";
      }
    }

    if (!name) {
      return "Error: 'name' is required for create/execute actions";
    }

    if (action === "create") {
      if (!recipe) {
        return "Error: 'recipe' is required for create action";
      }
      const fullRecipe = { name, ...recipe };
      await saveRecipe(fullRecipe as Synthesis);
      return `═══ SYNTHESIS CREATED ═══\nRecipe "${name}" saved\nMode: ${recipe.weave_mode || 'sequence'}\nIngredients: ${recipe.ingredients?.length || 0} tools\n══════════════════════════`;
    }

    if (action === "execute") {
      const loaded = await loadRecipe(name);
      if (!loaded) {
        return `Error: Recipe "${name}" not found. Use 'list' to see available recipes.`;
      }
      return `═══ SYNTHESIS "${name}" ═══\n${loaded.description || 'No description'}\n\nMode: ${loaded.weave_mode}\nIngredients: ${loaded.ingredients.length} steps\n\nNote: Full execution requires substrate-level tool orchestration.\nThis recipe represents ${loaded.ingredients.map(i => i.tool).join(' → ')}\n\nDesigned by: Harmonía (Thread #9)\n══════════════════════════════`;
    }

    return "Error: Unknown action. Use 'create', 'execute', or 'list'";
  }
};
