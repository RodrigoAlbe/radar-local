import { ApproachVariant, Lead } from "./types";
import { getLeadSalesInsight } from "./sales-intelligence";

const SENDER = {
  name: "Rodrigo",
  linkedin: "https://www.linkedin.com/in/rodrigo-albert/",
};

function getReviewLine(lead: Lead): string {
  const hasReviews = lead.signals.review_count > 0;
  const goodRating = (lead.signals.average_rating ?? 0) >= 4;

  if (hasReviews && goodRating) {
    return " Vi que a marca ja tem boa reputacao local, o que ajuda bastante na hora de converter novos contatos.";
  }

  if (hasReviews) {
    return " Vi que voces ja aparecem no Google, o que mostra procura real na regiao.";
  }

  return "";
}

export function generateApproaches(lead: Lead): ApproachVariant[] {
  const name = lead.business.normalized_name;
  const category = lead.business.category;
  const region = lead.business.region;
  const insight = getLeadSalesInsight(lead);
  const reviewLine = getReviewLine(lead);

  const intro = `Encontrei a ${name} pesquisando ${category} em ${region}.${reviewLine}`;
  const valueLine = `${insight.mainProblem} Minha sugestao inicial seria ${insight.suggestedOffer.toLowerCase()}, normalmente em uma faixa de ${insight.suggestedPriceRange}.`;
  const urgencyLine = `${insight.whyNow} ${insight.urgencyLabel}.`;

  return [
    {
      type: "whatsapp",
      label: "WhatsApp",
      message:
        `Ola! Tudo bem?\n\n` +
        `${intro}\n\n` +
        `${valueLine}\n\n` +
        `${urgencyLine}\n\n` +
        `Montei uma demo rapida pensando em gerar mais contato qualificado e facilitar a decisao de quem ja esta buscando esse tipo de servico na regiao.\n\n` +
        `{LINK_SITE_DEMO}\n\n` +
        `Se fizer sentido, te mostro em 2 minutos como isso pode virar uma pagina real para a ${name}.\n\n` +
        `- ${SENDER.name}`,
    },
    {
      type: "curta",
      label: "Curta",
      message:
        `Oi! Sou o ${SENDER.name}.\n\n` +
        `Analisei a presenca da ${name} e vi uma oportunidade clara: ${insight.mainProblem.toLowerCase()}\n\n` +
        `Minha oferta sugerida seria ${insight.suggestedOffer.toLowerCase()}, na faixa de ${insight.suggestedPriceRange}.\n\n` +
        `{LINK_SITE_DEMO}\n\n` +
        `Se quiser, te explico bem rapido por que isso tende a funcionar bem para ${category.toLowerCase()} da regiao.`,
    },
    {
      type: "consultiva",
      label: "Consultiva",
      message:
        `Ola! Me chamo ${SENDER.name}.\n\n` +
        `Pesquisando ${category} em ${region}, encontrei a ${name}.${reviewLine}\n\n` +
        `${insight.mainProblem}\n\n` +
        `Minha leitura comercial e que a melhor porta de entrada seria ${insight.suggestedOffer.toLowerCase()}, porque ${insight.whyNow.toLowerCase()}\n\n` +
        `Montei uma demonstracao para ilustrar essa melhoria de forma concreta.\n\n` +
        `{LINK_SITE_DEMO}\n\n` +
        `Se fizer sentido, posso te mostrar os proximos passos e como isso poderia sair do demo para algo publicado de verdade.\n\n` +
        `Abraco,\n${SENDER.name}\n${SENDER.linkedin}`,
    },
    {
      type: "instagram_dm",
      label: "Instagram",
      message:
        `Oi! Sou o ${SENDER.name} e trabalho com paginas para negocios locais.\n\n` +
        `Vi uma oportunidade na ${name}: ${insight.mainProblem.toLowerCase()}\n\n` +
        `Montei uma demo com foco em ${insight.suggestedOffer.toLowerCase()} para ajudar a gerar mais contatos.\n\n` +
        `{LINK_SITE_DEMO}\n\n` +
        `Se quiser, te explico por aqui em 2 minutos a ideia e a faixa de investimento.`,
    },
    {
      type: "email",
      label: "E-mail",
      message:
        `Assunto: ideia para aumentar contatos da ${name}\n\n` +
        `Ola, tudo bem?\n\n` +
        `Sou o ${SENDER.name} e estive analisando a presenca digital de ${category.toLowerCase()} em ${region}. Ao encontrar a ${name}, vi uma oportunidade comercial bem objetiva: ${insight.mainProblem.toLowerCase()}\n\n` +
        `Minha recomendacao inicial seria ${insight.suggestedOffer.toLowerCase()}, normalmente em uma faixa de ${insight.suggestedPriceRange}.\n\n` +
        `${insight.recommendedMessage}\n\n` +
        `{LINK_SITE_DEMO}\n\n` +
        `Se fizer sentido, posso te mostrar como transformar essa demo em uma pagina real e qual seria o melhor proximo passo.\n\n` +
        `Abraco,\n${SENDER.name}`,
    },
  ];
}
