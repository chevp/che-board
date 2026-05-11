import { contextBridge, ipcRenderer } from "electron";

export interface ChiBoardApi {
  pickRepo(): Promise<string | null>;
  runStatus(repoPath: string): Promise<{ stdout: string; stderr: string; code: number }>;
  readConfig(): Promise<Record<string, string>>;
  writeConfig(values: Record<string, string>): Promise<void>;
  configPath(): Promise<string>;
  chiVersion(): Promise<string>;
}

const api: ChiBoardApi = {
  pickRepo: () => ipcRenderer.invoke("chi:pickRepo"),
  runStatus: (repoPath) => ipcRenderer.invoke("chi:runStatus", repoPath),
  readConfig: () => ipcRenderer.invoke("chi:readConfig"),
  writeConfig: (values) => ipcRenderer.invoke("chi:writeConfig", values),
  configPath: () => ipcRenderer.invoke("chi:configPath"),
  chiVersion: () => ipcRenderer.invoke("chi:version"),
};

contextBridge.exposeInMainWorld("chiBoard", api);
