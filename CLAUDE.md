# CLAUDE.md — chi-board

## What this project is

`chi-board` is an Electron + Angular desktop GUI for the [`chi`](https://github.com/chevp/chi) CLI. Think MongoDB Compass for chi — visual surface over the same primitives.

Status: v0 scaffold. Two views (Status, Settings). UI design system adapted from `cura/frontend/cura-app/public/uxip-003-cura-console`, recoloured with a blue-violet accent.

## Architecture

- **Electron main** (`electron/`, CommonJS TS) hosts the window and an IPC bridge. The bridge does not shell out — it imports `chi/dist/commands/*.js` via `require.resolve` + dynamic `import()` and patches `process.stdout` for the duration of each call.
- **Angular renderer** (`src/`, standalone components, hash router) is locked behind `contextIsolation: true`. The only surface the renderer sees is `window.chiBoard` (declared in [electron/preload.ts](electron/preload.ts) and typed in [src/app/shared/chi-ipc.service.ts](src/app/shared/chi-ipc.service.ts)).
- **chi is a file: dep** (`../../tools/chi`). Build chi before chi-board — the bridge resolves the compiled `dist/` output.

## Conventions

- **TypeScript strict.** No `any` without a justification comment.
- **No state-management library.** Use Angular signals.
- **Design tokens come from [src/styles.scss](src/styles.scss).** Don't hardcode colours in component SCSS — always reach for the CSS variables there.
- **Mirror cura-console's geometry** (sidebar widths, topbar heights, radius scale). Recolour but keep the bones — the two apps should feel like siblings.
- **No new runtime deps without justification.** Angular, Electron, RxJS, zone.js, tslib, and chi itself — that's the lock.

## Adding a view

1. New folder under `src/app/views/<name>/`, standalone component.
2. Add the route in [src/app/app.routes.ts](src/app/app.routes.ts) (`loadComponent`).
3. Add a nav entry in [src/app/app.component.html](src/app/app.component.html) using the same `nav-item ws-item` pattern.
4. If the view calls into chi, extend the API surface in this order:
   - Add a handler in [electron/chi-bridge.ts](electron/chi-bridge.ts)
   - Add a method to `ChiBoardApi` in [electron/preload.ts](electron/preload.ts)
   - Mirror it on [ChiIpcService](src/app/shared/chi-ipc.service.ts)

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
- **`file:` dep on chi.** Works for local dev, but breaks anyone cloning chi-board without chi alongside. Fix when chi is publishable.