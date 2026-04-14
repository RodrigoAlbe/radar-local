import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 5000;

function isValidHex(color: string): boolean {
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(color);
}

function normalizeColor(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();

  if (isValidHex(trimmed)) {
    if (trimmed.length === 4) {
      const [, r, g, b] = trimmed;
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return trimmed;
  }

  const rgbMatch = trimmed.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const hex = (n: string) => parseInt(n).toString(16).padStart(2, "0");
    return `#${hex(rgbMatch[1])}${hex(rgbMatch[2])}${hex(rgbMatch[3])}`;
  }

  return null;
}

function isBoring(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r + g + b) / 3;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness > 240 || brightness < 15 || saturation < 20;
}

async function fetchWithTimeout(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RadarLocal/1.0)" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 100_000);
  } catch {
    return null;
  }
}

function extractFromMeta(html: string): string | null {
  const patterns = [
    /meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i,
    /meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i,
    /meta[^>]*name=["']msapplication-TileColor["'][^>]*content=["']([^"']+)["']/i,
    /meta[^>]*content=["']([^"']+)["'][^>]*name=["']msapplication-TileColor["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const color = normalizeColor(match[1]);
      if (color && !isBoring(color)) return color;
    }
  }
  return null;
}

function extractFromCSS(html: string): string | null {
  const varPatterns = [
    /--(?:primary|brand|main|accent|theme)(?:-color)?:\s*([^;}\s]+)/i,
    /--color-primary:\s*([^;}\s]+)/i,
  ];

  for (const pattern of varPatterns) {
    const match = html.match(pattern);
    if (match) {
      const color = normalizeColor(match[1]);
      if (color && !isBoring(color)) return color;
    }
  }

  const colorCounts: Record<string, number> = {};
  const hexPattern = /#[0-9a-fA-F]{3,6}(?=[;\s"')},])/g;
  let m;
  while ((m = hexPattern.exec(html)) !== null) {
    const normalized = normalizeColor(m[0]);
    if (normalized && !isBoring(normalized)) {
      colorCounts[normalized] = (colorCounts[normalized] || 0) + 1;
    }
  }

  const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0 && sorted[0][1] >= 3) {
    return sorted[0][0];
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ color: null });
    }

    let targetUrl = url;
    if (!targetUrl.startsWith("http")) {
      targetUrl = `https://${targetUrl}`;
    }

    const html = await fetchWithTimeout(targetUrl);
    if (!html) {
      return NextResponse.json({ color: null });
    }

    const metaColor = extractFromMeta(html);
    if (metaColor) {
      return NextResponse.json({ color: metaColor });
    }

    const cssColor = extractFromCSS(html);
    if (cssColor) {
      return NextResponse.json({ color: cssColor });
    }

    return NextResponse.json({ color: null });
  } catch {
    return NextResponse.json({ color: null });
  }
}
