import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SHORT_URLS_PATH = path.join(process.cwd(), "data", "short-urls.json");

function getRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = (forwardedHost ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim();
  const proto = forwardedProto?.split(",")[0].trim();

  if (!host) {
    return new URL(request.url).origin;
  }

  const fallbackProto =
    host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";

  return `${proto ?? fallbackProto}://${host}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const origin = getRequestOrigin(request);

  try {
    const raw = await fs.readFile(SHORT_URLS_PATH, "utf-8");
    const map: Record<string, string> = JSON.parse(raw);
    const fullId = map[code];

    if (fullId) {
      return NextResponse.redirect(new URL(`/site/${fullId}`, origin));
    }
  } catch { /* file not found or invalid JSON */ }

  return NextResponse.redirect(new URL("/", origin));
}
