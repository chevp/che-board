import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ChiIpcService } from "../../shared/chi-ipc.service";

interface FieldDef {
  key: string;
  label: string;
  hint?: string;
  secret?: boolean;
  placeholder?: string;
}

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Claude",
    fields: [
      { key: "anthropic_api_key", label: "Anthropic API key", secret: true, placeholder: "sk-ant-…" },
      { key: "claude_model", label: "Claude model", placeholder: "claude-opus-4-7" },
      { key: "claude_permission_mode", label: "Permission mode", placeholder: "default | acceptEdits | plan" },
    ],
  },
  {
    title: "LLM gateway",
    fields: [
      { key: "llm_url", label: "LLM URL", placeholder: "https://…" },
      { key: "llm_model", label: "LLM model" },
      { key: "basic_auth_user", label: "Basic-auth user" },
      { key: "basic_auth_password", label: "Basic-auth password", secret: true },
    ],
  },
  {
    title: "Ollama",
    fields: [
      { key: "ollama_url", label: "Ollama URL", placeholder: "http://localhost:11434" },
      { key: "ollama_model", label: "Ollama model", placeholder: "llama3.1" },
    ],
  },
  {
    title: "Misc",
    fields: [
      { key: "max_diff_chars", label: "Max diff chars", placeholder: "20000" },
    ],
  },
];

@Component({
  selector: "cb-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
})
export class SettingsComponent implements OnInit {
  private readonly ipc = inject(ChiIpcService);

  readonly sections = SECTIONS;
  readonly values = signal<Record<string, string>>({});
  readonly configPath = signal<string>("");
  readonly chiVersion = signal<string>("");
  readonly saving = signal(false);
  readonly savedAt = signal<number | null>(null);
  readonly revealSecrets = signal(false);

  async ngOnInit(): Promise<void> {
    const [vals, cfgPath, version] = await Promise.all([
      this.ipc.readConfig(),
      this.ipc.configPath(),
      this.ipc.chiVersion(),
    ]);
    this.values.set(vals);
    this.configPath.set(cfgPath);
    this.chiVersion.set(version);
  }

  update(key: string, val: string): void {
    this.values.update((v) => ({ ...v, [key]: val }));
  }

  toggleReveal(): void {
    this.revealSecrets.update((v) => !v);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.ipc.writeConfig(this.values());
      this.savedAt.set(Date.now());
    } finally {
      this.saving.set(false);
    }
  }
}