import { Lead } from "./types";
import { getNicheMeta, inferNicheFromLead } from "./niche-market";

export type SalesUrgency = "alta" | "media" | "baixa";

export interface LeadSalesInsight {
  niche: ReturnType<typeof inferNicheFromLead>;
  nicheLabel: string;
  mainProblem: string;
  suggestedOffer: string;
  suggestedPriceRange: string;
  urgency: SalesUrgency;
  urgencyLabel: string;
  whyNow: string;
  nextStep: string;
  suggestedChannel: "whatsapp" | "instagram" | "email";
  recommendedMessage: string;
}

function hasStrongContact(lead: Lead): boolean {
  return Boolean(lead.business.phone || lead.signals.whatsapp_detected);
}

function hasVisibleActivity(lead: Lead): boolean {
  return (
    (lead.signals.review_count ?? 0) > 0 ||
    Boolean(lead.signals.instagram_url) ||
    Boolean(lead.signals.facebook_url) ||
    Boolean(lead.signals.website_url)
  );
}

function getMainProblem(lead: Lead): string {
  if (lead.signals.presence_status === "sem_site_detectado") {
    return "Sem pagina propria para converter a busca local em contato.";
  }

  if (lead.signals.has_social_only) {
    return "Dependencia excessiva das redes sociais para explicar a marca e captar atendimento.";
  }

  if (!lead.signals.whatsapp_detected && lead.business.phone) {
    return "Tem contato, mas o caminho para conversa rapida ainda esta pouco claro.";
  }

  if ((lead.signals.review_count ?? 0) > 0 && !lead.signals.website_url) {
    return "Ja existe procura visivel, mas a apresentacao comercial ainda pode capturar mais demanda.";
  }

  return "Ha espaco claro para melhorar apresentacao, oferta e conversao local.";
}

function getSuggestedOffer(lead: Lead): string {
  const niche = inferNicheFromLead(lead);

  if (lead.signals.presence_status === "sem_site_detectado") {
    if (lead.signals.whatsapp_detected || lead.business.phone) {
      return "Landing page com WhatsApp";
    }

    return "Site institucional simples";
  }

  if (lead.signals.has_social_only) {
    return "Melhoria de presenca digital local";
  }

  if (niche === "dentista" || niche === "advogado" || niche === "imobiliaria") {
    return "Site institucional simples";
  }

  return "Otimizacao de perfil e canais digitais";
}

function getSuggestedPriceRange(lead: Lead, offer: string): string {
  const niche = inferNicheFromLead(lead);
  const nicheMeta = getNicheMeta(niche);

  if (offer === "Landing page com WhatsApp") {
    return nicheMeta.ticketBand === "alto" ? "R$ 1.500 a R$ 3.500" : "R$ 900 a R$ 2.200";
  }

  if (offer === "Site institucional simples") {
    return nicheMeta.ticketBand === "alto" ? "R$ 3.000 a R$ 8.000" : "R$ 1.800 a R$ 4.500";
  }

  if (offer === "Melhoria de presenca digital local") {
    return "R$ 700 a R$ 2.000";
  }

  return "R$ 500 a R$ 1.500";
}

function getUrgency(lead: Lead): SalesUrgency {
  const niche = inferNicheFromLead(lead);
  const nicheMeta = getNicheMeta(niche);

  if (
    nicheMeta.operationBias === "urgencia" &&
    hasStrongContact(lead) &&
    !lead.signals.has_website
  ) {
    return "alta";
  }

  if (
    hasStrongContact(lead) &&
    hasVisibleActivity(lead) &&
    (lead.signals.presence_status === "sem_site_detectado" ||
      lead.signals.has_social_only)
  ) {
    return "alta";
  }

  if (hasStrongContact(lead) || hasVisibleActivity(lead)) {
    return "media";
  }

  return "baixa";
}

function getUrgencyLabel(urgency: SalesUrgency): string {
  switch (urgency) {
    case "alta":
      return "Abordar hoje";
    case "media":
      return "Abordar nesta rodada";
    default:
      return "Abordagem secundaria";
  }
}

function getSuggestedChannel(lead: Lead): "whatsapp" | "instagram" | "email" {
  if (lead.signals.whatsapp_detected && lead.business.phone) {
    return "whatsapp";
  }

  if (lead.signals.instagram_url) {
    return "instagram";
  }

  return "email";
}

function getWhyNow(lead: Lead, offer: string): string {
  if (lead.signals.review_count > 0 && !lead.signals.has_website) {
    return "Ja existe procura ativa no Google, mas a empresa ainda nao capitaliza isso com uma pagina propria.";
  }

  if (lead.signals.has_social_only) {
    return "O negocio ja se expoe online, mas ainda depende de canais que nao organizam a decisao de compra.";
  }

  if (offer === "Otimizacao de perfil e canais digitais") {
    return "Pequenos ajustes podem transformar mais visitas e contatos em conversas reais.";
  }

  return "Existe melhoria clara e facil de explicar para o cliente logo na primeira abordagem.";
}

function getNextStep(lead: Lead, offer: string): string {
  if (offer === "Landing page com WhatsApp") {
    return "Apresentar demo, validar servico principal e puxar conversa para publicar a pagina.";
  }

  if (offer === "Site institucional simples") {
    return "Abrir conversa com foco em credibilidade, prova social e centralizacao da presenca online.";
  }

  if (lead.signals.instagram_url) {
    return "Abordar pelo Instagram e levar a conversa para WhatsApp ou proposta curta.";
  }

  return "Usar mensagem consultiva e marcar o proximo follow-up ainda no primeiro contato.";
}

function buildRecommendedMessage(lead: Lead, offer: string): string {
  const nicheMeta = getNicheMeta(inferNicheFromLead(lead));
  const firstName = lead.business.normalized_name;

  if (offer === "Landing page com WhatsApp") {
    return `Montei uma ideia de pagina para a ${firstName} com foco em gerar mais conversas no WhatsApp e passar mais confianca para quem pesquisa ${nicheMeta.label.toLowerCase()} na regiao.`;
  }

  if (offer === "Site institucional simples") {
    return `Vi uma oportunidade de apresentar a ${firstName} de forma mais profissional online, com um site direto ao ponto para gerar confianca e facilitar o contato.`;
  }

  if (offer === "Melhoria de presenca digital local") {
    return `Percebi que a ${firstName} ja tem sinais de presenca online, mas ainda existe espaco claro para organizar melhor os canais e converter mais procura local em atendimento.`;
  }

  return `Analisei a presenca da ${firstName} e encontrei um jeito simples de melhorar visibilidade, contato e conversao local.`;
}

export function getLeadSalesInsight(lead: Lead): LeadSalesInsight {
  const niche = inferNicheFromLead(lead);
  const nicheMeta = getNicheMeta(niche);
  const suggestedOffer = getSuggestedOffer(lead);
  const urgency = getUrgency(lead);

  return {
    niche,
    nicheLabel: nicheMeta.label,
    mainProblem: getMainProblem(lead),
    suggestedOffer,
    suggestedPriceRange: getSuggestedPriceRange(lead, suggestedOffer),
    urgency,
    urgencyLabel: getUrgencyLabel(urgency),
    whyNow: getWhyNow(lead, suggestedOffer),
    nextStep: getNextStep(lead, suggestedOffer),
    suggestedChannel: getSuggestedChannel(lead),
    recommendedMessage: buildRecommendedMessage(lead, suggestedOffer),
  };
}
