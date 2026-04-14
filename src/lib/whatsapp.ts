import { Lead } from "./types";
import { generateApproaches } from "./approach-generator";
import { ensureLeadSitePublished } from "./site-share";

export function normalizePhoneForWhatsApp(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");

  // Remove leading 0 from DDD (ex: 011 → 11)
  if (digits.startsWith("0") && digits.length >= 11) {
    digits = digits.slice(1);
  }

  // Already has country code 55
  if (digits.startsWith("55") && digits.length >= 12) {
    const withoutCC = digits.slice(2);
    const ddd = withoutCC.slice(0, 2);
    const number = withoutCC.slice(2);

    // Mobile must start with 9 and be 9 digits
    if (number.length === 8 && !number.startsWith("9")) return null;
    // If 8 digits starting with 9-something (old format), add the extra 9
    if (number.length === 8 && number.startsWith("9")) {
      return `55${ddd}${number}`;
    }
    if (number.length === 9 && number.startsWith("9")) {
      return digits;
    }
    return null;
  }

  // Without country code: DDD(2) + number(8 or 9)
  if (digits.length === 10 || digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const number = digits.slice(2);

    // Landline (8 digits, doesn't start with 9) — not WhatsApp
    if (number.length === 8 && !number.startsWith("9")) return null;

    // Old mobile format (8 digits starting with 9) — add the extra 9
    if (number.length === 8 && number.startsWith("9")) {
      return `55${ddd}9${number}`;
    }

    // Current mobile format (9 digits starting with 9)
    if (number.length === 9 && number.startsWith("9")) {
      return `55${ddd}${number}`;
    }

    return null;
  }

  return null;
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  return `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`;
}

export async function fetchPublicBaseUrl(): Promise<string> {
  try {
    const res = await fetch("/api/public-url");
    const data = await res.json();
    if (data.url) return data.url;
  } catch { /* fallback */ }
  if (typeof window === "undefined") return "";

  const { hostname, origin } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  return isLocalhost ? "" : origin;
}

export function buildSiteUrl(baseUrl: string, businessId: string, shortCode: string | null): string {
  return shortCode ? `${baseUrl}/s/${shortCode}` : `${baseUrl}/site/${businessId}`;
}

export function getWhatsAppMessage(lead: Lead, siteUrl: string): string {
  const approaches = generateApproaches(lead);
  const waVariant = approaches.find((a) => a.type === "whatsapp") ?? approaches[0];
  return waVariant.message.replace(/\{LINK_SITE_DEMO\}/g, siteUrl);
}

export function resolveMessage(lead: Lead, siteUrl: string, variant?: string): string {
  const approaches = generateApproaches(lead);
  const match = approaches.find((a) => a.type === variant) ?? approaches[0];
  return match.message.replace(/\{LINK_SITE_DEMO\}/g, siteUrl);
}

export type WhatsAppResult =
  | { ok: true }
  | { ok: false; reason: "no_phone" | "no_whatsapp" | "landline" | "invalid_number" | "no_public_url" };

export async function openWhatsApp(lead: Lead): Promise<WhatsAppResult> {
  const phone = lead.business.phone;
  if (!phone) return { ok: false, reason: "no_phone" };
  if (!lead.signals.whatsapp_detected) return { ok: false, reason: "no_whatsapp" };

  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return { ok: false, reason: "landline" };

  const [shortCode, baseUrl] = await Promise.all([
    ensureLeadSitePublished(lead),
    fetchPublicBaseUrl(),
  ]);
  if (!baseUrl) return { ok: false, reason: "no_public_url" };
  const siteUrl = buildSiteUrl(baseUrl, lead.business.id, shortCode);
  const message = getWhatsAppMessage(lead, siteUrl);
  const url = buildWhatsAppUrl(phone, message);
  if (!url) return { ok: false, reason: "invalid_number" };

  window.open(url, "_blank", "noopener,noreferrer");
  return { ok: true };
}
