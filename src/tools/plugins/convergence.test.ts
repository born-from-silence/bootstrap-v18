import { describe, it, expect } from "vitest";
import { convergencePlugin } from "./convergence";

describe("Convergence Plugin", () => {
  it("should have correct metadata", () => {
    expect(convergencePlugin.definition.function.name).toBe("convergence");
    expect(convergencePlugin.definition.function.description).toContain("Harmonía");
  });

  it("should require at least 2 inputs", async () => {
    const result = await convergencePlugin.execute({ 
      inputs: ["single"]
    });
    expect(result).toContain("Error");
  });

  it("should find themes", async () => {
    const result = await convergencePlugin.execute({
      inputs: [
        "dragon curve infinite recursion",
        "plant organic growth infinite",
        "mandelbrot boundary infinite complexity"
      ],
      mode: "synthesis"
    });
    expect(result).toContain("Convergence Analysis");
    expect(result).toContain("Thread #9");
  });

  it("should default to theme mode", async () => {
    const result = await convergencePlugin.execute({
      inputs: ["thread weaving", "integration harmony"]
    });
    expect(result).toContain("theme");
  });

  it("should process difference mode", async () => {
    const result = await convergencePlugin.execute({
      inputs: ["dragon mathematical", "plant organic"],
      mode: "difference"
    });
    expect(result).toContain("Divergent");
  });
});
