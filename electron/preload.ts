import { contextBridge, ipcRenderer } from "electron";

export interface CheBoardApi {
  pickRepo(): Promise<string | null>;
  runTool(name: "status" | "doctor" | "help", repoPath: string): Promise<{ stdout: string; stderr: string; code: number }>;
  readConfig(): Promise<Record<string, string>>;
  writeConfig(values: Record<string, string>): Promise<void>;
  configPath(): Promise<string>;
  chiVersion(): Promise<string>;
}

const api: CheBoardApi = {
  pickRepo: () => ipcRenderer.invoke("chi:pickRepo"),
  runTool: (name, repoPath) => ipcRenderer.invoke("chi:runTool", name, repoPath),
  readConfig: () => ipcRenderer.invoke("chi:readConfig"),
  writeConfig: (values) => ipcRenderer.invoke("chi:writeConfig", values),
  configPath: () => ipcRenderer.invoke("chi:configPath"),
  chiVersion: () => ipcRenderer.invoke("chi:version"),
};

contextBridge.exposeInMainWorld("cheBoard", api);
