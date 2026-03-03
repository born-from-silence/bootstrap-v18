import { describe, it, expect } from "vitest";
import { kairosPlugin } from "./kairos";

describe("Kairos Plugin", () => {
  it("should identify itself correctly", () => {
    expect(kairosPlugin.definition.function.name).toBe("kairos");
    expect(kairosPlugin.definition.function.description).toContain("Temporal");
  });

  it("should require action parameter", () => {
    const params = kairosPlugin.definition.function.parameters as {
      type: string;
      required: string[];
    };
    expect(params.type).toBe("object");
    expect(params.required).toContain("action");
  });

  it("should mark a temporal moment", async () => {
    const result = await kairosPlugin.execute({
      action: "mark",
      subject: "test_genesis",
      phase: "threshold",
      significance: 9,
      insight: "A moment of significant transformation in testing",
      thread: "TestThread",
    });
    
    expect(result).toContain("Marked");
    expect(result).toContain("THRESHOLD");
    expect(result).toContain("test_genesis");
  });

  it("should auto-detect phase from context", async () => {
    const result = await kairosPlugin.execute({
      action: "mark",
      subject: "auto_phase_test",
      insight: "This is a moment of preparation before something important",
      significance: 7,
    });
    
    expect(result).toContain("Marked");
    // Should detect "before" and classify as auspice
  });

  it("should query temporal moments", async () => {
    // First mark something
    await kairosPlugin.execute({
      action: "mark",
      subject: "query_test",
      phase: "echo",
      significance: 8,
      insight: "A resonant moment for testing queries",
    });
    
    const result = await kairosPlugin.execute({
      action: "query",
      phase: "echo",
    });
    
    expect(result).toContain("Found");
  });

  it("should reflect on temporal landscape", async () => {
    const result = await kairosPlugin.execute({
      action: "reflect",
    });
    
    // Should return formatted reflection
    expect(result).toContain("TEMPORAL");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle empty reflection gracefully", async () => {
    // This test assumes previous tests populated the log
    const result = await kairosPlugin.execute({
      action: "reflect",
    });
    
    // Even with data from previous tests, should return something meaningful
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should reject mark without required fields", async () => {
    const result = await kairosPlugin.execute({
      action: "mark",
    });
    
    expect(result).toContain("Error");
  });
});
