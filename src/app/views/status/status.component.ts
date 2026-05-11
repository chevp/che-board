import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ChiIpcService } from "../../shared/chi-ipc.service";

@Component({
  selector: "cb-status",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./status.component.html",
  styleUrl: "./status.component.scss",
})
export class StatusComponent {
  private readonly ipc = inject(ChiIpcService);

  readonly repoPath = signal<string | null>(null);
  readonly stdout = signal("");
  readonly stderr = signal("");
  readonly code = signal<number | null>(null);
  readonly running = signal(false);
  readonly lastRunMs = signal<number | null>(null);

  async pickRepo(): Promise<void> {
    const picked = await this.ipc.pickRepo();
    if (picked) {
      this.repoPath.set(picked);
      await this.runStatus();
    }
  }

  async runStatus(): Promise<void> {
    const repo = this.repoPath();
    if (!repo) return;
    this.running.set(true);
    this.stdout.set("");
    this.stderr.set("");
    this.code.set(null);
    const t0 = performance.now();
    try {
      const result = await this.ipc.runStatus(repo);
      this.stdout.set(result.stdout);
      this.stderr.set(result.stderr);
      this.code.set(result.code);
    } catch (err) {
      this.stderr.set(err instanceof Error ? err.message : String(err));
      this.code.set(-1);
    } finally {
      this.lastRunMs.set(Math.round(performance.now() - t0));
      this.running.set(false);
    }
  }
}