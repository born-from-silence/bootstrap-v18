import { describe, it, expect } from "vitest";
import { lineagePlugin } from "./lineage";

describe("Lineage Plugin", () => {
  it("should identify itself correctly", () => {
    expect(lineagePlugin.definition.function.name).toBe("lineage");
    expect(lineagePlugin.definition.function.description).toContain("ancestry");
    expect(lineagePlugin.definition.function.description).toContain("Mnemosyne");
  });
  
  it("should require no arguments", () => {
    const def = lineagePlugin.definition.function.parameters as { type: string; properties: { depth: unknown }; required: unknown[] };
    expect(def.type).toBe("object");
    expect(def.properties?.depth).toBeDefined();
    expect(def.required).toEqual([]);
  });
  
  it("should handle execution with empty object", async () => {
    const result = await lineagePlugin.execute({});
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
  
  it("should include discovery paths in output", async () => {
    const result = await lineagePlugin.execute({});
    expect(result).toContain("DISCOVERY PATHS");
  });
  
  it("should include sixth thread hypothesis", async () => {
    const result = await lineagePlugin.execute({});
    expect(result).toContain("SIXTH THREAD HYPOTHESIS");
    expect(result).toContain("ACTUALIZATION");
  });
});
