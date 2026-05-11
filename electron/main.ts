import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "node:path";
import { registerChiIpc } from "./chi-bridge";

const DEV_SERVER_URL = process.env["CHE_BOARD_DEV_URL"];
const isDev = !!DEV_SERVER_URL;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#212121",
    title: "che-board",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL(DEV_SERVER_URL!);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "renderer", "browser", "index.html"));
  }

  return win;
}

app.whenReady().then(() => {
  registerChiIpc(ipcMain, dialog);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});