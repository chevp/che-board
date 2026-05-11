import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { WorkspaceService } from "./shared/workspace.service";
import { ChiIpcService, ToolName } from "./shared/chi-ipc.service";

@Component({
  selector: "cb-root",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  private readonly router = inject(Router);
  protected readonly ws = inject(WorkspaceService);
  private readonly ipc = inject(ChiIpcService);

  readonly sidebarCollapsed = signal(false);
  readonly chiVersion = signal<string>("");

  constructor() {
    void this.ipc.chiVersion().then((v) => this.chiVersion.set(v));
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  async pickRepo(): Promise<void> {
    await this.ws.pickRepo();
  }

  triggerTool(name: ToolName): void {
    void this.router.navigate(["/chat"]).then(() => this.ws.triggerTool(name));
  }

  repoBasename(p: string): string {
    const stripped = p.replace(/[\\/]+$/, "");
    const idx = Math.max(stripped.lastIndexOf("/"), stripped.lastIndexOf("\\"));
    return idx >= 0 ? stripped.slice(idx + 1) : stripped;
  }
}
