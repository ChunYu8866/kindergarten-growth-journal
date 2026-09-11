import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");
const managedLinux = readExecutionProfile() === "managed-linux";

if (managedLinux && command === "build") {
  const result = spawnSync("bash", [
    fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args,
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

// Import in this process so the preview owner retains its PID and signals.
const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);

// Vinext can finish a static export on Windows and then hit a libuv handle-close
// assertion while its temporary prerender server shuts down. Run builds in a child
// so the preview owner stays healthy, and accept only that exact post-build crash
// when this run produced a fresh static entry file.
if (!managedLinux && command === "build" && process.platform === "win32") {
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, [fileURLToPath(cli), command, ...args], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status === 0) process.exit(0);

  const staticEntry = resolve(process.cwd(), "dist", "client", "index.html");
  const freshStaticOutput =
    existsSync(staticEntry) && statSync(staticEntry).mtimeMs >= startedAt - 2_000;
  const libuvClosingAssertion = result.status === 3221226505 || result.status === -1073740791;
  if (libuvClosingAssertion && freshStaticOutput) {
    console.warn("[build] Static export completed; ignored Windows libuv shutdown assertion.");
    process.exit(0);
  }
  process.exit(result.status ?? 1);
}

process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" ? ["--port", "5173"] : []), ...args];
await import(cli.href);
