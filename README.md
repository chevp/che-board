# chi-board

Desktop console for the [`chi`](https://github.com/chevp/chi) CLI — an Electron + Angular GUI inspired by MongoDB Compass.

> Status: **v0 scaffold.** Two views (Status, Settings) wired against a live `chi` library import. UI design system adapted from cura-console (UXIP-003) with a chi-board blue-violet accent.

## What it is

`chi-board` is a desktop app that gives the `chi` CLI a graphical surface:

- **Status** — pick a repo, run `chi status`, see the streamed output in a terminal panel.
- **Settings** — read/write `~/.chi/config` (Anthropic, LLM gateway, Ollama, misc) without dropping into a shell.

More views (Commit, Console, Issues) are planned. See [Roadmap](#roadmap).

## How it links to chi

`chi` is consumed as a library, not by shelling out to the binary:

```
chi-board/electron/chi-bridge.ts
  └─ require.resolve("chi/dist/commands/status.js")
     └─ dynamic import + stdout capture
```

The `chi` package is declared as a `file:` dependency on the sibling repo (`../../tools/chi`). That keeps `chi-board` decoupled from whatever `chi` is on the user's `PATH`, and the two repos can evolve together via the local link.

> Note: `chi` does not (yet) expose a JS API — its commands write directly to `process.stdout`. The bridge patches `process.stdout.write` for the duration of each invocation and restores it afterwards. This is a known shim and will go away once `chi` exposes structured command outputs.

## Stack

- **Electron** 33 (main process in TypeScript, CommonJS output)
- **Angular** 19 (standalone components, hash-routed)
- **TypeScript** strict mode
- **SCSS** with cura-console design tokens
- No state-management library; signals only.

## Running locally

```sh
# 1. Make sure chi is built (chi-board imports compiled chi/dist/*)
cd ../../tools/chi && npm install && npm run build

# 2. chi-board
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
chi-board/
├── electron/                 # Electron main process (CJS)
│   ├── main.ts               # window creation, dev-server URL
│   ├── preload.ts            # contextBridge — exposes window.chiBoard
│   └── chi-bridge.ts         # chi library imports + stdout capture
├── src/                      # Angular renderer
│   ├── styles.scss           # design tokens (cura-console palette, rebranded)
│   ├── index.html
│   ├── main.ts               # bootstrapApplication
│   └── app/
│       ├── app.component.*   # sidebar + outlet shell
│       ├── shared/chi-ipc.service.ts
│       └── views/
│           ├── status/
│           └── settings/
├── scripts/wait-and-launch.mjs
└── angular.json | tsconfig.json | package.json
```

## Design system

The palette and component patterns are adapted from `cura/frontend/cura-app/public/uxip-003-cura-console`:

| Token | cura-console | chi-board |
|-------|--------------|-----------|
| canvas | `#212121` | `#1a1b1f` |
| sidebar | `#181818` | `#131418` |
| accent | `#d2a878` (tan) | `#78a0f0` (blue-violet) |

Same dark-elevation system, same sidebar/topbar/composer geometry, different brand colour.

## Roadmap

Tracked informally for now; planned views:

- [ ] **Commit** — staged diff + AI-generated message preview (`chi commit`)
- [ ] **Console** — free-form `chi <cmd>` runner with streaming output
- [ ] **Workflows** — list & run `.che/workflows/*.yml`
- [ ] **Issues** — list / create / triage (`chi issue`)
- [ ] **Doctor** — environment check

## License

[Apache-2.0](LICENSE)