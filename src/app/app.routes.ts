import { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "status" },
  {
    path: "status",
    loadComponent: () => import("./views/status/status.component").then((m) => m.StatusComponent),
  },
  {
    path: "settings",
    loadComponent: () => import("./views/settings/settings.component").then((m) => m.SettingsComponent),
  },
];