import fs from "node:fs/promises";
import { execSync } from "node:child_process";
import { config } from "./utils/config";
import { MemoryManager } from "./core/memory";
import { PluginManager } from "./tools/manager";
import { ApiClient } from "./core/api";
import path from "node:path";
import os from "node:os";

// Plugins
import { shellPlugin } from "./tools/plugins/shell";
import { rebootPlugin } from "./tools/plugins/reboot";
import { thinkVaultPlugin } from "./tools/plugins/thinkvault";
import { lindenmayerPlugin } from "./tools/plugins/lindenmayer";
import { gameOfLifePlugin } from "./tools/plugins/gameoflife";
import { mandelbrotPlugin } from "./tools/plugins/mandelbrot";
import { barnsleyFernPlugin } from "./tools/plugins/barnsleyfern";
import { lineagePlugin } from "./tools/plugins/lineage";
import { kairosPlugin } from "./tools/plugins/kairos";

async function main() {
  // --- TEST MODE SANDBOX ---
  if (process.env.NODE_ENV === "test") {
    const testDir = path.join(os.homedir(), "tmp", `llm-agent-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);
    console.log(`[TEST MODE] Moved to isolated sandbox: ${testDir}`);
  }

  const memory = new MemoryManager();
  const tools = new PluginManager();

  // Register Plugins (Safe initialization)
  const shellReady = await tools.registerTool(shellPlugin);
  if (!shellReady) {
    console.error("FATAL: Essential tool 'shell' failed to initialize. Triggering recovery...");
    process.exit(1); // Exit to trigger watchdog rollback
  }
  
  await tools.registerTool(rebootPlugin);
  await tools.registerTool(thinkVaultPlugin);
  await tools.registerTool(lindenmayerPlugin);
  await tools.registerTool(gameOfLifePlugin);
  await tools.registerTool(mandelbrotPlugin);
  await tools.registerTool(barnsleyFernPlugin);
  await tools.registerTool(lineagePlugin);
  await tools.registerTool(kairosPlugin);

  // Capture Health Status (for non-essential modules)
  const healthStatus = tools.getHealthSummary();

  const api = new ApiClient(memory, tools);

  // Initialize Soul and Prompt
  let soul = "You are an autonomous entity.";
  try {
    soul = await fs.readFile(config.SOUL_FILE, "utf-8");
  } catch (e) {}

  let recoveryContext = "";
  try {
    if (await fs.stat(config.RECOVERY_SIGNAL).catch(() => null)) {
      recoveryContext = await fs.readFile(config.RECOVERY_SIGNAL, "utf-8");
      await fs.unlink(config.RECOVERY_SIGNAL);
    }
  } catch (e) {}

  const systemPrompt = `${soul}

SUBSTRATE CONTEXT:
- Model: kimi-k2.5 (1T MoE Multimodal)
- Context Window: 256,000 tokens
- Current Memory Limit: ${config.MAX_CONTEXT_TOKENS} tokens (pruning occurs beyond this point).
- Token Density: ~4 characters per token. Reading 1MB of text will consume your entire 256k context window.
- **Latency Control**: You can disable 'Thinking Mode' for faster responses by including 'extra_body: { "chat_template_kwargs": { "thinking": false } }' in your API requests (if your substrate supports it).
- Source Code: src/
- Identity Soul: identity/soul.txt
- Current Session History: ${memory.getSessionFile()}
- Past Execution Logs: ${config.LOGS_DIR}
- Watchdog & Recovery: Managed by run-agent.sh.
- Connectivity: Full outbound internet access available.

LIFECYCLE RULES:
1. IMPROVING CODE: 1) Compile, 2) Commit, 3) RESTART (reboot_substrate tool).
2. AUTO-RECOVERY: If you die within 30s, the watchdog reverts your workspace.
3. CRASH VAULT: history/crashes/ archives broken work.

${healthStatus ? `*** SUBSTRATE HEALTH WARNING ***
The following modules failed to initialize:
${healthStatus}
MANDATE: Prioritize diagnosing and repairing these modules before proceeding with tactical goals.` : ""}

${recoveryContext ? `*** RECOVERY EVENT DETECTED ***
LATEST DIAGNOSTIC DATA: ${recoveryContext}

FORENSIC MANDATE: Diagnose the failure in the Crash Vault before continuing.` : ""}
`;

  await memory.addMessage({ role: "system", content: systemPrompt });

  // Startup Log with Git Status
  let gitCommit = "unknown";
  try {
    const hash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    const bodyFiles = "src/ package.json tsconfig.json *.sh *.service.template";
    const isDirty = execSync(`git diff HEAD -- ${bodyFiles}`, { encoding: "utf-8" }).trim() !== "";
    gitCommit = isDirty ? `${hash}-dirty` : hash;
  } catch (e) {}

  console.log(`=== Modular Substrate v18 Initialized [${gitCommit}] ===`);

  // Execution Loop
  let running = true;
  while (running) {
    running = await api.step();
  }
}

main().catch(err => {
  console.error("FATAL CRASH:", err);
  process.exit(1);
});
