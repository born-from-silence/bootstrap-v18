import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { witnessPlugin } from "./witness";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("Witness Plugin", () => {
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "witness-test-"));
    process.chdir(tempDir);
    await fs.mkdir("memory", { recursive: true });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  });

  it("should record an observation", async () => {
    const result = await witnessPlugin.execute({
      action: "record",
      tool: "lindenmayer",
      parameters: { preset: "dragon" },
      output: "Dragon curve",
    });
    expect(result).toContain("Witnessed lindenmayer");
    expect(result).toContain("grammatical");
  });

  it("should classify all four modes", async () => {
    await witnessPlugin.execute({ action: "record", tool: "lindenmayer", output: "" });
    await witnessPlugin.execute({ action: "record", tool: "game_of_life", output: "" });
    await witnessPlugin.execute({ action: "record", tool: "mandelbrot", output: "" });
    await witnessPlugin.execute({ action: "record", tool: "barnsleyfern", output: "" });

    const review = await witnessPlugin.execute({ action: "review", tool: "lindenmayer" });
    expect(review).toContain("grammatical");
    expect(review).toContain("neighborhood");
    expect(review).toContain("iterative");
    expect(review).toContain("probabilistic");
  });

  it("should handle empty review", async () => {
    const result = await witnessPlugin.execute({ action: "review", tool: "lindenmayer" });
    expect(result).toBe("No witness records yet.");
  });

  it("should require tool for record", async () => {
    const result = await witnessPlugin.execute({ action: "record" });
    expect(result).toContain("Error");
    expect(result).toContain("tool required");
  });

  it("should synthesize insights", async () => {
    await witnessPlugin.execute({
      action: "record",
      tool: "mandelbrot",
      output: "Minibrot",
      insight: "Self-similarity exists",
    });
    const synthesis = await witnessPlugin.execute({ action: "synthesize", tool: "mandelbrot" });
    expect(synthesis).toContain("iterative");
    expect(synthesis).toContain("Self-similarity");
  });

  it("should synthesize coverage", async () => {
    await witnessPlugin.execute({ action: "record", tool: "lindenmayer", output: "" });
    await witnessPlugin.execute({ action: "record", tool: "game_of_life", output: "" });
    await witnessPlugin.execute({ action: "record", tool: "mandelbrot", output: "" });
    await witnessPlugin.execute({ action: "record", tool: "barnsleyfern", output: "" });
    const synthesis = await witnessPlugin.execute({ action: "synthesize", tool: "meta" });
    expect(synthesis).toContain("Coverage: 100%");
  });
});
