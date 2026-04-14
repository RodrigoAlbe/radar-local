import { Lead } from "./types";

interface SiteDataResponse {
  found?: boolean;
  lead?: Lead | null;
  shortCode?: string | null;
}

async function fetchSiteData(id: string): Promise<SiteDataResponse | null> {
  try {
    const res = await fetch(`/api/site-data/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return (await res.json()) as SiteDataResponse;
  } catch {
    return null;
  }
}

export async function fetchPublishedLead(
  id: string,
): Promise<{ lead: Lead; shortCode: string | null } | null> {
  const data = await fetchSiteData(id);
  if (!data?.found || !data.lead) return null;
  return { lead: data.lead, shortCode: data.shortCode ?? null };
}

export async function publishLeadToServer(lead: Lead): Promise<string | null> {
  try {
    const res = await fetch(`/api/site-data/${encodeURIComponent(lead.business.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SiteDataResponse;
    return data.shortCode ?? null;
  } catch {
    return null;
  }
}

export async function ensureLeadSitePublished(lead: Lead): Promise<string | null> {
  const existing = await fetchSiteData(lead.business.id);
  if (existing?.found) {
    return existing.shortCode ?? null;
  }

  return publishLeadToServer(lead);
}
