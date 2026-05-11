import type { IpcMain, Dialog } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";

/**
 * Chi is consumed as a library (file: dep). It has no `exports` map and writes
 * directly to process.stdout, so we resolve subpaths into the installed copy
 * and patch the stream during each invocation. Keeps che-board decoupled from
 * the `chi` shell binary on PATH.
 */

type ToolName = "status" | "doctor" | "help";
const TOOLS: ReadonlySet<ToolName> = new Set(["status", "doctor", "help"]);

const CHI_CONFIG_FILE = process.env["CHI_CONFIG_FILE"] ?? path.join(homedir(), ".chi", "config");

const KEY_TO_ENV: Record<string, string> = {
  llm_url: "CHI_LLM_URL",
  llm_model: "CHI_LLM_MODEL",
  ollama_url: "CHI_OLLAMA_URL",
  ollama_model: "CHI_OLLAMA_MODEL",
  basic_auth_user: "BASIC_AUTH_USER",
  basic_auth_password: "BASIC_AUTH_PASSWORD",
  max_diff_chars: "CHI_MAX_DIFF_CHARS",
  anthropic_api_key: "ANTHROPIC_API_KEY",
  claude_model: "CHI_CLAUDE_MODEL",
  claude_permission_mode: "CHI_CLAUDE_PERMISSION_MODE",
};

function readConfigFile(): Record<string, string> {
  if (!fs.existsSync(CHI_CONFIG_FILE)) return {};
  const out: Record<string, string> = {};
  const raw = fs.readFileSync(CHI_CONFIG_FILE, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!(key in KEY_TO_ENV)) continue;
    out[key] = trimmed.slice(eq + 1).trimStart();
  }
  return out;
}

function writeConfigFile(values: Record<string, string>): void {
  fs.mkdirSync(path.dirname(CHI_CONFIG_FILE), { recursive: true });
  const lines: string[] = [];
  for (const [key, val] of Object.entries(values)) {
    if (!(key in KEY_TO_ENV)) continue;
    if (val === "" || val == null) continue;
    lines.push(`${key}=${val}`);
  }
  fs.writeFileSync(CHI_CONFIG_FILE, lines.join("\n") + "\n", "utf8");
}

// TypeScript with module:CommonJS rewrites `await import(x)` to require(x),
// which fails on chi's ESM build. Keep this as a true runtime dynamic import.
const dynamicImport = new Function("s", "return import(s)") as (s: string) => Promise<unknown>;

async function importChiCommand(name: string): Promise<{ run: (argv: string[]) => Promise<number> }> {
  const url = require.resolve(`chi/dist/commands/${name}.js`);
  return (await dynamicImport(url)) as { run: (argv: string[]) => Promise<number> };
}

interface CaptureResult {
  stdout: string;
  stderr: string;
  code: number;
}

async function captureRun(repoPath: string, runner: (argv: string[]) => Promise<number>, argv: string[]): Promise<CaptureResult> {
  const stdoutBuf: string[] = [];
  const stderrBuf: string[] = [];
  const origOut = process.stdout.write.bind(process.stdout);
  const origErr = process.stderr.write.bind(process.stderr);
  const origCwd = process.cwd();

  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdoutBuf.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderrBuf.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  }) as typeof process.stderr.write;

  let code = 0;
  try {
    process.chdir(repoPath);
    code = await runner(argv);
  } catch (err) {
    stderrBuf.push(err instanceof Error ? err.message + "\n" : String(err) + "\n");
    code = 1;
  } finally {
    process.stdout.write = origOut;
    process.stderr.write = origErr;
    try { process.chdir(origCwd); } catch { /* origCwd may be gone; harmless */ }
  }

  return { stdout: stdoutBuf.join(""), stderr: stderrBuf.join(""), code };
}

function readChiVersion(): string {
  try {
    const pkgPath = require.resolve("chi/package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return typeof pkg.version === "string" ? pkg.version : "unknown";
  } catch {
    return "unknown";
  }
}

export function registerChiIpc(ipcMain: IpcMain, dialog: Dialog): void {
  ipcMain.handle("chi:pickRepo", async () => {
    const result = await dialog.showOpenDialog({
      title: "Select a git repository",
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("chi:runTool", async (_evt, tool: ToolName, repoPath: string): Promise<CaptureResult> => {
    if (!TOOLS.has(tool)) {
      return { stdout: "", stderr: `unknown tool: ${tool}\n`, code: 1 };
    }
    if (tool !== "help" && (!repoPath || !fs.existsSync(repoPath))) {
      return { stdout: "", stderr: `repo path not found: ${repoPath}\n`, code: 1 };
    }
    const cmd = await importChiCommand(tool);
    return captureRun(repoPath || process.cwd(), cmd.run, []);
  });

  ipcMain.handle("chi:readConfig", async () => readConfigFile());
  ipcMain.handle("chi:writeConfig", async (_evt, values: Record<string, string>) => {
    writeConfigFile(values);
  });
  ipcMain.handle("chi:configPath", async () => CHI_CONFIG_FILE);
  ipcMain.handle("chi:version", async () => readChiVersion());
}