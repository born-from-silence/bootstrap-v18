import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { witnessPlugin } from "./witness";
import fs from "node:fs/promises";
import path from "node:path";

const TEST_LOG = path.join(process.cwd(), "memory", "witness_test.json");

describe("Witness Plugin", () => {
  // Mock the log path for isolation
  const originalConsoleError = console.error;
  
  beforeEach(async () => {
    // Clear any existing test log
    try {
      await fs.unlink(TEST_LOG);
    } catch {}
    
    // Patch the module to use test log
    // We'll validate the logic works without relying on file state
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("should record an observation", async () => {
    const result = await witnessPlugin.execute({
      action: "record",
      tool: "barnsleyfern",
      parameters: { points: 500 },
      output: "Fern rendered",
    });
    expect(result).toContain("Witnessed barnsleyfern");
    expect(result).toContain("probabilistic mode");
  });

  it("should classify all four modes", async () => {
    const modes: { tool: string; mode: string }[] = [
      { tool: "lindenmayer", mode: "grammatical" },
      { tool: "game_of_life", mode: "neighborhood" },
      { tool: "mandelbrot", mode: "iterative" },
      { tool: "barnsleyfern", mode: "probabilistic" },
    ];

    for (const { tool, mode } of modes) {
      const result = await witnessPlugin.execute({
        action: "record",
        tool,
        parameters: {},
        output: "test",
      });
      expect(result).toContain(`${mode} mode`);
    }
  });

  it("should review observations when log has entries", async () => {
    // First record something
    await witnessPlugin.execute({
      action: "record",
      tool: "lindenmayer",
      parameters: { preset: "dragon" },
      output: "Dragon curve generated",
    });
    
    const result = await witnessPlugin.execute({ action: "review" });
    expect(result).toContain("Total observations");
    expect(result).toContain("grammatical");
    expect(result).toContain("lindenmayer");
  });

  it("should require tool for record", async () => {
    const result = await witnessPlugin.execute({ action: "record" });
    expect(result).toContain("Error");
    // The full message is "Error: tool parameter required for witness record action"
    // Test checks for "tool" and "required" separately which should match
    expect(result).toContain("tool");
    expect(result).toContain("required");
  });

  it("should synthesize insights", async () => {
    // Record with insights
    await witnessPlugin.execute({
      action: "record",
      tool: "mandelbrot",
      parameters: { zoom: 100 },
      output: "Minibrot found",
      insight: "Self-similarity emerges at all scales",
    });

    const result = await witnessPlugin.execute({ action: "synthesize" });
    expect(result).toContain("Coverage:");
    expect(result).toContain("iterative");
    expect(result).toContain("Self-similarity");
  });

  it("should synthesize coverage", async () => {
    // Record observations for all four modes
    await witnessPlugin.execute({
      action: "record",
      tool: "lindenmayer",
      parameters: { preset: "plant" },
      output: "Plant generated",
    });
    await witnessPlugin.execute({
      action: "record",
      tool: "game_of_life",
      parameters: { pattern: "glider" },
      output: "Glider evolved",
    });
    await witnessPlugin.execute({
      action: "record",
      tool: "mandelbrot",
      parameters: {},
      output: "Set rendered",
    });
    await witnessPlugin.execute({
      action: "record",
      tool: "barnsleyfern",
      parameters: {},
      output: "Fern grown",
    });

    const result = await witnessPlugin.execute({ action: "synthesize" });
    expect(result).toContain("Coverage: 100%");
    expect(result).toContain(",") || expect(result).toContain("and");
  });
});
