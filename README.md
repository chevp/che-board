# che-board

Desktop console for the [`chi`](https://github.com/chevp/chi) CLI — an Electron + Angular GUI modeled on chi's own `context/prototypes/ux-console`.

<img src="screenshots/home.png" alt="che-board home" width="50%" />

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

`chi` is declared as a `github:chevp/chi` dependency. chi commits its compiled `dist/` to git, so `npm install` pulls a ready-to-import package — no separate build step against the sibling repo is needed.

> Note: `chi` doesn't (yet) export a JS API — its commands write directly to `process.stdout`. The bridge patches `process.stdout.write` for the duration of each call and restores it afterwards. This shim goes away once `chi` exposes structured command outputs.

## Stack

- **Electron** 33 (main process in TypeScript, CommonJS output)
- **Angular** 19 (standalone components, hash-routed)
- **TypeScript** strict mode
- **SCSS** with chi's `ux-console` design tokens (tan accent, `#d2a878`)
- No state-management library; signals only.

## Running locally

```sh
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

## License

[Apache-2.0](LICENSE)