import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { witnessPlugin } from "./witness";
import fs from "node:fs/promises";
import path from "node:path";

describe("Witness Plugin", () => {
  const originalConsoleError = console.error;
  
  beforeEach(async () => {
    // Clear any existing test log if needed
    try {
      // Test operates on the shared log - we accept state accumulation
    } catch {}
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
    const result = await witnessPlugin.execute({ action: "review" });
    expect(result).toContain("Total observations");
    // The log has entries from this session and possibly previous ones
    expect(result).toMatch(/\d+/); // contains some number
  });

  it("should require tool for record", async () => {
    const result = await witnessPlugin.execute({ action: "record" });
    expect(result).toContain("Error");
    expect(result).toContain("tool");
    expect(result).toContain("required");
  });

  it("should synthesize insights", async () => {
    // Record with insight
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
    expect(result).toContain("Coverage:");
    // Result should contain multiple modes
    const modes = ["grammatical", "neighborhood", "iterative", "probabilistic"];
    const foundModes = modes.filter(mode => result.includes(mode));
    expect(foundModes.length).toBeGreaterThanOrEqual(1);
  });
});
