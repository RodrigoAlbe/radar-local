import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { enforceLocalApiAccess, enforceSimpleRateLimit } from "@/lib/api-security";
import { normalizeSafeExternalUrl } from "@/lib/url-guard";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 4500;
const USER_AGENT = "Mozilla/5.0 (compatible; RadarLocal/1.0)";
const MAX_HTML_LENGTH = 180_000;
const GENERATED_HERO_DIR = path.join(
  process.cwd(),
  "public",
  "hero-arts",
  "generated",
);

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
  return normalizeSafeExternalUrl(raw);
}

function sanitizeExternalApiKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length < 20 || normalized.length > 300) return null;
  return normalized;
}

function normalizeColorToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : null;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getCategoryPromptDirection(category: string): string {
  const normalized = normalizeCategory(category);
  if (
    normalized.includes("assistencia tecnica") ||
    normalized.includes("conserto") ||
    normalized.includes("oficina") ||
    normalized.includes("autoeletrica") ||
    normalized.includes("mecanica")
  ) {
    return "tecnico trabalhando em bancada de eletronicos e ferramentas reais de manutencao";
  }
  if (normalized.includes("pet") || normalized.includes("veterin")) {
    return "ambiente de pet shop com pet feliz, cuidado e atendimento local";
  }
  if (
    normalized.includes("restaurante") ||
    normalized.includes("lanchonete") ||
    normalized.includes("padaria")
  ) {
    return "ambiente de gastronomia local com balcao, preparo e atendimento acolhedor";
  }
  if (
    normalized.includes("barbearia") ||
    normalized.includes("salao") ||
    normalized.includes("beleza")
  ) {
    return "ambiente de cuidado pessoal com cadeira, espelho e atendimento profissional";
  }
  if (
    normalized.includes("odontolog") ||
    normalized.includes("clinica") ||
    normalized.includes("saude")
  ) {
    return "recepcao de clinica limpa com equipe e ambiente profissional de confianca";
  }
  if (
    normalized.includes("papelaria") ||
    normalized.includes("loja") ||
    normalized.includes("roupa")
  ) {
    return "vitrine de comercio local organizada com produtos em destaque";
  }

  return "negocio local moderno e acolhedor, com atendimento humano e ambiente real";
}

function buildHeroPrompt(input: {
  businessName: string;
  category: string;
  brandColor: string | null;
}): string {
  const direction = getCategoryPromptDirection(input.category);
  const colorToken = input.brandColor ?? "#924a28";

  return [
    "Use case: landing page hero image for local business",
    "Create one photorealistic vertical image 4:5, premium but natural.",
    `Business: ${input.businessName}`,
    `Category: ${input.category}`,
    `Scene: ${direction}`,
    `Palette hint: warm neutrals with subtle harmony to ${colorToken}`,
    "No text, no logos, no watermark, no UI cards, no interface screenshot, no collage.",
    "Avoid fashion store scenes unless category is retail.",
  ].join("\n");
}

async function generateWithOpenAI(prompt: string, apiKey: string): Promise<Buffer> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      quality: "medium",
      n: 1,
    }),
    signal: AbortSignal.timeout(35_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`openai ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const encoded = data?.data?.[0]?.b64_json;
  if (!encoded) {
    throw new Error("openai response without b64 image");
  }

  return Buffer.from(encoded, "base64");
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<Buffer> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
      signal: AbortSignal.timeout(35_000),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`gemini ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: {
            data?: string;
          };
        }>;
      };
    }>;
  };

  const encoded = data?.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  )?.inlineData?.data;

  if (!encoded) {
    throw new Error("gemini response without inline image");
  }

  return Buffer.from(encoded, "base64");
}

async function generateAiHeroImage(input: {
  businessName: string;
  category: string;
  brandColor: string | null;
  openAiApiKey: string | null;
  geminiApiKey: string | null;
}): Promise<{ url: string; source: string } | null> {
  const { businessName, category, brandColor, openAiApiKey, geminiApiKey } = input;
  if (!openAiApiKey && !geminiApiKey) return null;

  const prompt = buildHeroPrompt({ businessName, category, brandColor });
  const fileHash = crypto
    .createHash("sha1")
    .update([businessName, category, brandColor ?? "", prompt].join("|"))
    .digest("hex")
    .slice(0, 12);
  const baseName =
    `${slugify(businessName) || "negocio"}-${slugify(category) || "local"}-${fileHash}`;

  const providerOrder: Array<"gemini" | "openai"> = geminiApiKey
    ? ["gemini", "openai"]
    : ["openai", "gemini"];

  await fs.mkdir(GENERATED_HERO_DIR, { recursive: true });

  for (const provider of providerOrder) {
    try {
      const fileName = `${baseName}-${provider}.png`;
      const filePath = path.join(GENERATED_HERO_DIR, fileName);
      const publicPath = `/hero-arts/generated/${fileName}`;

      try {
        await fs.access(filePath);
        return { url: publicPath, source: `ai-${provider}` };
      } catch {
        // Generate below.
      }

      const imageBuffer =
        provider === "gemini"
          ? geminiApiKey
            ? await generateWithGemini(prompt, geminiApiKey)
            : null
          : openAiApiKey
            ? await generateWithOpenAI(prompt, openAiApiKey)
            : null;

      if (!imageBuffer) continue;

      await fs.writeFile(filePath, imageBuffer);
      return { url: publicPath, source: `ai-${provider}` };
    } catch (error) {
      console.warn(`[extract-brand-assets] fallback ${provider} failed`, error);
    }
  }

  return null;
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
  const accessDenied = enforceLocalApiAccess(request);
  if (accessDenied) return accessDenied;

  const rateLimited = enforceSimpleRateLimit(request, {
    key: "extract-brand-assets-post",
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  try {
    const body = (await request.json()) as {
      websiteUrl?: string;
      instagramUrl?: string;
      facebookUrl?: string;
      linktreeUrl?: string;
      businessName?: string;
      category?: string;
      brandColor?: string;
      openAiApiKey?: string;
      geminiApiKey?: string;
    };

    const candidates: AssetCandidate[] = [];
    const websiteUrl = normalizeInputUrl(body.websiteUrl);
    const openAiApiKey = sanitizeExternalApiKey(body.openAiApiKey);
    const geminiApiKey = sanitizeExternalApiKey(body.geminiApiKey);
    const businessName =
      typeof body.businessName === "string" && body.businessName.trim()
        ? body.businessName.trim()
        : "Negocio local";
    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : "Comercio local";
    const brandColor = normalizeColorToken(body.brandColor);

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
    const aiHero =
      hero?.url
        ? null
        : await generateAiHeroImage({
            businessName,
            category,
            brandColor,
            openAiApiKey,
            geminiApiKey,
          });

    return NextResponse.json({
      heroImageUrl: hero?.url ?? aiHero?.url ?? null,
      logoImageUrl: logo?.url ?? favicon?.url ?? null,
      faviconUrl: favicon?.url ?? null,
      source: hero?.source ?? aiHero?.source ?? logo?.source ?? favicon?.source ?? null,
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
