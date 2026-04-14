export type PipelineStatus =
  | "novo"
  | "abordado"
  | "respondeu"
  | "negociando"
  | "proposta_enviada"
  | "convertido"
  | "sem_interesse";

export type DigitalPresenceStatus =
  | "site_proprio"
  | "so_redes_sociais"
  | "sem_site_detectado"
  | "indeterminado";

export type PriorityBand = "alta" | "media_alta" | "media" | "baixa";

export interface BusinessEntity {
  id: string;
  normalized_name: string;
  category: string;
  address: string;
  region: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  source_refs: string[];
  created_at: string;
}

export interface DigitalSignals {
  business_id: string;
  has_website: boolean;
  has_social_only: boolean;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  whatsapp_detected: boolean;
  linktree_url: string | null;
  google_maps_url: string | null;
  review_count: number;
  average_rating: number | null;
  confidence: number;
  presence_status: DigitalPresenceStatus;
  brand_color: string | null;
  checked_at: string;
}

export interface ScoreReason {
  label: string;
  points: number;
}

export interface LeadScore {
  business_id: string;
  score: number;
  score_reasons: ScoreReason[];
  priority_band: PriorityBand;
  updated_at: string;
}

export interface LeadPipeline {
  business_id: string;
  user_id: string;
  status: PipelineStatus;
  notes: string;
  proposed_value: number | null;
  next_followup: string | null;
  last_contact_at: string | null;
  created_at: string;
}

export interface Lead {
  business: BusinessEntity;
  signals: DigitalSignals;
  score: LeadScore;
  pipeline: LeadPipeline | null;
  distance_meters?: number | null;
}

export interface SearchParams {
  location: string;
  category: string;
  radius: number;
  maxResults: number;
  filters: SearchFilters;
}

export interface SearchFilters {
  semSite: boolean;
  soRedesSociais: boolean;
  comTelefone: boolean;
  comWhatsapp: boolean;
  minReviews: number;
  excluirFranquias: boolean;
}

export interface SearchJob {
  id: string;
  user_id: string;
  region: string;
  category: string;
  radius: number;
  status: "pending" | "processing" | "completed" | "failed";
  results_count: number;
  created_at: string;
}

export interface ApproachVariant {
  type: "curta" | "consultiva" | "whatsapp" | "instagram_dm" | "email";
  label: string;
  message: string;
}

export const CATEGORIES = [
  "Oficina mecânica",
  "Autoelétrica",
  "Assistência técnica",
  "Vidraçaria",
  "Serralheria",
  "Marmoraria",
  "Dedetização",
  "Limpeza",
  "Manutenção residencial",
  "Pet shop",
  "Restaurante",
  "Lanchonete",
  "Padaria",
  "Salão de beleza",
  "Barbearia",
  "Academia",
  "Clínica odontológica",
  "Clínica veterinária",
  "Lavanderia",
  "Papelaria",
  "Loja de roupas",
  "Loja de materiais de construção",
  "Floricultura",
  "Chaveiro",
  "Elétrica e hidráulica",
  "Contabilidade",
  "Imobiliária",
  "Escola de idiomas",
  "Estúdio de tatuagem",
  "Ótica",
] as const;

export const HIGH_PROPENSITY_CATEGORIES = [
  "Oficina mecânica",
  "Autoelétrica",
  "Assistência técnica",
  "Vidraçaria",
  "Serralheria",
  "Marmoraria",
  "Dedetização",
  "Limpeza",
  "Manutenção residencial",
  "Pet shop",
  "Restaurante",
  "Lanchonete",
];

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  novo: "Novo",
  abordado: "Abordado",
  respondeu: "Respondeu",
  negociando: "Negociando",
  proposta_enviada: "Proposta enviada",
  convertido: "Convertido",
  sem_interesse: "Sem interesse",
};

export const PIPELINE_COLORS: Record<PipelineStatus, string> = {
  novo: "bg-blue-100 text-blue-800",
  abordado: "bg-amber-100 text-amber-800",
  respondeu: "bg-purple-100 text-purple-800",
  negociando: "bg-indigo-100 text-indigo-800",
  proposta_enviada: "bg-cyan-100 text-cyan-800",
  convertido: "bg-green-100 text-green-800",
  sem_interesse: "bg-gray-100 text-gray-600",
};
