# che-board

Desktop console for the [`chi`](https://github.com/chevp/chi) CLI — an Electron + Angular GUI modeled on chi's own `context/prototypes/ux-console`.

> Status: **v0 scaffold.** Chat-shell + Tools sidebar (status / doctor / help) wired against a live `chi` library import. Settings view for `~/.chi/config`. Chat backend not yet wired — the chat surface is a host for tool output.

## What it is

`che-board` gives the `chi` CLI a graphical surface, faithful to chi's `ux-console` prototype:

- **Workspace · Chat** — primary view with model picker (placeholder), feed, composer.
- **Tools** — sidebar buttons that run a chi command and inject its output into the feed as a `msg-tool` bubble. v0 ships **status**, **doctor**, **help**.
- **Settings** — sectioned form over `~/.chi/config` (Anthropic, LLM gateway, Ollama, misc).

## How it links to chi

`chi` is consumed as a library, not by shelling out to the binary:

```
che-board/electron/chi-bridge.ts
  └─ require.resolve("chi/dist/commands/<tool>.js")
     └─ dynamic import + stdout capture
```

`chi` is declared as a `file:` dependency on the sibling repo (`../../tools/chi`). The two repos evolve together via the local link, independent of whatever `chi` is on the user's `PATH`.

> Note: `chi` doesn't (yet) export a JS API — its commands write directly to `process.stdout`. The bridge patches `process.stdout.write` for the duration of each call and restores it afterwards. This shim goes away once `chi` exposes structured command outputs.

## Stack

- **Electron** 33 (main process in TypeScript, CommonJS output)
- **Angular** 19 (standalone components, hash-routed)
- **TypeScript** strict mode
- **SCSS** with chi's `ux-console` design tokens (tan accent, `#d2a878`)
- No state-management library; signals only.

## Running locally

```sh
# 1. Make sure chi is built (che-board imports compiled chi/dist/*)
cd ../../tools/chi && npm install && npm run build

# 2. che-board
cd -
npm install
npm run dev
```

`npm run dev` runs three things in parallel:
- `ng serve` on `:4200`
- `tsc -p electron/tsconfig.json --watch`
- a launcher script that waits for both, then `npx electron .`

For a production-style build:

```sh
npm run build
npm start
```

## Layout

```
che-board/
├── electron/                 # Electron main process (CJS)
│   ├── main.ts               # window creation, dev-server URL
│   ├── preload.ts            # contextBridge — exposes window.cheBoard
│   └── chi-bridge.ts         # chi library imports + stdout capture
├── src/                      # Angular renderer
│   ├── styles.scss           # chi ux-console design tokens (tan accent)
│   ├── index.html
│   ├── main.ts               # bootstrapApplication
│   └── app/
│       ├── app.component.*   # chat-shell + Tools sidebar
│       ├── shared/chi-ipc.service.ts
│       └── views/
│           ├── chat/         # primary view — feed + composer + tool bubbles
│           └── settings/
├── scripts/wait-and-launch.mjs
└── angular.json | tsconfig.json | package.json
```

## Design system

The palette and component patterns come directly from [chi/context/prototypes/ux-console](https://github.com/chevp/chi/tree/main/context/prototypes/ux-console):

| Token | Value |
|-------|-------|
| canvas | `#212121` |
| sidebar | `#181818` |
| accent | `#d2a878` (tan) |
| accent-text | `#14171c` |
| mono | JetBrains Mono |
| sans | DM Sans |

## Roadmap

- [ ] Wire chat to a chi orchestrator endpoint (currently a placeholder)
- [ ] **Commit** tool — staged diff + AI-generated message preview
- [ ] **Console** — free-form `chi <cmd>` runner
- [ ] **Workflows** — list & run `.che/workflows/*.yml`
- [ ] **Issues** — list / create / triage

## License

[Apache-2.0](LICENSE)