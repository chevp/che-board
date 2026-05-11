import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { WorkspaceService } from "../../shared/workspace.service";
import { ChiIpcService, ToolName } from "../../shared/chi-ipc.service";

interface ToolMessage {
  id: number;
  kind: "tool";
  tool: ToolName;
  state: "running" | "done" | "error";
  stdout: string;
  stderr: string;
  code: number | null;
  elapsedMs: number | null;
}

interface SystemMessage {
  id: number;
  kind: "system" | "error";
  text: string;
}

type FeedMessage = ToolMessage | SystemMessage;

@Component({
  selector: "cb-chat",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./chat.component.html",
  styleUrl: "./chat.component.scss",
})
export class ChatComponent {
  protected readonly ws = inject(WorkspaceService);
  private readonly ipc = inject(ChiIpcService);
  private readonly destroyRef = inject(DestroyRef);

  readonly messages = signal<FeedMessage[]>([]);
  readonly inputText = signal("");
  private nextId = 1;

  constructor() {
    this.ws.toolRuns$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tool) => void this.runTool(tool));
  }

  isTool(m: FeedMessage): m is ToolMessage { return m.kind === "tool"; }
  trackById = (_: number, m: FeedMessage): number => m.id;

  async runTool(tool: ToolName): Promise<void> {
    let repo = this.ws.repoPath();
    if (!repo && tool !== "help") {
      repo = await this.ws.pickRepo();
      if (!repo) {
        this.appendSystem(`No repository selected — ${tool} skipped.`);
        return;
      }
    }
    const msg: ToolMessage = {
      id: this.nextId++,
      kind: "tool",
      tool,
      state: "running",
      stdout: "",
      stderr: "",
      code: null,
      elapsedMs: null,
    };
    this.messages.update((m) => [...m, msg]);
    const t0 = performance.now();
    try {
      const result = await this.ipc.runTool(tool, repo ?? "");
      this.patchMessage(msg.id, {
        state: result.code === 0 ? "done" : "error",
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code,
        elapsedMs: Math.round(performance.now() - t0),
      });
    } catch (err) {
      this.patchMessage(msg.id, {
        state: "error",
        stderr: err instanceof Error ? err.message : String(err),
        code: -1,
        elapsedMs: Math.round(performance.now() - t0),
      });
    }
  }

  private patchMessage(id: number, patch: Partial<ToolMessage>): void {
    this.messages.update((arr) =>
      arr.map((m) => (m.id === id && m.kind === "tool" ? { ...m, ...patch } : m)),
    );
  }

  private appendSystem(text: string): void {
    this.messages.update((m) => [...m, { id: this.nextId++, kind: "system", text }]);
  }

  clear(): void {
    this.messages.set([]);
  }
}
