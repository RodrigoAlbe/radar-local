import { Lead } from "./types";

function normalizeTerm(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const GENERIC_CATEGORY_TERMS = [
  "comercio local",
  "negocio local",
  "local business",
  "estabelecimento local",
];

const CATEGORY_INFERENCE_RULES: Array<{
  category: string;
  terms: string[];
}> = [
  {
    category: "Autoeletrica",
    terms: [
      "auto eletrica",
      "autoeletrica",
      "bateria",
      "alternador",
      "motor de partida",
      "injecao eletronica",
      "chicote",
    ],
  },
  {
    category: "Oficina mecanica",
    terms: [
      "oficina",
      "mecanica",
      "mecanico",
      "mecanic",
      "auto center",
      "alinhamento",
      "balanceamento",
      "freio",
      "suspensao",
      "troca de oleo",
      "escapamento",
    ],
  },
  {
    category: "Assistencia tecnica",
    terms: [
      "assistencia tecnica",
      "conserto",
      "reparo",
      "eletronica",
      "celular",
      "iphone",
      "notebook",
      "smartphone",
      "computador",
      "acessorios",
    ],
  },
  {
    category: "Pet shop",
    terms: ["pet", "veterin", "cao", "cachorro", "gato", "banho e tosa"],
  },
  {
    category: "Clinica veterinaria",
    terms: ["veterinaria", "vet", "clinica veterin"],
  },
  {
    category: "Estetica",
    terms: ["estetica", "harmonizacao", "depilacao", "lash", "spa", "beauty"],
  },
  {
    category: "Salao de beleza",
    terms: ["hair", "cabelo", "cabelere", "salao", "beleza", "escova", "manicure"],
  },
  {
    category: "Barbearia",
    terms: ["barbearia", "barber", "barba"],
  },
  {
    category: "Restaurante",
    terms: ["restaurante", "grill", "bistr", "almoco", "jantar"],
  },
  {
    category: "Lanchonete",
    terms: ["lanchonete", "hamburg", "burger", "acai", "lanche"],
  },
  {
    category: "Padaria",
    terms: ["padaria", "bakery", "paes", "confeitaria"],
  },
  {
    category: "Clinica odontologica",
    terms: ["odont", "dent", "ortho", "implante"],
  },
  {
    category: "Advogado",
    terms: ["advog", "juridico", "oab", "direito", "escritorio juridico"],
  },
  {
    category: "Academia",
    terms: ["academia", "fitness", "gym", "pilates", "crossfit"],
  },
  {
    category: "Loja de roupas",
    terms: ["moda", "roupa", "boutique", "vestuario", "closet"],
  },
  {
    category: "Lavanderia",
    terms: ["lavanderia", "lavagem", "passadoria"],
  },
  {
    category: "Papelaria",
    terms: ["papelaria", "escolar", "caderno"],
  },
  {
    category: "Floricultura",
    terms: ["flor", "flores", "garden", "jardim"],
  },
  {
    category: "Imobiliaria",
    terms: ["imobiliaria", "imoveis", "corretora", "real estate"],
  },
];

export function isGenericLocalCategory(category: string | null | undefined) {
  const normalized = normalizeTerm(category);
  return GENERIC_CATEGORY_TERMS.some((term) => normalized.includes(term));
}

export function inferLeadCategory(lead: Lead): string {
  const explicitCategory = lead.business.category?.trim() || "Comercio local";
  if (!isGenericLocalCategory(explicitCategory)) {
    return explicitCategory;
  }

  const haystack = normalizeTerm(
    [
      lead.business.normalized_name,
      lead.business.category,
      lead.signals.website_url,
      lead.signals.instagram_url,
      lead.signals.facebook_url,
      lead.signals.linktree_url,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const inferredRule = CATEGORY_INFERENCE_RULES.find((rule) =>
    rule.terms.some((term) => haystack.includes(term)),
  );

  return inferredRule?.category ?? explicitCategory;
}
