import { Lead } from "./types";

export type NicheKey =
  | "dentista"
  | "estetica"
  | "pet"
  | "advogado"
  | "oficina"
  | "imobiliaria"
  | "generico";

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function inferNicheFromText(
  category: string | null | undefined,
  name?: string | null,
  extra?: Array<string | null | undefined>,
): NicheKey {
  const haystack = normalize(
    [category, name, ...(extra ?? [])].filter(Boolean).join(" "),
  );

  if (
    haystack.includes("odont") ||
    haystack.includes("dent") ||
    haystack.includes("implante") ||
    haystack.includes("ortho")
  ) {
    return "dentista";
  }

  if (
    haystack.includes("estetic") ||
    haystack.includes("harmon") ||
    haystack.includes("depil") ||
    haystack.includes("lash") ||
    haystack.includes("beauty") ||
    haystack.includes("spa")
  ) {
    return "estetica";
  }

  if (
    haystack.includes("pet") ||
    haystack.includes("veterin") ||
    haystack.includes("cao") ||
    haystack.includes("cachorro") ||
    haystack.includes("gato")
  ) {
    return "pet";
  }

  if (
    haystack.includes("advog") ||
    haystack.includes("jurid") ||
    haystack.includes("oab")
  ) {
    return "advogado";
  }

  if (
    haystack.includes("oficina") ||
    haystack.includes("mecanic") ||
    haystack.includes("auto eletr") ||
    haystack.includes("autoeletr") ||
    haystack.includes("assistencia tecnica") ||
    haystack.includes("conserto automotivo")
  ) {
    return "oficina";
  }

  if (
    haystack.includes("imobili") ||
    haystack.includes("imovei") ||
    haystack.includes("corretor") ||
    haystack.includes("real estate")
  ) {
    return "imobiliaria";
  }

  return "generico";
}

export function inferNicheFromLead(lead: Lead): NicheKey {
  return inferNicheFromText(lead.business.category, lead.business.normalized_name, [
    lead.signals.website_url,
    lead.signals.instagram_url,
    lead.signals.facebook_url,
    lead.signals.linktree_url,
  ]);
}

export function getNicheMeta(niche: NicheKey) {
  switch (niche) {
    case "dentista":
      return {
        key: niche,
        label: "Dentista",
        templateCategory: "Clinica odontologica",
        ticketBand: "alto",
        operationBias: "agenda",
      } as const;
    case "estetica":
      return {
        key: niche,
        label: "Estetica",
        templateCategory: "Estetica",
        ticketBand: "alto",
        operationBias: "agenda",
      } as const;
    case "pet":
      return {
        key: niche,
        label: "Pet shop / Veterinaria",
        templateCategory: "Pet shop",
        ticketBand: "medio",
        operationBias: "confianca",
      } as const;
    case "advogado":
      return {
        key: niche,
        label: "Advogado",
        templateCategory: "Advogado",
        ticketBand: "alto",
        operationBias: "credibilidade",
      } as const;
    case "oficina":
      return {
        key: niche,
        label: "Oficina / Assistencia",
        templateCategory: "Oficina mecanica",
        ticketBand: "medio",
        operationBias: "urgencia",
      } as const;
    case "imobiliaria":
      return {
        key: niche,
        label: "Imobiliaria",
        templateCategory: "Imobiliaria",
        ticketBand: "alto",
        operationBias: "credibilidade",
      } as const;
    default:
      return {
        key: niche,
        label: "Negocio local",
        templateCategory: "Comercio local",
        ticketBand: "medio",
        operationBias: "presenca",
      } as const;
  }
}
