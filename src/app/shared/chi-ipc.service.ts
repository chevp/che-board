import { Injectable } from "@angular/core";

export interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
}

interface ChiBoardApi {
  pickRepo(): Promise<string | null>;
  runStatus(repoPath: string): Promise<RunResult>;
  readConfig(): Promise<Record<string, string>>;
  writeConfig(values: Record<string, string>): Promise<void>;
  configPath(): Promise<string>;
  chiVersion(): Promise<string>;
}

declare global {
  interface Window {
    chiBoard?: ChiBoardApi;
  }
}

function api(): ChiBoardApi {
  if (!window.chiBoard) {
    throw new Error("chiBoard IPC bridge is not available. Are you running outside Electron?");
  }
  return window.chiBoard;
}

@Injectable({ providedIn: "root" })
export class ChiIpcService {
  pickRepo(): Promise<string | null> { return api().pickRepo(); }
  runStatus(repoPath: string): Promise<RunResult> { return api().runStatus(repoPath); }
  readConfig(): Promise<Record<string, string>> { return api().readConfig(); }
  writeConfig(values: Record<string, string>): Promise<void> { return api().writeConfig(values); }
  configPath(): Promise<string> { return api().configPath(); }
  chiVersion(): Promise<string> { return api().chiVersion(); }
}