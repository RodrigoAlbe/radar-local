import { BusinessEntity } from "./types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, "").slice(-11);
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;

  const longer = na.length > nb.length ? na : nb;
  const shorter = na.length > nb.length ? nb : na;
  if (longer.length === 0) return 1;

  const dist = levenshtein(longer, shorter);
  return (longer.length - dist) / longer.length;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

export function deduplicateBusinesses(
  businesses: BusinessEntity[]
): BusinessEntity[] {
  const unique: BusinessEntity[] = [];

  for (const biz of businesses) {
    const isDuplicate = unique.some((existing) => {
      const phoneA = normalizePhone(biz.phone);
      const phoneB = normalizePhone(existing.phone);
      if (phoneA && phoneB && phoneA === phoneB) return true;

      const nameSim = similarity(biz.normalized_name, existing.normalized_name);
      if (nameSim > 0.85) {
        const addressSim = similarity(biz.address, existing.address);
        if (addressSim > 0.7) return true;
      }

      return false;
    });

    if (!isDuplicate) {
      unique.push(biz);
    }
  }

  return unique;
}
