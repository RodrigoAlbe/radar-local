/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const URL_FILE = path.join(__dirname, "..", "data", "tunnel-url.txt");
const INFO_FILE = path.join(__dirname, "..", "data", "tunnel-info.json");

fs.mkdirSync(path.dirname(URL_FILE), { recursive: true });
try { fs.unlinkSync(URL_FILE); } catch {}
try { fs.unlinkSync(INFO_FILE); } catch {}

const cloudflaredPath = findCloudflared();

function findCloudflared() {
  const { execSync } = require("child_process");
  try {
    const result = execSync("where cloudflared", { encoding: "utf-8" }).trim().split(/\r?\n/)[0];
    if (result) return result;
  } catch {}

  const wingetPath = path.join(
    process.env.LOCALAPPDATA || "",
    "Microsoft",
    "WinGet",
    "Packages",
  );

  try {
    const dirs = fs.readdirSync(wingetPath).filter((dir) => dir.startsWith("Cloudflare.cloudflared"));
    for (const dir of dirs) {
      const exe = path.join(wingetPath, dir, "cloudflared.exe");
      if (fs.existsSync(exe)) return exe;
    }
  } catch {}

  return "cloudflared";
}

console.log(`  Using: ${cloudflaredPath}\n`);

const proc = spawn(cloudflaredPath, ["tunnel", "--url", "http://localhost:3000"], {
  stdio: ["ignore", "pipe", "pipe"],
});

let found = false;

function scan(data) {
  const text = data.toString();
  process.stderr.write(data);

  if (found) return;

  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (match) {
    found = true;
    fs.writeFileSync(URL_FILE, match[0], "utf-8");
    fs.writeFileSync(
      INFO_FILE,
      JSON.stringify(
        {
          url: match[0],
          cloudflaredPid: proc.pid,
          startedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf-8",
    );
    console.log(`\n  URL publica salva: ${match[0]}`);
    console.log(`    Arquivo: ${URL_FILE}\n`);
  }
}

proc.stdout.on("data", scan);
proc.stderr.on("data", scan);

proc.on("close", (code) => {
  try { fs.unlinkSync(URL_FILE); } catch {}
  try { fs.unlinkSync(INFO_FILE); } catch {}
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  proc.kill();
  try { fs.unlinkSync(URL_FILE); } catch {}
  try { fs.unlinkSync(INFO_FILE); } catch {}
  process.exit(0);
});
