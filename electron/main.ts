import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "node:path";
import { registerChiIpc } from "./chi-bridge";
import { startChiServer } from "./chi-serve";

const DEV_OVERRIDE_URL = process.env["CHE_BOARD_DEV_URL"];

function createWindow(targetUrl: string): BrowserWindow {
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

  win.loadURL(targetUrl);
  if (DEV_OVERRIDE_URL) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  return win;
}

app.whenReady().then(async () => {
  registerChiIpc(ipcMain, dialog);

  let targetUrl: string;
  if (DEV_OVERRIDE_URL) {
    targetUrl = DEV_OVERRIDE_URL;
  } else {
    const server = await startChiServer();
    targetUrl = server.url;
  }

  createWindow(targetUrl);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(targetUrl);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
