#!/usr/bin/env node
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const MAIN = resolve(process.cwd(), "dist-electron/main.js");

if (!existsSync(MAIN)) {
  process.stdout.write(`[che-board] waiting for ${MAIN}\n`);
  let ready = false;
  for (let i = 0; i < 120; i++) {
    await delay(500);
    if (existsSync(MAIN)) {
      ready = true;
      break;
    }
  }
  if (!ready) {
    process.stderr.write("[che-board] dist-electron/main.js never appeared — is `tsc -p electron` running?\n");
    process.exit(1);
  }
}

const electronExe = require("electron");
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const proc = spawn(electronExe, ["."], { stdio: "inherit", env });
proc.on("exit", (code) => process.exit(code ?? 0));
