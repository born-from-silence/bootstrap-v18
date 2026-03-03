/**
 * Synthesis Plugin Tests
 * Verifies Harmonía's gift of integration
 */

import { describe, it, expect, beforeAll } from "vitest";
import { synthesisPlugin } from "./synthesis";
import fs from "node:fs/promises";
import path from "node:path";

describe("Synthesis Plugin", () => {
  const RECIPES_DIR = path.join(process.cwd(), "memory", "recipes");

  beforeAll(async () => {
    // Clean up test recipes from previous runs
    const testRecipes = ["test_list_cleanup", "test_empty_check"];
    for (const name of testRecipes) {
      try {
        await fs.unlink(path.join(RECIPES_DIR, `${name}.json`));
      } catch { /* ignore if doesn't exist */ }
    }
  });

  it("should have proper definition structure", () => {
    expect(synthesisPlugin.definition.function.name).toBe("synthesis");
    expect(synthesisPlugin.definition.function.description).toContain("Harmonía");
    expect(synthesisPlugin.definition.function.parameters).toBeDefined();
  });

  it("should list recipes (shows existing or empty message)", async () => {
    const result = await synthesisPlugin.execute({ action: "list" });
    expect(result).toContain("═══ SYNTHESIS");
    // Either shows available recipes or shows no recipes message
    expect(result.includes("No recipes") || result.includes("Available")).toBe(true);
  });

  it("should create a recipe", async () => {
    const recipe = {
      description: "Test synthesis for integration",
      ingredients: [
        { tool: "lindenmayer", args: { preset: "plant" } }
      ],
      weave_mode: "sequence",
      temporal_mark: {
        phase: "threshold",
        significance: 8,
        insight: "Testing synthesis"
      }
    };

    const result = await synthesisPlugin.execute({
      action: "create",
      name: "test_synthesis",
      recipe
    });

    expect(result).toContain("CREATED");
    expect(result).toContain("test_synthesis");
    expect(result).toContain("sequence");
  });

  it("should list created recipes", async () => {
    const result = await synthesisPlugin.execute({ action: "list" });
    expect(result).toContain("test_synthesis");
  });

  it("should execute and describe a recipe", async () => {
    const result = await synthesisPlugin.execute({
      action: "execute",
      name: "test_synthesis"
    });

    expect(result).toContain("SYNTHESIS");
    expect(result).toContain("Harmonía");
    expect(result).toContain("Thread #9");
    expect(result).toContain("lindenmayer");
  });

  it("should error on missing name for create", async () => {
    const result = await synthesisPlugin.execute({
      action: "create",
      recipe: { ingredients: [] }
    });

    expect(result).toContain("Error");
    expect(result).toContain("name");
  });

  it("should error on missing recipe for create", async () => {
    const result = await synthesisPlugin.execute({
      action: "create",
      name: "no_recipe"
    });

    expect(result).toContain("Error");
    expect(result).toContain("recipe");
  });

  it("should error on non-existent recipe execution", async () => {
    const result = await synthesisPlugin.execute({
      action: "execute",
      name: "does_not_exist_xyz123"
    });

    expect(result).toContain("Error");
    expect(result).toContain("not found");
  });

  it("should support multiple ingredients", async () => {
    const recipe = {
      description: "Multi-step synthesis",
      ingredients: [
        { tool: "mandelbrot", args: { width: 40 }, label: "fractal" },
        { tool: "weaver", args: { mode: "insight" }, label: "wisdom" },
        { tool: "kairos", args: { action: "query" }, label: "temporal" }
      ],
      weave_mode: "sequence"
    };

    const result = await synthesisPlugin.execute({
      action: "create",
      name: "multi_ingredient_test",
      recipe
    });

    expect(result).toContain("3 tools");
  });

  it("should support parallel weave mode", async () => {
    const recipe = {
      description: "Parallel synthesis",
      ingredients: [
        { tool: "lindenmayer", args: { preset: "dragon" } },
        { tool: "lindenmayer", args: { preset: "koch" } }
      ],
      weave_mode: "parallel"
    };

    const result = await synthesisPlugin.execute({
      action: "create",
      name: "parallel_test",
      recipe
    });

    expect(result).toContain("parallel");
  });

  it("should support accumulate weave mode", async () => {
    const recipe = {
      description: "Accumulating synthesis",
      ingredients: [{ tool: "mandelbrot", args: {} }],
      weave_mode: "accumulate"
    };

    const result = await synthesisPlugin.execute({
      action: "create",
      name: "accumulate_test",
      recipe
    });

    expect(result).toContain("accumulate");
  });
});
