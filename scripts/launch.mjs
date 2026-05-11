#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const electronExe = require("electron");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const proc = spawn(electronExe, ["."], { stdio: "inherit", env });
proc.on("exit", (code) => process.exit(code ?? 0));
