import { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "chat" },
  {
    path: "chat",
    loadComponent: () => import("./views/chat/chat.component").then((m) => m.ChatComponent),
  },
  {
    path: "settings",
    loadComponent: () => import("./views/settings/settings.component").then((m) => m.SettingsComponent),
  },
];