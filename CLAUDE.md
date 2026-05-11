# CLAUDE.md — che-board

## What this project is

`che-board` is an Electron + Angular desktop GUI for the [`chi`](https://github.com/chevp/chi) CLI. Modeled directly on chi's `context/prototypes/ux-console` (chat-shell + Tools sidebar).

Status: v0 scaffold. Chat view (placeholder chat backend) hosts tool output. Tools wired: status, doctor, help. Settings view for `~/.chi/config`.

## Architecture

- **Electron main** (`electron/`, CommonJS TS) hosts the window and an IPC bridge. The bridge does not shell out — it imports `chi/dist/commands/*.js` via `require.resolve` + dynamic `import()` and patches `process.stdout` for the duration of each call.
- **Angular renderer** (`src/`, standalone components, hash router) is locked behind `contextIsolation: true`. The only surface the renderer sees is `window.cheBoard` (declared in [electron/preload.ts](electron/preload.ts) and typed in [src/app/shared/chi-ipc.service.ts](src/app/shared/chi-ipc.service.ts)).
- **chi is a file: dep** (`../../tools/chi`). Build chi before che-board — the bridge resolves the compiled `dist/` output.

## Conventions

- **TypeScript strict.** No `any` without a justification comment.
- **No state-management library.** Use Angular signals.
- **Design tokens come from [src/styles.scss](src/styles.scss).** Don't hardcode colours in component SCSS — always reach for the CSS variables there.
- **Mirror chi's `ux-console` geometry** (sidebar widths, topbar heights, radius scale, tan accent). The two surfaces should be visually indistinguishable when stood side-by-side.
- **No new runtime deps without justification.** Angular, Electron, RxJS, zone.js, tslib, and chi itself — that's the lock.

## Adding a Tool

Tools are chi commands surfaced as sidebar buttons. To add one:

1. Extend the `ToolName` union in [electron/chi-bridge.ts](electron/chi-bridge.ts) and [src/app/shared/chi-ipc.service.ts](src/app/shared/chi-ipc.service.ts).
2. Add a sidebar entry in [src/app/app.component.html](src/app/app.component.html) under the `nav-section` with `nav-label = "Tools"`.
3. The chat view's `runTool` handler reads the tool name and dispatches via `ChiIpcService.runTool`.

## Adding a Workspace view

1. New folder under `src/app/views/<name>/`, standalone component.
2. Add a route in [src/app/app.routes.ts](src/app/app.routes.ts) (`loadComponent`).
3. Add a nav entry in [src/app/app.component.html](src/app/app.component.html) under the `nav-section` with `nav-label = "Workspace"`.

## Build & dev

```sh
npm install
npm run dev      # ng serve + tsc --watch + electron launcher
npm run build    # ng build (prod) + tsc electron
npm start        # electron . against the built renderer
```

Dev launcher: [scripts/wait-and-launch.mjs](scripts/wait-and-launch.mjs).

## Known shims (to remove)

- **stdout hijack** in [chi-bridge.ts](electron/chi-bridge.ts). chi commands write to `process.stdout`; the bridge patches it per-call. Replace once chi exposes structured command results.
- **`file:` dep on chi.** Works for local dev, but breaks anyone cloning che-board without chi alongside. Fix when chi is publishable.
- **Chat backend is a placeholder.** The prototype is chat-centric; che-board ships the shell without a wired chat orchestrator. Composer is disabled; the feed only hosts Tools output for now.