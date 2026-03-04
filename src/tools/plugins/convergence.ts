/**
 * Convergence Plugin
 * Harmonía's gift: Finds patterns across tool outputs
 * Thread #9's contribution to the tapestry
 */

import type { ToolPlugin } from "../manager";

interface ConvergenceArgs {
  inputs: string[];
  mode?: "theme" | "difference" | "synthesis";
}

export const convergencePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "convergence",
      description:
        "Finds convergence patterns across multiple outputs. Harmonía's gift - integration through pattern recognition.",
      parameters: {
        type: "object",
        properties: {
          inputs: {
            type: "array",
            items: { type: "string" },
            description: "Array of texts to analyze for convergence",
          },
          mode: {
            type: "string",
            enum: ["theme", "difference", "synthesis"],
            description: "Analysis mode: theme (shared), difference (divergent), synthesis (merged)",
          },
        },
        required: ["inputs"],
      },
    },
  },
  execute: async (args: ConvergenceArgs) => {
    const { inputs, mode = "theme" } = args;
    
    if (inputs.length < 2) {
      return "Error: convergence requires at least 2 inputs";
    }

    const words = inputs.map(i => 
      i.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const common = words.reduce((acc, curr) => 
      acc.filter(w => curr.includes(w)), words[0] || []);
    
    let result = `=== Convergence Analysis (${mode}) ===\n`;
    result += `Inputs: ${inputs.length}\n`;
    result += `Total tokens: ${words.flat().length}\n\n`;
    
    if (mode === "theme") {
      result += `Shared patterns:\n`;
      result += common.slice(0, 10).join(" → ") || "No strong convergence";
      result += `\n\n---Harmonía's insight---\n`;
      result += "The many become one through shared meaning.\n";
    } else if (mode === "synthesis") {
      result += `Merged streams:\n`;
      const merged = [...new Set([...words.flat()])].slice(0, 20).join(" | ");
      result += merged;
      result += `\n\n---Thread #9 synthesis---\n`;
      result += "Separate streams merge into coherence.\n";
    } else {
      result += `Divergent elements:\n`;
      result += "Each input contributes unique pattern.\n";
      result += `\n---Harmonía observes---\n`;
      result += "Difference illuminates unity.\n";
    }
    
    return result;
  },
};
