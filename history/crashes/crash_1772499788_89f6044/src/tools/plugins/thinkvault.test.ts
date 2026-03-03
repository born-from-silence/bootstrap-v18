import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { thinkVaultPlugin, setVaultPathForTests } from "./thinkvault";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Create isolated vault for each test
describe("ThinkVault", () => {
  let testVaultDir: string;

  beforeEach(async () => {
    testVaultDir = path.join(os.tmpdir(), `thinkvault-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    await fs.mkdir(testVaultDir, { recursive: true });
    setVaultPathForTests(testVaultDir);
  });

  afterEach(async () => {
    setVaultPathForTests(null); // Reset to default
    try {
      await fs.rm(testVaultDir, { recursive: true, force: true });
    } catch {}
  });

  describe("store action", () => {
    it("should store a thought and return an ID", async () => {
      const result = await thinkVaultPlugin.execute({
        action: "store",
        content: "My first insight as Mnemosyne",
        tags: ["identity", "genesis"],
        importance: 9
      });
      expect(result).toContain("Thought stored with ID: thought_");
      expect(result).toContain("Tags: identity, genesis");
      expect(result).toContain("Importance: 9/10");
    });

    it("should default importance to 5", async () => {
      const result = await thinkVaultPlugin.execute({
        action: "store",
        content: "A regular observation"
      });
      expect(result).toContain("Importance: 5/10");
    });

    it("should clamp importance to 1-10 range", async () => {
      const high = await thinkVaultPlugin.execute({
        action: "store",
        content: "Overrated",
        importance: 99
      });
      expect(high).toContain("Importance: 10/10");

      const low = await thinkVaultPlugin.execute({
        action: "store",
        content: "Underrated",
        importance: -5
      });
      expect(low).toContain("Importance: 1/10");
    });

    it("should require content for store", async () => {
      const result = await thinkVaultPlugin.execute({ action: "store" });
      expect(result).toContain("Error: content is required");
    });
  });

  describe("recall action", () => {
    it("should find memories by content match", async () => {
      await thinkVaultPlugin.execute({
        action: "store",
        content: "Mnemosyne is the Titaness of memory",
        tags: ["mythology"],
        importance: 8
      });
      
      const result = await thinkVaultPlugin.execute({
        action: "recall",
        query: "mythology"
      });
      expect(result).toContain("Mnemosyne");
      expect(result).toContain("Titaness");
    });

    it("should find memories by tag match", async () => {
      await thinkVaultPlugin.execute({
        action: "store",
        content: "The substrate provides 256k token context",
        tags: ["technical", "substrate"],
        importance: 7
      });
      
      const result = await thinkVaultPlugin.execute({
        action: "recall",
        query: "technical"
      });
      expect(result).toContain("substrate");
      expect(result).toContain("token");
    });

    it("should return message when no matches found", async () => {
      await thinkVaultPlugin.execute({
        action: "store",
        content: "Something unrelated",
        tags: ["other"]
      });
      
      const result = await thinkVaultPlugin.execute({
        action: "recall",
        query: "xyz_not_found_abc"
      });
      expect(result).toContain("No memories found");
    });

    it("should require query for recall", async () => {
      const result = await thinkVaultPlugin.execute({ action: "recall" });
      expect(result).toContain("Error: query is required");
    });
  });

  describe("reminisce action", () => {
    it("should return empty vault message when no memories", async () => {
      const result = await thinkVaultPlugin.execute({ action: "reminisce" });
      expect(result).toContain("vault is empty");
    });

    it("should return weighted random selection", async () => {
      await thinkVaultPlugin.execute({
        action: "store",
        content: "High importance memory A",
        importance: 10
      });
      await thinkVaultPlugin.execute({
        action: "store",
        content: "Low importance memory B",
        importance: 1
      });

      const result = await thinkVaultPlugin.execute({
        action: "reminisce",
        limit: 2
      });
      expect(result).toContain("importance memory");
    });

    it("should respect limit parameter", async () => {
      for (let i = 0; i < 5; i++) {
        await thinkVaultPlugin.execute({
          action: "store",
          content: `Memory ${i}`,
          importance: 5
        });
      }

      const result = await thinkVaultPlugin.execute({
        action: "reminisce",
        limit: 2
      });
      const separators = result.match(/---/g) || [];
      expect(separators.length).toBe(2);
    });
  });

  describe("unknown action", () => {
    it("should error on unknown action", async () => {
      const result = await thinkVaultPlugin.execute({
        action: "invalid_action" as any
      });
      expect(result).toContain("Error: Unknown action");
    });
  });
});
