import {
  BusinessEntity,
  DigitalSignals,
  LeadScore,
  PriorityBand,
  ScoreReason,
} from "./types";
import { getNicheMeta, inferNicheFromText } from "./niche-market";

const FRANCHISE_KEYWORDS = [
  "mcdonald",
  "burger king",
  "subway",
  "starbucks",
  "habib",
  "cacau show",
  "o boticario",
  "boticario",
  "natura",
  "magazine luiza",
  "magalu",
  "casas bahia",
  "americanas",
  "renner",
  "riachuelo",
  "havan",
  "carrefour",
  "extra",
  "pao de acucar",
  "assai",
  "atacadao",
  "big",
  "smart fit",
  "cvc",
  "oticas carol",
  "chilli beans",
  "havaianas",
  "arezzo",
  "luiza barcelos",
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isFranchise(name: string): boolean {
  const lower = normalize(name);
  return FRANCHISE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function isDigitallyMature(signals: DigitalSignals): boolean {
  return (
    signals.has_website &&
    Boolean(signals.instagram_url) &&
    (signals.review_count ?? 0) > 80
  );
}

export function calculateScore(
  business: BusinessEntity,
  signals: DigitalSignals,
): LeadScore {
  const reasons: ScoreReason[] = [];
  let score = 35;

  const nicheMeta = getNicheMeta(
    inferNicheFromText(business.category, business.normalized_name, [
      signals.website_url,
      signals.instagram_url,
      signals.facebook_url,
      signals.linktree_url,
    ]),
  );

  const reviewCount = signals.review_count ?? 0;
  const rating = signals.average_rating ?? 0;
  const hasLiveSignals =
    reviewCount > 0 ||
    Boolean(signals.instagram_url) ||
    Boolean(signals.facebook_url) ||
    Boolean(signals.website_url);
  const canBeReached = Boolean(business.phone) || signals.whatsapp_detected;
  const hasClearImprovement =
    !signals.has_website ||
    signals.has_social_only ||
    (!signals.instagram_url && !signals.facebook_url) ||
    reviewCount < 10;

  if (!signals.has_website && signals.presence_status === "sem_site_detectado") {
    reasons.push({ label: "Sem pagina propria para converter demanda local", points: 18 });
    score += 18;
  }

  if (signals.has_social_only) {
    reasons.push({ label: "Depende mais das redes do que de um ativo proprio", points: 10 });
    score += 10;
  }

  if (business.phone) {
    reasons.push({ label: "Telefone visivel para abordagem", points: 10 });
    score += 10;
  } else {
    reasons.push({ label: "Contato direto nao encontrado", points: -12 });
    score -= 12;
  }

  if (signals.whatsapp_detected) {
    reasons.push({ label: "WhatsApp pronto para conversa", points: 14 });
    score += 14;
  }

  if (reviewCount >= 3 && reviewCount <= 120) {
    reasons.push({ label: "Reviews indicam operacao viva", points: 10 });
    score += 10;
  }

  if (rating >= 4.4 && reviewCount >= 3) {
    reasons.push({ label: "Boa reputacao local ajuda o fechamento", points: 6 });
    score += 6;
  }

  if (nicheMeta.ticketBand === "alto") {
    reasons.push({ label: "Nicho com ticket mais favoravel", points: 12 });
    score += 12;
  }

  if (nicheMeta.operationBias === "urgencia") {
    reasons.push({ label: "Servico com decisao mais rapida", points: 8 });
    score += 8;
  }

  if (hasLiveSignals && canBeReached) {
    reasons.push({ label: "Negocio aparenta estar ativo e abordavel agora", points: 8 });
    score += 8;
  }

  if (hasClearImprovement) {
    reasons.push({ label: "Existe melhoria clara para vender", points: 8 });
    score += 8;
  }

  if (isFranchise(business.normalized_name)) {
    reasons.push({ label: "Franquia ou rede menos aderente", points: -28 });
    score -= 28;
  }

  if (isDigitallyMature(signals)) {
    reasons.push({ label: "Presenca digital ja madura", points: -18 });
    score -= 18;
  }

  if (!hasLiveSignals) {
    reasons.push({ label: "Poucos sinais de operacao viva", points: -8 });
    score -= 8;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    business_id: business.id,
    score,
    score_reasons: reasons,
    priority_band: getPriorityBand(score),
    updated_at: new Date().toISOString(),
  };
}

export function getPriorityBand(score: number): PriorityBand {
  if (score >= 80) return "alta";
  if (score >= 60) return "media_alta";
  if (score >= 40) return "media";
  return "baixa";
}

export const PRIORITY_BAND_LABELS: Record<PriorityBand, string> = {
  alta: "Alta vendabilidade",
  media_alta: "Boa vendabilidade",
  media: "Media vendabilidade",
  baixa: "Baixa vendabilidade",
};

export const PRIORITY_BAND_COLORS: Record<PriorityBand, string> = {
  alta: "bg-red-100 text-red-700 border-red-200",
  media_alta: "bg-orange-100 text-orange-700 border-orange-200",
  media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  baixa: "bg-gray-100 text-gray-500 border-gray-200",
};
