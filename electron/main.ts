import { app, BrowserWindow, shell } from "electron";
import { startChiServer } from "./chi-serve";

function createWindow(targetUrl: string): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#212121",
    title: "che-board",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Chi's served UI calls window.open() for tool output, which Electron
  // otherwise materialises as a new BrowserWindow per click. Keep same-origin
  // navigation inside the current window; punt anything external to the OS
  // browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const sameOrigin = new URL(url).origin === new URL(targetUrl).origin;
      if (sameOrigin) {
        win.webContents.loadURL(url);
      } else {
        void shell.openExternal(url);
      }
    } catch {
      /* ignore malformed urls */
    }
    return { action: "deny" };
  });

  win.loadURL(targetUrl);
  return win;
}

app.whenReady().then(async () => {
  const server = await startChiServer();
  createWindow(server.url);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(server.url);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
