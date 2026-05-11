import { Injectable } from "@angular/core";

export interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
}

export type ToolName = "status" | "doctor" | "help";

interface CheBoardApi {
  pickRepo(): Promise<string | null>;
  runTool(name: ToolName, repoPath: string): Promise<RunResult>;
  readConfig(): Promise<Record<string, string>>;
  writeConfig(values: Record<string, string>): Promise<void>;
  configPath(): Promise<string>;
  chiVersion(): Promise<string>;
}

declare global {
  interface Window {
    cheBoard?: CheBoardApi;
  }
}

function api(): CheBoardApi {
  if (!window.cheBoard) {
    throw new Error("cheBoard IPC bridge is not available. Are you running outside Electron?");
  }
  return window.cheBoard;
}

@Injectable({ providedIn: "root" })
export class ChiIpcService {
  pickRepo(): Promise<string | null> { return api().pickRepo(); }
  runTool(name: ToolName, repoPath: string): Promise<RunResult> { return api().runTool(name, repoPath); }
  readConfig(): Promise<Record<string, string>> { return api().readConfig(); }
  writeConfig(values: Record<string, string>): Promise<void> { return api().writeConfig(values); }
  configPath(): Promise<string> { return api().configPath(); }
  chiVersion(): Promise<string> { return api().chiVersion(); }
}