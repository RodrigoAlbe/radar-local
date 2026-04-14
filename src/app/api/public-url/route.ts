import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const URL_FILE = path.join(process.cwd(), "data", "tunnel-url.txt");
const INFO_FILE = path.join(process.cwd(), "data", "tunnel-info.json");

interface TunnelInfo {
  url?: string;
  cloudflaredPid?: number;
  startedAt?: string;
}

function isProcessRunning(pid: number | undefined): boolean {
  if (!pid || !Number.isInteger(pid) || pid <= 0) return false;

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const rawInfo = await fs.readFile(INFO_FILE, "utf-8");
    const info = JSON.parse(rawInfo) as TunnelInfo;

    if (
      info.url &&
      info.url.startsWith("https://") &&
      isProcessRunning(info.cloudflaredPid)
    ) {
      return NextResponse.json({ url: info.url });
    }
  } catch {
    // Fallback below for older installs that only have the plain URL file.
  }

  try {
    const url = (await fs.readFile(URL_FILE, "utf-8")).trim();
    if (url && url.startsWith("https://")) {
      return NextResponse.json({ url: null, stale: true });
    }
  } catch {
    // File doesn't exist yet.
  }

  return NextResponse.json({ url: null });
}
