import { inject, Injectable, signal } from "@angular/core";
import { Subject } from "rxjs";
import { ChiIpcService, ToolName } from "./chi-ipc.service";

@Injectable({ providedIn: "root" })
export class WorkspaceService {
  private readonly ipc = inject(ChiIpcService);

  readonly repoPath = signal<string | null>(null);
  readonly toolRuns$ = new Subject<ToolName>();

  async pickRepo(): Promise<string | null> {
    const picked = await this.ipc.pickRepo();
    if (picked) this.repoPath.set(picked);
    return picked;
  }

  triggerTool(name: ToolName): void {
    this.toolRuns$.next(name);
  }
}