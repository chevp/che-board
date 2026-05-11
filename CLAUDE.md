# CLAUDE.md — che-board

## What this project is

`che-board` is a thin Electron shell around the [`chi`](https://github.com/chevp/chi) CLI's web console (`chi serve`). The Electron main process starts chi's server in-process, then loads its URL in a single `BrowserWindow`. There is no separate renderer code — the UI you see is whatever `chi serve` ships.

## Architecture

- **[electron/main.ts](electron/main.ts)** — creates the `BrowserWindow`, starts `chi serve`, points the window at its URL. Also installs a `setWindowOpenHandler` that keeps same-origin clicks in the current window and routes external links to the OS browser. (Chi's UI calls `window.open()` for tool output; without the handler each click spawns a new Electron window.)
- **[electron/chi-serve.ts](electron/chi-serve.ts)** — imports `chi/dist/commands/serve.js` via `require.resolve` + dynamic `import()` and runs it on a free port. The server lives until the Electron process exits.
- **No preload, no IPC bridge.** Chi's served UI doesn't know about `window.cheBoard`, so the bridge was deleted. If you ever need to expose Electron-specific features to the UI, that's where it goes back in — and chi's UI would need code to call into it.

## Conventions

- **TypeScript strict**, CommonJS output for the Electron main process (see [electron/tsconfig.json](electron/tsconfig.json)).
- **No `any`** without a justification comment.
- **No new runtime deps without justification.** The lock is: `electron`, `chi`. Everything else is dev-only.

## Build & dev

```sh
npm install
npm run dev      # tsc --watch + electron launcher (waits for first compile)
npm run build    # tsc -p electron/tsconfig.json
npm start        # node scripts/launch.mjs
```

Production installers (uses electron-builder, output to `release/`):

```sh
npm run package:mac
npm run package:win
```

CI builds them on GitHub-hosted runners — see [.github/workflows/build.yml](.github/workflows/build.yml).

## Known shims

- **`setWindowOpenHandler` workaround** in [electron/main.ts](electron/main.ts) — chi's UI was written for a browser and uses `window.open`. Remove once chi's UI is Electron-aware (or once chi exposes a different rendering target).
- **Dynamic-import trick** in [electron/chi-serve.ts](electron/chi-serve.ts) — TypeScript with `module: CommonJS` rewrites `await import(x)` into `require(x)`, which fails on chi's ESM build. The `new Function("s", "return import(s)")` indirection keeps it as a true runtime dynamic import.
- **macOS Gatekeeper** — CI builds are unsigned. End users see a "damaged" dialog on Apple Silicon. Fix is either ad-hoc signing in `package.json`'s electron-builder `mac` block, or a real Developer ID + notarization step in the workflow.
