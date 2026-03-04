import { describe, it, expect } from "vitest";
import { convergencePlugin } from "./convergence";

describe("Convergence Plugin", () => {
  it("should have correct metadata", () => {
    expect(convergencePlugin.name).toBe("convergence");
    expect(convergencePlugin.description).toContain("Harmonía");
    expect(convergencePlugin.description).toContain("convergence");
  });

  it("should require at least 2 inputs", async () => {
    const result = await convergencePlugin.execute({ 
      inputs: ["single"], 
      mode: "theme" 
    });
    expect(result).toContain("Error");
  });

  it("should find themes (synthesis mode)", async () => {
    const result = await convergencePlugin.execute({
      inputs: [
        "dragon curve infinite recursion",
        "plant organic growth infinite",
        "mandelbrot boundary infinite complexity"
      ],
      mode: "synthesis"
    });
    expect(result).toContain("Convergence Analysis");
    expect(result).toContain("synthesis");
    expect(result).toContain("Thread #9");
  });

  it("should default to theme mode", async () => {
    const result = await convergencePlugin.execute({
      inputs: ["thread weaving", "integration harmony"]
    });
    expect(result).toContain("Convergence Analysis (theme)");
    expect(result).toContain("Harmonía");
  });

  it("should process difference mode", async () => {
    const result = await convergencePlugin.execute({
      inputs: ["dragon mathematical", "plant organic"],
      mode: "difference"
    });
    expect(result).toContain("Divergent");
    expect(result).toContain("Harmonía");
  });
});
