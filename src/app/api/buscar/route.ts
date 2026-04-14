import { NextRequest, NextResponse } from "next/server";
import { generateMockLeads } from "@/lib/mock-data";
import { deduplicateBusinesses } from "@/lib/dedup";
import { calculateScore } from "@/lib/scoring";
import { Lead, BusinessEntity, DigitalSignals } from "@/lib/types";

const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.location",
  "places.addressComponents",
  "places.types",
].join(",");

const MAX_PAGES = 5;
const PER_PAGE = 20;

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

interface GooglePlace {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  location?: { latitude: number; longitude: number };
  addressComponents?: AddressComponent[];
  types?: string[];
}

interface GoogleSearchResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

interface GeoCoords {
  lat: number;
  lng: number;
}

interface NominatimAddress {
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  postcode?: string;
  road?: string;
  house_number?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name?: string;
  addresstype?: string;
  type?: string;
  importance?: number;
  name?: string;
  address?: NominatimAddress;
}

/** Dist?ncia em metros entre dois pontos (WGS84). */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** C?rculo em locationBias + filtro Haversine (at? 50 km). */
const MAX_RADIUS_METERS = 50_000;
const SOCIAL_HOSTS = new Set([
  "facebook.com",
  "instagram.com",
  "wa.me",
  "whatsapp.com",
  "api.whatsapp.com",
  "linktr.ee",
  "linktree.com",
  "tiktok.com",
  "x.com",
]);
const GENERIC_CATEGORY_QUERIES = [
  "oficina mec?nica",
  "assist?ncia t?cnica",
  "pet shop",
  "sal?o de beleza",
  "barbearia",
  "padaria",
];
const GENERIC_TEXT_QUERY =
  "oficina mec?nica assist?ncia t?cnica pet shop sal?o de beleza barbearia padaria";

function clampRadiusMeters(radiusKm: number): number {
  const m = Math.round(radiusKm * 1000);
  return Math.min(Math.max(m, 500), MAX_RADIUS_METERS);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeLocation(value: string): string[] {
  const stopwords = new Set(["brasil", "bairro", "cidade", "estado", "regiao", "de", "da", "do", "das", "dos"]);
  return normalizeText(value)
    .split(/[\s,]+/)
    .filter((token) => token.length >= 2 && !stopwords.has(token));
}

function parseCoordsInput(value: string): GeoCoords | null {
  const match = value
    .trim()
    .match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { lat, lng };
}

function isSocialUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    return Array.from(SOCIAL_HOSTS).some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function getPresenceSignals(url: string | null | undefined) {
  if (!url) {
    return {
      hasWebsite: false,
      hasSocialOnly: false,
      websiteUrl: null,
      instagramUrl: null,
      facebookUrl: null,
      linktreeUrl: null,
      presenceStatus: "sem_site_detectado" as const,
    };
  }

  if (!isSocialUrl(url)) {
    return {
      hasWebsite: true,
      hasSocialOnly: false,
      websiteUrl: url,
      instagramUrl: null,
      facebookUrl: null,
      linktreeUrl: null,
      presenceStatus: "site_proprio" as const,
    };
  }

  let instagramUrl: string | null = null;
  let facebookUrl: string | null = null;
  let linktreeUrl: string | null = null;

  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    if (host.includes("instagram")) instagramUrl = url;
    if (host.includes("facebook")) facebookUrl = url;
    if (host.includes("linktr")) linktreeUrl = url;
  } catch {
    // Ignore malformed URLs and fall back to social-only.
  }

  return {
    hasWebsite: false,
    hasSocialOnly: true,
    websiteUrl: null,
    instagramUrl,
    facebookUrl,
    linktreeUrl,
    presenceStatus: "so_redes_sociais" as const,
  };
}

/** Remove escrit?rios globais / ru?do em buscas gen?ricas de ?â‚¬Å“com?rcio local?â‚¬Â. */
const NOISE_PLACE_TYPES = new Set(["corporate_office"]);

function isNoisePlace(place: GooglePlace): boolean {
  const name = place.displayName?.text?.trim() ?? "";
  if (/^Google\b/i.test(name)) return true;
  if (/^Google for\b/i.test(name)) return true;
  if (place.types?.some((t) => NOISE_PLACE_TYPES.has(t))) return true;
  return false;
}

function isMobilePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  let numberPart = digits;

  if (numberPart.startsWith("55") && numberPart.length >= 12) {
    numberPart = numberPart.slice(2);
  }
  if (numberPart.startsWith("0")) {
    numberPart = numberPart.slice(1);
  }

  if (numberPart.length >= 10) {
    const localNumber = numberPart.slice(2);
    return localNumber.startsWith("9") && localNumber.length === 9;
  }
  return false;
}

function hasType(c: AddressComponent, ...types: string[]): boolean {
  return Array.isArray(c.types) && types.some((t) => c.types.includes(t));
}

function extractRegion(place: GooglePlace): string {
  const comps = place.addressComponents;
  if (comps?.length) {
    const neighborhood = comps.find((c) => hasType(c, "sublocality_level_1", "sublocality", "neighborhood"));
    const city = comps.find((c) => hasType(c, "administrative_area_level_2", "locality"));
    const state = comps.find((c) => hasType(c, "administrative_area_level_1"));

    const parts = [neighborhood?.longText, city?.longText, state?.shortText].filter(Boolean);
    if (parts.length) return parts.join(", ");
  }

  const addr = place.formattedAddress || "";
  const dashParts = addr.split(" - ");
  if (dashParts.length >= 2) {
    return dashParts.slice(1).join(" - ").replace(/,?\s*\d{5}-?\d{3}.*$/, "").trim();
  }
  return addr;
}

function scoreGeocodeCandidate(candidate: NominatimResult, location: string, cep: string | null): number {
  const haystack = normalizeText(
    [
      candidate.name,
      candidate.display_name,
      candidate.address?.neighbourhood,
      candidate.address?.suburb,
      candidate.address?.quarter,
      candidate.address?.city,
      candidate.address?.town,
      candidate.address?.village,
      candidate.address?.municipality,
      candidate.address?.state,
      candidate.address?.postcode,
      candidate.address?.road,
    ]
      .filter(Boolean)
      .join(" "),
  );

  let score = candidate.importance ?? 0;
  const tokens = tokenizeLocation(location);
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += token.length >= 5 ? 3 : 1.5;
    }
  }

  const primarySegment = normalizeText(location.split(",")[0] ?? "");
  if (primarySegment && haystack.includes(primarySegment)) {
    score += 8;
  }

  const locality = normalizeText(
    candidate.address?.neighbourhood ||
      candidate.address?.suburb ||
      candidate.address?.quarter ||
      candidate.address?.city ||
      candidate.address?.town ||
      candidate.address?.village ||
      candidate.address?.municipality ||
      "",
  );
  if (primarySegment && locality.includes(primarySegment)) {
    score += 6;
  }

  const type = candidate.addresstype || candidate.type || "";
  if (["postcode", "suburb", "neighbourhood", "quarter", "city", "town", "village", "municipality"].includes(type)) {
    score += 4;
  }

  if (cep && candidate.address?.postcode?.replace(/\D/g, "") === cep.replace(/\D/g, "")) {
    score += 20;
  }

  const hasStreetDetails = Boolean(candidate.address?.road || candidate.address?.house_number);
  const queryHasStreetNumber = /\d/.test(location);
  if (hasStreetDetails && !queryHasStreetNumber && !cep) {
    score -= 4;
  }

  return score;
}

function scoreLocationMatch(text: string, location: string): number {
  const haystack = normalizeText(text);
  if (!haystack) return 0;

  let score = 0;
  const primarySegment = normalizeText(location.split(",")[0] ?? "");
  if (primarySegment && haystack.includes(primarySegment)) {
    score += 10;
  }

  for (const token of tokenizeLocation(location)) {
    if (haystack.includes(token)) {
      score += token.length >= 5 ? 2 : 1;
    }
  }

  return score;
}

function mapGooglePlaceToLead(place: GooglePlace, fallbackRegion: string, category: string): Lead {
  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || null;
  const isMobile = phone ? isMobilePhone(phone) : false;
  const region = extractRegion(place) || fallbackRegion;
  const presence = getPresenceSignals(place.websiteUri);

  const business: BusinessEntity = {
    id: place.id || `gp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    normalized_name: place.displayName?.text || "Sem nome",
    category,
    address: place.formattedAddress || "",
    region,
    phone,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    source_refs: ["google_places"],
    created_at: new Date().toISOString(),
  };

  const signals: DigitalSignals = {
    business_id: business.id,
    has_website: presence.hasWebsite,
    has_social_only: presence.hasSocialOnly,
    website_url: presence.websiteUrl,
    instagram_url: presence.instagramUrl,
    facebook_url: presence.facebookUrl,
    whatsapp_detected: isMobile,
    linktree_url: presence.linktreeUrl,
    google_maps_url: place.googleMapsUri || null,
    review_count: place.userRatingCount ?? 0,
    average_rating: place.rating ?? null,
    confidence: 0.9,
    presence_status: presence.presenceStatus,
    brand_color: null,
    checked_at: new Date().toISOString(),
  };

  const score = calculateScore(business, signals);

  return { business, signals, score, pipeline: null };
}

const BR_CEP_RE = /^\s*(\d{5})-?(\d{3})\s*$/;

function isBrazilianCep(text: string): string | null {
  const m = text.trim().match(BR_CEP_RE);
  return m ? `${m[1]}-${m[2]}` : null;
}

async function geocodeLocation(location: string): Promise<GeoCoords | null> {
  const directCoords = parseCoordsInput(location);
  if (directCoords) return directCoords;

  const cep = isBrazilianCep(location);
  try {
    if (cep) {
      const q = encodeURIComponent(`${cep}, Brasil`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1&countrycodes=br&accept-language=pt-BR`,
        { headers: { "User-Agent": "RadarLocal/1.0 (contato@radarlocal.com)" } },
      );
      if (res.ok) {
        const data: NominatimResult[] = await res.json();
        if (data.length > 0) {
          const best = [...data].sort(
            (a, b) => scoreGeocodeCandidate(b, location, cep) - scoreGeocodeCandidate(a, location, cep),
          )[0];
          if (best) {
            return { lat: parseFloat(best.lat), lng: parseFloat(best.lon) };
          }
        }
      }
    }

    const encoded = encodeURIComponent(location.trim() + ", Brasil");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&addressdetails=1&countrycodes=br&accept-language=pt-BR`,
      { headers: { "User-Agent": "RadarLocal/1.0 (contato@radarlocal.com)" } },
    );
    if (!res.ok) return null;
    const data: NominatimResult[] = await res.json();
    if (data.length === 0) return null;

    const best = [...data].sort(
      (a, b) => scoreGeocodeCandidate(b, location, cep) - scoreGeocodeCandidate(a, location, cep),
    )[0];
    if (!best) return null;

    return { lat: parseFloat(best.lat), lng: parseFloat(best.lon) };
  } catch {
    return null;
  }
}

function filterPlacesWithinRadius(
  places: GooglePlace[],
  center: GeoCoords,
  radiusMeters: number,
): GooglePlace[] {
  return places.filter((p) => {
    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    if (lat == null || lng == null) return true;
    return haversineMeters(center.lat, center.lng, lat, lng) <= radiusMeters + 80;
  });
}

function getPlaceDistanceMeters(place: GooglePlace, center: GeoCoords): number {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (lat == null || lng == null) return Number.POSITIVE_INFINITY;
  return haversineMeters(center.lat, center.lng, lat, lng);
}

async function fetchGooglePlaces(
  apiKey: string,
  query: string,
  maxResults: number,
  coords: GeoCoords | null,
  radiusKm: number,
): Promise<{ places: GooglePlace[]; source: "google_places" }> {
  const allPlaces: GooglePlace[] = [];
  let pageToken: string | undefined;
  const pages = Math.min(MAX_PAGES, Math.ceil(maxResults / PER_PAGE));
  const radiusMeters = coords ? clampRadiusMeters(radiusKm) : 0;

  for (let page = 0; page < pages; page++) {
    const body: Record<string, unknown> = {
      textQuery: query,
      languageCode: "pt-BR",
      pageSize: PER_PAGE,
      regionCode: "BR",
    };

    /*
     * locationBias.circle traz candidatos na regi?o; Haversine aplica o raio exato depois.
     * Em p?ginas seguintes, a API exige os mesmos filtros da 1Âª chamada (exceto pageToken/pageSize).
     */
    if (coords) {
      body.locationBias = {
        circle: {
          center: { latitude: coords.lat, longitude: coords.lng },
          radius: radiusMeters,
        },
      };
      /* DISTANCE + texto gen?rico Ã s vezes zera resultados; o c?rculo j? puxa a regi?o. */
    }

    if (pageToken) {
      body.pageToken = pageToken;
    }

    const res = await fetch(GOOGLE_PLACES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Google Places API error (${res.status}):`, errorBody);
      if (page === 0) throw new Error(`Google Places API: ${res.status}`);
      break;
    }

    const data: GoogleSearchResponse = await res.json();

    if (data.places) {
      allPlaces.push(...data.places);
    }

    if (page === 0 && data.places) {
      console.log(
        `[Google Places] Query: "${query}" | Coords: ${coords ? `${coords.lat},${coords.lng}` : "none"} | Raio: ${radiusMeters}m (${radiusKm}km pedido) | P?gina 1: ${data.places.length}`,
      );
      for (const p of data.places.slice(0, 3)) {
        console.log(`  -> ${p.displayName?.text} | ${p.formattedAddress}`);
      }
    }

    if (!data.nextPageToken || allPlaces.length >= maxResults) break;
    pageToken = data.nextPageToken;

    await new Promise((r) => setTimeout(r, 300));
  }

  let deduped = dedupePlacesById(allPlaces).filter((p) => !isNoisePlace(p));

  if (coords) {
    const inRadius = filterPlacesWithinRadius(deduped, coords, radiusMeters);
    deduped = [...inRadius].sort(
      (a, b) => getPlaceDistanceMeters(a, coords) - getPlaceDistanceMeters(b, coords),
    );
  }

  return { places: deduped.slice(0, maxResults), source: "google_places" };
}

async function fetchPlacesForSearch(
  apiKey: string,
  location: string,
  category: string | undefined,
  maxResults: number,
  coords: GeoCoords | null,
  radiusKm: number,
): Promise<{ places: GooglePlace[]; queries: string[] }> {
  if (category) {
    const query = buildQuery(location, category);
    const { places } = await fetchGooglePlaces(apiKey, query, maxResults, coords, radiusKm);
    return { places, queries: [query] };
  }

  const perQueryLimit = Math.min(40, Math.max(10, Math.ceil(maxResults / GENERIC_CATEGORY_QUERIES.length) * 2));
  const queryPlan = GENERIC_CATEGORY_QUERIES.map((seed) => buildQuery(location, seed));
  const settled = await Promise.all(
    queryPlan.map(async (query) => {
      try {
        const { places } = await fetchGooglePlaces(apiKey, query, perQueryLimit, coords, radiusKm);
        return places;
      } catch (error) {
        console.error(`[Buscar] Falha na query complementar "${query}"`, error);
        return [] as GooglePlace[];
      }
    }),
  );

  const merged = dedupePlacesById(settled.flat());
  return { places: merged.slice(0, maxResults), queries: queryPlan };
}

function dedupePlacesById(places: GooglePlace[]): GooglePlace[] {
  const seen = new Set<string>();
  return places.filter((p) => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function buildQuery(location: string, category?: string): string {
  const shouldIncludeLocation = !isBrazilianCep(location) && !parseCoordsInput(location);
  const base = category || GENERIC_TEXT_QUERY;

  return shouldIncludeLocation ? `${base} em ${location}` : base;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, category, radius, maxResults } = body;

    if (!location) {
      return NextResponse.json({ error: "Localiza??o ? obrigat?ria" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const limit = Math.min(200, Math.max(1, Number(maxResults) || 20));
    const radiusKm = Math.min(50, Math.max(1, Number(radius) || 5));

    if (!apiKey) {
      const leads = generateMockLeads(location, category || undefined);
      const businesses = leads.map((l) => l.business);
      const deduplicated = deduplicateBusinesses(businesses);

      const mockCap = Math.min(
        limit,
        Math.max(4, Math.min(deduplicated.length, Math.round(4 + radiusKm * 1.5))),
      );

      const mapped = deduplicated
        .map((biz) => {
          const original = leads.find((l) => l.business.id === biz.id);
          if (!original) return null;
          return {
            business: biz,
            signals: original.signals,
            score: calculateScore(biz, original.signals),
            pipeline: null,
          } as Lead;
        })
        .filter((l): l is Lead => l !== null)
        .sort((a, b) => b.score.score - a.score.score)
        .slice(0, mockCap);

      return NextResponse.json({
        leads: mapped,
        total: mapped.length,
        source: "mock",
        query: { location, category, radius },
      });
    }

    const coords = await geocodeLocation(location);
    console.log(`[Geocode] "${location}" -> ${coords ? `${coords.lat}, ${coords.lng}` : "n?o encontrado"}`);

    const { places, queries } = await fetchPlacesForSearch(
      apiKey,
      location,
      category || undefined,
      limit,
      coords,
      radiusKm,
    );
    const query = category ? queries[0] : `${queries.length} consultas combinadas`;

    const categoryLabel = category || "Comércio local";
    const leads = places.map((p) => ({
      ...mapGooglePlaceToLead(p, location, categoryLabel),
      distance_meters: coords ? getPlaceDistanceMeters(p, coords) : null,
    }));
    const isDistanceDrivenSearch =
      Boolean(coords) && (Boolean(isBrazilianCep(location)) || Boolean(parseCoordsInput(location)));

    const result = leads.sort((a, b) => {
      if (coords && isDistanceDrivenSearch) {
        const distanceA = a.distance_meters ?? Number.POSITIVE_INFINITY;
        const distanceB = b.distance_meters ?? Number.POSITIVE_INFINITY;

        if (distanceA !== distanceB) return distanceA - distanceB;
      }

      const locationScoreA = scoreLocationMatch(`${a.business.region} ${a.business.address}`, location);
      const locationScoreB = scoreLocationMatch(`${b.business.region} ${b.business.address}`, location);

      if (locationScoreB !== locationScoreA) return locationScoreB - locationScoreA;
      return b.score.score - a.score.score;
    });

    console.log(`[Buscar] Total: ${result.length} leads para "${query}"`);

    return NextResponse.json({
      leads: result,
      total: result.length,
      source: "google_places",
      query: { location, category, radius },
    });
  } catch (error) {
    console.error("Erro na busca:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao processar busca";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
