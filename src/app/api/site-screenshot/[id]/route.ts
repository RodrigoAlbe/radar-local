import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright-core";
import { enforceLocalApiAccess, enforceSimpleRateLimit } from "@/lib/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BROWSER_CANDIDATES = [
  process.env.SCREENSHOT_BROWSER_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter((value): value is string => Boolean(value));

async function findBrowserExecutable(): Promise<string | null> {
  for (const candidate of BROWSER_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }

  return null;
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function getInternalCaptureOrigin(request: NextRequest): string {
  const configuredOrigin = process.env.INTERNAL_CAPTURE_ORIGIN?.trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "");
  }

  const forwardedPort = request.headers.get("x-forwarded-port")?.trim();
  const localPort =
    request.nextUrl.port ||
    forwardedPort ||
    process.env.PORT ||
    "3000";

  return `http://localhost:${localPort}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const accessDenied = enforceLocalApiAccess(request);
  if (accessDenied) return accessDenied;

  const rateLimited = enforceSimpleRateLimit(request, {
    key: "site-screenshot-get",
    limit: 12,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  const { id } = await context.params;
  const executablePath = await findBrowserExecutable();

  if (!executablePath) {
    return NextResponse.json(
      { error: "Nenhum navegador compatível encontrado para gerar o print." },
      { status: 503 },
    );
  }

  const fileName = sanitizeFileName(
    request.nextUrl.searchParams.get("name") || `site-${id}`,
  );
  const targetUrl = new URL(
    `/site/${encodeURIComponent(id)}?capture=1`,
    getInternalCaptureOrigin(request),
  );

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: [
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });

    const page = await browser.newPage({
      viewport: { width: 1440, height: 1080 },
      deviceScaleFactor: 1,
    });

    await page.goto(targetUrl.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });

    await page.waitForSelector('main[data-site-ready="true"]', {
      state: "attached",
      timeout: 20_000,
    });
    await page.waitForSelector("h1", {
      state: "visible",
      timeout: 20_000,
    });
    await page
      .waitForLoadState("networkidle", {
        timeout: 8_000,
      })
      .catch(() => {});
    await page.waitForTimeout(1200);

    const screenshot = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    return new NextResponse(new Uint8Array(screenshot), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${fileName || "site-demo"}.png"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("site-screenshot failed", error);
    return NextResponse.json(
      { error: "Não foi possível gerar o print do site." },
      { status: 500 },
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
