import { app, BrowserWindow, shell, Menu } from "electron";
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

function installAppMenu(): void {
  // Keep DevTools reachable in packaged builds — without it, chi UI errors
  // are invisible. F12 / Cmd+Alt+I toggles, Cmd+Alt+R reloads.
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin"
      ? ([{ role: "appMenu" }] as Electron.MenuItemConstructorOptions[])
      : []),
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "reload", accelerator: process.platform === "darwin" ? "Cmd+Alt+R" : "Ctrl+Alt+R" },
        { role: "toggleDevTools", accelerator: process.platform === "darwin" ? "Cmd+Alt+I" : "F12" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  installAppMenu();
  const server = await startChiServer();
  createWindow(server.url);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(server.url);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
