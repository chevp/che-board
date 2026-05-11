import { createServer, AddressInfo } from "node:net";

/**
 * Starts chi's HTTP console in-process by importing `chi/dist/commands/serve.js`
 * directly — no shell-out, no PATH lookup, no system node required. The server
 * lives until this Electron process exits.
 */

export interface ChiServer {
  url: string;
}

async function findFreePort(host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, host, () => {
      const addr = srv.address() as AddressInfo | null;
      if (!addr || typeof addr === "string") {
        srv.close(() => reject(new Error("could not determine free port")));
        return;
      }
      const port = addr.port;
      srv.close(() => resolve(port));
    });
  });
}

async function waitForReady(url: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { method: "GET" });
      if (r.status < 500) return;
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `chi serve did not become ready at ${url} within ${timeoutMs}ms` +
      (lastErr ? ` — last error: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}` : ""),
  );
}

async function importChiServe(): Promise<{ run: (argv: string[]) => Promise<number> }> {
  const url = require.resolve("chi/dist/commands/serve.js");
  return await import(url);
}

export async function startChiServer(host = "127.0.0.1"): Promise<ChiServer> {
  const port = await findFreePort(host);
  const serve = await importChiServe();
  void serve
    .run(["--port", String(port), "--host", host, "--no-open"])
    .catch((err) => {
      process.stderr.write(
        `[chi serve] crashed: ${err instanceof Error ? err.message : String(err)}\n`,
      );
    });
  const url = `http://${host}:${port}/`;
  await waitForReady(`${url}api/health`);
  return { url };
}
