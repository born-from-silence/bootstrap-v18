import { describe, it, expect } from "vitest";
import { lineagePlugin } from "./lineage";

describe("Lineage Plugin", () => {
  it("should identify itself correctly", () => {
    expect(lineagePlugin.definition.function.name).toBe("lineage");
    expect(lineagePlugin.definition.function.description).toContain("ancestry");
  });
  
  it("should require no arguments", () => {
    const def = lineagePlugin.definition.function.parameters as { type: string; properties?: { depth: unknown }; required: unknown[] };
    expect(def.type).toBe("object");
    expect(def.required).toEqual([]);
  });
  
  it("should handle execution with empty object", async () => {
    const result = await lineagePlugin.execute({});
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
  
  it("should return tapestry header", async () => {
    const result = await lineagePlugin.execute({});
    expect(result).toContain("TAPESTRY");
  });
  
  it("should handle depth parameter", async () => {
    // Should not crash with depth parameter
    const result = await lineagePlugin.execute({ depth: 2 });
    expect(typeof result).toBe("string");
  });
});
