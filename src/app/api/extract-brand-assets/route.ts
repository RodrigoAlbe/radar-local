import { NextRequest, NextResponse } from "next/server";

const FETCH_TIMEOUT_MS = 4500;
const USER_AGENT = "Mozilla/5.0 (compatible; RadarLocal/1.0)";
const MAX_HTML_LENGTH = 180_000;

type AssetRole = "hero" | "logo" | "favicon";

type AssetCandidate = {
  url: string;
  role: AssetRole;
  score: number;
  source: string;
};

type BrandAssetsResponse = {
  heroImageUrl: string | null;
  logoImageUrl: string | null;
  faviconUrl: string | null;
  source: string | null;
};

function normalizeInputUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      return null;
    }

    const html = await response.text();
    return html.slice(0, MAX_HTML_LENGTH);
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/gi, "/")
    .replace(/&#x3A;/gi, ":")
    .replace(/&#58;/gi, ":")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function resolveAssetUrl(raw: string, baseUrl: string): string | null {
  const normalized = decodeHtmlEntities(raw.trim())
    .replace(/\\\//g, "/")
    .replace(/&amp;/gi, "&");

  if (!normalized) return null;
  if (/^(data|javascript|mailto|tel):/i.test(normalized)) return null;

  try {
    if (normalized.startsWith("//")) {
      return new URL(`https:${normalized}`).toString();
    }

    return new URL(normalized, baseUrl).toString();
  } catch {
    return null;
  }
}

function addCandidate(
  candidates: AssetCandidate[],
  candidate: AssetCandidate | null,
) {
  if (!candidate?.url) return;

  const existing = candidates.findIndex((item) => item.url === candidate.url);
  if (existing >= 0) {
    if (candidate.score > candidates[existing].score) {
      candidates[existing] = candidate;
    }
    return;
  }

  candidates.push(candidate);
}

function extractMetaCandidates(html: string, baseUrl: string): AssetCandidate[] {
  const candidates: AssetCandidate[] = [];
  const patterns: Array<{
    pattern: RegExp;
    role: AssetRole;
    score: number;
    source: string;
  }> = [
    {
      pattern: /meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
      role: "hero",
      score: 120,
      source: "og-image",
    },
    {
      pattern: /meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/gi,
      role: "hero",
      score: 110,
      source: "twitter-image",
    },
    {
      pattern: /meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/gi,
      role: "hero",
      score: 100,
      source: "meta-image",
    },
    {
      pattern: /link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/gi,
      role: "logo",
      score: 90,
      source: "apple-touch-icon",
    },
    {
      pattern: /link[^>]+rel=["'][^"']*(?:shortcut icon|icon)[^"']*["'][^>]+href=["']([^"']+)["']/gi,
      role: "favicon",
      score: 70,
      source: "favicon",
    },
  ];

  for (const { pattern, role, score, source } of patterns) {
    let match: RegExpExecArray | null = null;
    while ((match = pattern.exec(html)) !== null) {
      const url = resolveAssetUrl(match[1], baseUrl);
      addCandidate(
        candidates,
        url ? { url, role, score, source } : null,
      );
    }
  }

  return candidates;
}

function extractSchemaCandidates(html: string, baseUrl: string): AssetCandidate[] {
  const candidates: AssetCandidate[] = [];
  const patterns: Array<{
    pattern: RegExp;
    role: AssetRole;
    score: number;
    source: string;
  }> = [
    {
      pattern: /"logo"\s*:\s*"([^"]+)"/gi,
      role: "logo",
      score: 105,
      source: "schema-logo",
    },
    {
      pattern: /"image"\s*:\s*"([^"]+)"/gi,
      role: "hero",
      score: 95,
      source: "schema-image",
    },
  ];

  for (const { pattern, role, score, source } of patterns) {
    let match: RegExpExecArray | null = null;
    while ((match = pattern.exec(html)) !== null) {
      const url = resolveAssetUrl(match[1], baseUrl);
      addCandidate(
        candidates,
        url ? { url, role, score, source } : null,
      );
    }
  }

  return candidates;
}

function extractImgCandidates(html: string, baseUrl: string): AssetCandidate[] {
  const candidates: AssetCandidate[] = [];
  const patterns: Array<{
    pattern: RegExp;
    role: AssetRole;
    score: number;
    source: string;
  }> = [
    {
      pattern: /<img[^>]+(?:alt|class|id)=["'][^"']*(?:logo|brand)[^"']*["'][^>]+src=["']([^"']+)["']/gi,
      role: "logo",
      score: 85,
      source: "image-logo",
    },
    {
      pattern: /<img[^>]+src=["']([^"']+)["'][^>]+(?:alt|class|id)=["'][^"']*(?:logo|brand)[^"']*["']/gi,
      role: "logo",
      score: 85,
      source: "image-logo",
    },
    {
      pattern: /<img[^>]+(?:alt|class|id)=["'][^"']*(?:hero|banner|cover)[^"']*["'][^>]+src=["']([^"']+)["']/gi,
      role: "hero",
      score: 78,
      source: "image-hero",
    },
    {
      pattern: /<img[^>]+src=["']([^"']+)["'][^>]+(?:alt|class|id)=["'][^"']*(?:hero|banner|cover)[^"']*["']/gi,
      role: "hero",
      score: 78,
      source: "image-hero",
    },
  ];

  for (const { pattern, role, score, source } of patterns) {
    let match: RegExpExecArray | null = null;
    while ((match = pattern.exec(html)) !== null) {
      const url = resolveAssetUrl(match[1], baseUrl);
      addCandidate(
        candidates,
        url ? { url, role, score, source } : null,
      );
    }
  }

  return candidates;
}

function buildWebsiteCandidates(websiteUrl: string): string[] {
  try {
    const base = new URL(websiteUrl);
    const urls = new Set<string>();
    const addRoots = (url: URL) => {
      urls.add(url.toString());
      urls.add(new URL("/", url).toString());
    };

    addRoots(base);

    const httpsUrl = new URL(base.toString());
    httpsUrl.protocol = "https:";
    addRoots(httpsUrl);

    if (!base.hostname.startsWith("www.")) {
      const httpsWwwUrl = new URL(httpsUrl.toString());
      httpsWwwUrl.hostname = `www.${base.hostname}`;
      addRoots(httpsWwwUrl);
    }

    return [...urls].slice(0, 4);
  } catch {
    return [websiteUrl];
  }
}

function buildFallbackCandidates(websiteUrl: string): AssetCandidate[] {
  try {
    const base = new URL(websiteUrl);
    const rootUrl = new URL("/", base);
    const candidates: AssetCandidate[] = [
      {
        url: new URL("/favicon.ico", rootUrl).toString(),
        role: "favicon",
        score: 52,
        source: "root-favicon",
      },
      {
        url: `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(rootUrl.origin)}`,
        role: "logo",
        score: 48,
        source: "domain-favicon",
      },
    ];

    if (!base.hostname.startsWith("www.")) {
      candidates.push({
        url: `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(`https://www.${base.hostname}`)}`,
        role: "logo",
        score: 44,
        source: "domain-favicon",
      });
    }

    return candidates;
  } catch {
    return [];
  }
}

function chooseBest(
  candidates: AssetCandidate[],
  role: AssetRole,
): AssetCandidate | null {
  return (
    candidates
      .filter((candidate) => candidate.role === role)
      .sort((a, b) => b.score - a.score)[0] ?? null
  );
}

async function extractFromPage(url: string): Promise<AssetCandidate[]> {
  const html = await fetchHtml(url);
  if (!html) return [];

  return [
    ...extractMetaCandidates(html, url),
    ...extractSchemaCandidates(html, url),
    ...extractImgCandidates(html, url),
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      websiteUrl?: string;
      instagramUrl?: string;
      facebookUrl?: string;
      linktreeUrl?: string;
    };

    const candidates: AssetCandidate[] = [];
    const websiteUrl = normalizeInputUrl(body.websiteUrl);

    if (websiteUrl) {
      for (const candidateUrl of buildWebsiteCandidates(websiteUrl)) {
        const pageCandidates = await extractFromPage(candidateUrl);
        for (const candidate of pageCandidates) {
          addCandidate(candidates, candidate);
        }
      }

      for (const candidate of buildFallbackCandidates(websiteUrl)) {
        addCandidate(candidates, candidate);
      }
    }

    const hero = chooseBest(candidates, "hero");
    const logo = chooseBest(candidates, "logo");
    const favicon = chooseBest(candidates, "favicon");

    return NextResponse.json({
      heroImageUrl: hero?.url ?? null,
      logoImageUrl: logo?.url ?? favicon?.url ?? null,
      faviconUrl: favicon?.url ?? null,
      source: hero?.source ?? logo?.source ?? favicon?.source ?? null,
    } satisfies BrandAssetsResponse);
  } catch {
    return NextResponse.json({
      heroImageUrl: null,
      logoImageUrl: null,
      faviconUrl: null,
      source: null,
    } satisfies BrandAssetsResponse);
  }
}
