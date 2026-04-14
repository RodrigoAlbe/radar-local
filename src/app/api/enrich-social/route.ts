import { NextRequest, NextResponse } from "next/server";
import { getSocialOverride } from "@/lib/social-overrides";

const WEBSITE_FETCH_TIMEOUT_MS = 2500;
const SEARCH_FETCH_TIMEOUT_MS = 2000;
const INSTAGRAM_FETCH_TIMEOUT_MS = 2500;
const MAX_HTML_LENGTH = 250_000;
const USER_AGENT = "Mozilla/5.0 (compatible; RadarLocal/1.0)";
const INSTAGRAM_RESERVED_PATHS = new Set([
  "about",
  "accounts",
  "developer",
  "directory",
  "explore",
  "legal",
  "p",
  "press",
  "reel",
  "reels",
  "stories",
]);
const FACEBOOK_RESERVED_PATHS = new Set([
  "ads",
  "events",
  "groups",
  "help",
  "marketplace",
  "plugins",
  "reel",
  "reels",
  "search",
  "settings",
  "share",
  "sharer",
  "watch",
]);

type SocialPlatform = "instagram" | "facebook" | "linktree";

type EnrichmentResult = {
  instagram_url: string | null;
  facebook_url: string | null;
  linktree_url: string | null;
  confidence: number;
  sources: string[];
};

function normalizeInputUrl(raw: string): string | null {
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

async function fetchHtml(url: string, timeoutMs = WEBSITE_FETCH_TIMEOUT_MS): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
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
      !contentType.includes("application/xhtml+xml") &&
      !contentType.includes("text/plain")
    ) {
      return null;
    }

    const text = await response.text();
    return text.slice(0, MAX_HTML_LENGTH);
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

function maybeAbsoluteUrl(raw: string, baseUrl: string): string | null {
  const normalized = decodeHtmlEntities(raw.trim())
    .replace(/\\\//g, "/")
    .replace(/&amp;/gi, "&");

  if (!normalized) return null;
  if (/^(mailto|tel|javascript):/i.test(normalized)) return null;

  try {
    if (normalized.startsWith("//")) {
      return new URL(`https:${normalized}`).toString();
    }

    return new URL(normalized, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractCandidateUrls(html: string, baseUrl: string): string[] {
  const matches = new Set<string>();
  const attributePattern = /(href|content)=["']([^"'<>]+)["']/gi;
  const rawUrlPattern = /https?:\/\/[^\s"'<>\\]+/gi;
  const sameAsPattern = /"sameAs"\s*:\s*(\[[\s\S]*?\]|"[^"]+")/gi;

  let match: RegExpExecArray | null = null;
  while ((match = attributePattern.exec(html)) !== null) {
    const url = maybeAbsoluteUrl(match[2], baseUrl);
    if (url) matches.add(url);
  }

  while ((match = rawUrlPattern.exec(html)) !== null) {
    const url = maybeAbsoluteUrl(match[0], baseUrl);
    if (url) matches.add(url);
  }

  while ((match = sameAsPattern.exec(html)) !== null) {
    const block = match[1];
    const quotedPattern = /"([^"]+)"/g;
    let quoted: RegExpExecArray | null = null;
    while ((quoted = quotedPattern.exec(block)) !== null) {
      const url = maybeAbsoluteUrl(quoted[1], baseUrl);
      if (url) matches.add(url);
    }
  }

  return [...matches];
}

function unwrapRedirectUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host.endsWith("duckduckgo.com")) {
      const uddg = url.searchParams.get("uddg");
      if (uddg) return decodeURIComponent(uddg);
    }
  } catch {
    return raw;
  }

  return raw;
}

function canonicalInstagramUrl(raw: string): string | null {
  try {
    const input = new URL(unwrapRedirectUrl(raw));
    const host = input.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "l.instagram.com") {
      const redirected = input.searchParams.get("u");
      return redirected ? canonicalInstagramUrl(redirected) : null;
    }
    if (!host.endsWith("instagram.com")) return null;

    const [firstSegment] = input.pathname.split("/").filter(Boolean);
    if (!firstSegment) return null;

    const normalizedSegment = firstSegment.toLowerCase();
    if (INSTAGRAM_RESERVED_PATHS.has(normalizedSegment)) return null;

    return `https://www.instagram.com/${firstSegment}/`;
  } catch {
    return null;
  }
}

function canonicalFacebookUrl(raw: string): string | null {
  try {
    const input = new URL(unwrapRedirectUrl(raw));
    const host = input.hostname.replace(/^www\./i, "").toLowerCase();
    if (!host.endsWith("facebook.com") && host !== "fb.com") return null;

    if (input.pathname === "/profile.php") {
      const profileId = input.searchParams.get("id");
      return profileId
        ? `https://www.facebook.com/profile.php?id=${profileId}`
        : null;
    }

    const segments = input.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const [firstSegment, secondSegment] = segments;
    const normalizedSegment = firstSegment.toLowerCase();
    if (FACEBOOK_RESERVED_PATHS.has(normalizedSegment)) return null;

    const path =
      normalizedSegment === "pages" && secondSegment
        ? `${firstSegment}/${secondSegment}`
        : firstSegment;

    return `https://www.facebook.com/${path}`;
  } catch {
    return null;
  }
}

function canonicalLinktreeUrl(raw: string): string | null {
  try {
    const input = new URL(unwrapRedirectUrl(raw));
    const host = input.hostname.replace(/^www\./i, "").toLowerCase();
    if (!host.includes("linktr.ee") && !host.includes("linktree")) return null;

    const [firstSegment] = input.pathname.split("/").filter(Boolean);
    if (!firstSegment) return null;

    return `https://linktr.ee/${firstSegment}`;
  } catch {
    return null;
  }
}

function canonicalizeSocialUrl(raw: string, platform: SocialPlatform): string | null {
  if (platform === "instagram") return canonicalInstagramUrl(raw);
  if (platform === "facebook") return canonicalFacebookUrl(raw);
  return canonicalLinktreeUrl(raw);
}

function extractSocialsFromHtml(html: string, baseUrl: string): EnrichmentResult {
  const candidates = extractCandidateUrls(html, baseUrl);

  let instagram_url: string | null = null;
  let facebook_url: string | null = null;
  let linktree_url: string | null = null;

  for (const candidate of candidates) {
    if (!instagram_url) {
      instagram_url = canonicalizeSocialUrl(candidate, "instagram");
    }
    if (!facebook_url) {
      facebook_url = canonicalizeSocialUrl(candidate, "facebook");
    }
    if (!linktree_url) {
      linktree_url = canonicalizeSocialUrl(candidate, "linktree");
    }

    if (instagram_url && facebook_url && linktree_url) {
      break;
    }
  }

  const foundCount = [instagram_url, facebook_url, linktree_url].filter(Boolean).length;

  return {
    instagram_url,
    facebook_url,
    linktree_url,
    confidence: foundCount > 0 ? 0.93 : 0,
    sources: foundCount > 0 ? ["website"] : [],
  };
}

function buildCandidatePages(websiteUrl: string): string[] {
  try {
    const base = new URL(websiteUrl);
    const candidates = new Set<string>();

    const addPages = (originUrl: URL) => {
      const rootUrl = new URL("/", originUrl);
      candidates.add(rootUrl.toString());
      candidates.add(new URL("/contato", rootUrl).toString());
      candidates.add(new URL("/sobre", rootUrl).toString());
      candidates.add(new URL("/fale-conosco", rootUrl).toString());
      candidates.add(new URL("/contact", rootUrl).toString());
    };

    addPages(base);

    const httpsBase = new URL(base.toString());
    httpsBase.protocol = "https:";
    addPages(httpsBase);

    const httpBase = new URL(base.toString());
    httpBase.protocol = "http:";
    addPages(httpBase);

    if (!base.hostname.startsWith("www.")) {
      const httpsWwwBase = new URL(httpsBase.toString());
      httpsWwwBase.hostname = `www.${base.hostname}`;
      addPages(httpsWwwBase);

      const httpWwwBase = new URL(httpBase.toString());
      httpWwwBase.hostname = `www.${base.hostname}`;
      addPages(httpWwwBase);
    }

    return [...candidates];
  } catch {
    return [websiteUrl];
  }
}

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function businessTokens(value: string): string[] {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 4);
}

function getWebsiteStem(websiteUrl: string): string {
  try {
    const host = new URL(websiteUrl).hostname.replace(/^www\./i, "").toLowerCase();
    return normalizeForMatch(host.replace(/\.(com|com\.br|net|org|biz|site|online|br)$/i, ""));
  } catch {
    return "";
  }
}

function getProfileHandle(raw: string): string {
  try {
    const url = new URL(raw);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "";
    const handle =
      segments[0].toLowerCase() === "pages" && segments[1]
        ? segments[1]
        : segments[0];
    return normalizeForMatch(handle);
  } catch {
    return "";
  }
}

function scoreSocialCandidate(
  candidate: string,
  businessName: string,
  websiteUrl: string | null,
): number {
  const handle = getProfileHandle(candidate);
  if (!handle) return 0;

  const normalizedBusiness = normalizeForMatch(businessName);
  const websiteStem = websiteUrl ? getWebsiteStem(websiteUrl) : "";
  const tokens = businessTokens(businessName);
  let score = 0;

  if (normalizedBusiness && (handle.includes(normalizedBusiness) || normalizedBusiness.includes(handle))) {
    score += 8;
  }

  if (websiteStem && (handle.includes(websiteStem) || websiteStem.includes(handle))) {
    score += 7;
  }

  for (const token of tokens) {
    if (handle.includes(token)) score += 2;
  }

  return score;
}

async function searchInstagramTopResults(
  businessName: string,
  websiteUrl: string | null,
): Promise<string | null> {
  const websiteStem = websiteUrl ? getWebsiteStem(websiteUrl) : "";
  const queries = [websiteStem, businessName].filter(Boolean);
  let bestMatch: { url: string; score: number } | null = null;

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(query)}`,
        {
          signal: AbortSignal.timeout(INSTAGRAM_FETCH_TIMEOUT_MS),
          headers: {
            "User-Agent": USER_AGENT,
            "X-IG-App-ID": "936619743392459",
            Referer: "https://www.instagram.com/",
          },
        }
      );

      if (!response.ok) continue;

      const data = (await response.json()) as {
        users?: Array<{
          user?: {
            username?: string;
            full_name?: string;
          };
        }>;
      };

      for (const entry of data.users ?? []) {
        const username = entry.user?.username?.trim();
        if (!username) continue;

        const candidate = `https://www.instagram.com/${username}/`;
        const score =
          scoreSocialCandidate(candidate, businessName, websiteUrl) +
          scoreSocialCandidate(
            `https://www.instagram.com/${entry.user?.full_name ?? ""}/`,
            businessName,
            websiteUrl,
          );

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { url: candidate, score };
        }
      }
    } catch {
      continue;
    }
  }

  return bestMatch && bestMatch.score >= 6 ? bestMatch.url : null;
}

async function searchSocialProfile(
  platform: Exclude<SocialPlatform, "linktree">,
  businessName: string,
  region: string,
  websiteUrl: string | null,
): Promise<string | null> {
  const searchHost = platform === "instagram" ? "instagram.com" : "facebook.com";
  const websiteStem = websiteUrl ? getWebsiteStem(websiteUrl) : "";
  const queries = [
    `site:${searchHost} "${businessName}"`,
    region ? `site:${searchHost} "${businessName}" "${region}"` : "",
    websiteStem ? `site:${searchHost} "${websiteStem}"` : "",
  ].filter(Boolean);
  const searchBases = [
    "https://www.google.com/search?gbv=1&q=",
    "https://www.bing.com/search?q=",
    "https://duckduckgo.com/html/?q=",
    "https://html.duckduckgo.com/html/?q=",
    "https://r.jina.ai/http://www.google.com/search?gbv=1&q=",
    "https://r.jina.ai/http://www.bing.com/search?q=",
  ];

  let bestMatch: { url: string; score: number } | null = null;

  for (const query of queries) {
    for (const searchBase of searchBases) {
      const searchUrl = `${searchBase}${encodeURIComponent(query)}`;
      const html = await fetchHtml(searchUrl, SEARCH_FETCH_TIMEOUT_MS);
      if (!html) continue;

      const candidates = extractCandidateUrls(html, searchBase)
        .map(unwrapRedirectUrl)
        .map((url) => canonicalizeSocialUrl(url, platform))
        .filter((url): url is string => Boolean(url));

      for (const candidate of new Set(candidates)) {
        const score = scoreSocialCandidate(candidate, businessName, websiteUrl);
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { url: candidate, score };
        }
      }
    }
  }

  return bestMatch && bestMatch.score >= 6 ? bestMatch.url : null;
}

async function enrichFromWebsite(
  websiteUrl: string,
): Promise<EnrichmentResult> {
  let aggregate: EnrichmentResult = {
    instagram_url: null,
    facebook_url: null,
    linktree_url: null,
    confidence: 0,
    sources: [],
  };

  for (const pageUrl of buildCandidatePages(websiteUrl)) {
    const html = await fetchHtml(pageUrl);
    if (!html) continue;

    const partial = extractSocialsFromHtml(html, pageUrl);
    aggregate = {
      instagram_url: aggregate.instagram_url ?? partial.instagram_url,
      facebook_url: aggregate.facebook_url ?? partial.facebook_url,
      linktree_url: aggregate.linktree_url ?? partial.linktree_url,
      confidence: Math.max(aggregate.confidence, partial.confidence),
      sources:
        partial.sources.length > 0
          ? [...new Set([...aggregate.sources, ...partial.sources])]
          : aggregate.sources,
    };

    if (aggregate.instagram_url && aggregate.facebook_url && aggregate.linktree_url) {
      break;
    }
  }

  return aggregate;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      businessId?: string;
      websiteUrl?: string;
      businessName?: string;
      region?: string;
    };

    const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
    const websiteUrl = typeof body.websiteUrl === "string" ? normalizeInputUrl(body.websiteUrl) : null;
    const businessName =
      typeof body.businessName === "string" ? body.businessName.trim() : "";
    const region = typeof body.region === "string" ? body.region.trim() : "";

    const override = getSocialOverride(businessId);
    if (override) {
      return NextResponse.json({
        instagram_url: override.instagram_url ?? null,
        facebook_url: override.facebook_url ?? null,
        linktree_url: override.linktree_url ?? null,
        confidence: 1,
        sources: ["override"],
      } satisfies EnrichmentResult);
    }

    if (!websiteUrl) {
      return NextResponse.json(
        {
          instagram_url: null,
          facebook_url: null,
          linktree_url: null,
          confidence: 0,
          sources: [],
        } satisfies EnrichmentResult,
      );
    }

    const fromWebsite = await enrichFromWebsite(websiteUrl);

    let instagramUrl = fromWebsite.instagram_url;
    let facebookUrl = fromWebsite.facebook_url;
    const linktreeUrl = fromWebsite.linktree_url;
    const sources = [...fromWebsite.sources];
    let confidence = fromWebsite.confidence;

    if (businessName) {
      if (!instagramUrl) {
        instagramUrl = await searchInstagramTopResults(businessName, websiteUrl);
      }

      if (!instagramUrl) {
        instagramUrl = await searchSocialProfile("instagram", businessName, region, websiteUrl);
      }

      if (instagramUrl) {
        sources.push("search");
        confidence = Math.max(confidence, 0.76);
      }

      if (!facebookUrl) {
        facebookUrl = await searchSocialProfile("facebook", businessName, region, websiteUrl);
        if (facebookUrl) {
          sources.push("search");
          confidence = Math.max(confidence, 0.72);
        }
      }
    }

    return NextResponse.json({
      instagram_url: instagramUrl,
      facebook_url: facebookUrl,
      linktree_url: linktreeUrl,
      confidence,
      sources: [...new Set(sources)],
    } satisfies EnrichmentResult);
  } catch {
    return NextResponse.json(
      {
        instagram_url: null,
        facebook_url: null,
        linktree_url: null,
        confidence: 0,
        sources: [],
      } satisfies EnrichmentResult,
    );
  }
}
