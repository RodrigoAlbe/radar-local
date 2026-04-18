import { NextRequest, NextResponse } from "next/server";

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();

function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;

  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return false;

  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "::1") return true;
  if (normalized.startsWith("fe80:")) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  return false;
}

function normalizeHost(raw: string | null): string {
  if (!raw) return "";
  const first = raw.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!first) return "";

  if (first.startsWith("[") && first.includes("]")) {
    const end = first.indexOf("]");
    return first.slice(0, end + 1);
  }

  return first.replace(/:\d+$/, "");
}

function getRequestHost(request: NextRequest): string {
  const forwardedHost = normalizeHost(request.headers.get("x-forwarded-host"));
  if (forwardedHost) return forwardedHost;

  const host = normalizeHost(request.headers.get("host"));
  if (host) return host;

  return normalizeHost(request.nextUrl.hostname);
}

function getClientIdentity(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const client = forwardedFor.split(",")[0]?.trim();
  if (client) return client;

  return getRequestHost(request) || "unknown";
}

function isLocalRequest(request: NextRequest): boolean {
  const host = getRequestHost(request);
  if (!host) return false;

  if (LOCAL_HOSTS.has(host)) return true;
  if (isPrivateIpv4(host)) return true;
  if (isPrivateIpv6(host)) return true;
  if (host.endsWith(".local")) return true;

  return false;
}

function hasValidInternalApiKey(request: NextRequest): boolean {
  const expected = process.env.INTERNAL_API_KEY?.trim();
  if (!expected) return false;

  const provided = request.headers.get("x-internal-api-key")?.trim();
  return Boolean(provided && provided === expected);
}

export function enforceLocalApiAccess(request: NextRequest): NextResponse | null {
  if (process.env.ALLOW_NON_LOCAL_API === "true") {
    return null;
  }

  if (isLocalRequest(request) || hasValidInternalApiKey(request)) {
    return null;
  }

  return NextResponse.json(
    { error: "Endpoint disponivel apenas para acesso local." },
    { status: 403 },
  );
}

export function enforceSimpleRateLimit(
  request: NextRequest,
  options: { key: string; limit: number; windowMs: number },
): NextResponse | null {
  const now = Date.now();
  const bucketKey = `${options.key}:${getClientIdentity(request)}`;
  const current = RATE_LIMIT_STORE.get(bucketKey);

  if (!current || now > current.resetAt) {
    RATE_LIMIT_STORE.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return null;
  }

  current.count += 1;
  RATE_LIMIT_STORE.set(bucketKey, current);

  if (current.count <= options.limit) {
    return null;
  }

  return NextResponse.json(
    { error: "Muitas requisicoes. Tente novamente em instantes." },
    { status: 429 },
  );
}
