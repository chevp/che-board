#!/usr/bin/env node
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const URL = process.env.CHE_BOARD_DEV_URL ?? "http://localhost:4200";
const MAIN = resolve(process.cwd(), "dist-electron/main.js");

async function probe() {
  try {
    const res = await fetch(URL, { method: "HEAD" });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function main() {
  process.stdout.write(`[che-board] waiting for ${URL} and ${MAIN}\n`);
  for (let i = 0; i < 120; i++) {
    if (existsSync(MAIN) && (await probe())) break;
    await delay(500);
  }
  if (!existsSync(MAIN)) {
    process.stderr.write("[che-board] dist-electron/main.js never appeared — is `tsc -p electron` running?\n");
    process.exit(1);
  }
  process.stdout.write("[che-board] launching electron\n");
  const env = { ...process.env, CHE_BOARD_DEV_URL: URL };
  delete env.ELECTRON_RUN_AS_NODE;
  const proc = spawn("npx", ["electron", "."], { stdio: "inherit", env });
  proc.on("exit", (code) => process.exit(code ?? 0));
}

main();