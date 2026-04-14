import {
  BusinessEntity,
  DigitalSignals,
  DigitalPresenceStatus,
  Lead,
} from "./types";
import { calculateScore } from "./scoring";

const MOCK_BUSINESSES: Array<{
  name: string;
  category: string;
  address: string;
  phone: string | null;
  presence: DigitalPresenceStatus;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  whatsapp: boolean;
  reviews: number;
  rating: number | null;
  brand_color?: string;
}> = [
  {
    name: "Oficina do Zé Auto Center",
    category: "Oficina mecânica",
    address: "Rua das Palmeiras, 234",
    phone: "(11) 99876-5432",
    presence: "sem_site_detectado",
    website: null,
    instagram: null,
    facebook: null,
    whatsapp: true,
    reviews: 23,
    rating: 4.2,
  },
  {
    name: "Auto Elétrica Raio",
    category: "Autoelétrica",
    address: "Av. Brasil, 1890",
    phone: "(11) 3456-7890",
    presence: "sem_site_detectado",
    website: null,
    instagram: "@autoeletricaraio",
    facebook: null,
    whatsapp: true,
    reviews: 45,
    rating: 4.5,
  },
  {
    name: "TechFix Assistência",
    category: "Assistência técnica",
    address: "Rua XV de Novembro, 456",
    phone: "(11) 98765-4321",
    presence: "so_redes_sociais",
    website: null,
    instagram: "@techfix_assist",
    facebook: "fb.com/techfix",
    whatsapp: true,
    reviews: 67,
    rating: 4.7,
  },
  {
    name: "Vidraçaria Cristal",
    category: "Vidraçaria",
    address: "Rua dos Vidros, 78",
    phone: "(11) 3333-4444",
    presence: "sem_site_detectado",
    website: null,
    instagram: null,
    facebook: null,
    whatsapp: false,
    reviews: 12,
    rating: 3.8,
  },
  {
    name: "Serralheria Forte",
    category: "Serralheria",
    address: "Rua do Aço, 567",
    phone: "(11) 99111-2222",
    presence: "sem_site_detectado",
    website: null,
    instagram: "@serralheriaforte",
    facebook: null,
    whatsapp: true,
    reviews: 34,
    rating: 4.1,
  },
  {
    name: "Marmoraria Elegance",
    category: "Marmoraria",
    address: "Av. dos Mármores, 890",
    phone: "(11) 3555-6666",
    presence: "so_redes_sociais",
    website: null,
    instagram: "@marmorariaelegance",
    facebook: "fb.com/elegancemarmore",
    whatsapp: true,
    reviews: 8,
    rating: 4.0,
    brand_color: "#8B4513",
  },
  {
    name: "DedTech Dedetização",
    category: "Dedetização",
    address: "Rua Limpa, 123",
    phone: "(11) 98888-7777",
    presence: "sem_site_detectado",
    website: null,
    instagram: null,
    facebook: null,
    whatsapp: true,
    reviews: 56,
    rating: 4.6,
  },
  {
    name: "Pet Amigo",
    category: "Pet shop",
    address: "Rua dos Animais, 456",
    phone: "(11) 3222-1111",
    presence: "so_redes_sociais",
    website: null,
    instagram: "@petamigo_sp",
    facebook: "fb.com/petamigo",
    whatsapp: true,
    reviews: 89,
    rating: 4.8,
    brand_color: "#FF6B35",
  },
  {
    name: "Restaurante Sabor da Terra",
    category: "Restaurante",
    address: "Av. Central, 789",
    phone: "(11) 3777-8888",
    presence: "sem_site_detectado",
    website: null,
    instagram: "@sabordaterra_rest",
    facebook: null,
    whatsapp: true,
    reviews: 120,
    rating: 4.3,
  },
  {
    name: "Lanchonete do Bairro",
    category: "Lanchonete",
    address: "Rua do Comércio, 45",
    phone: "(11) 99444-5555",
    presence: "sem_site_detectado",
    website: null,
    instagram: null,
    facebook: null,
    whatsapp: false,
    reviews: 5,
    rating: 3.5,
  },
  {
    name: "Padaria Pão Quente",
    category: "Padaria",
    address: "Rua da Farinha, 100",
    phone: "(11) 3111-0000",
    presence: "site_proprio",
    website: "https://padariapaoquente.com.br",
    instagram: "@paoquente_padaria",
    facebook: "fb.com/paoquente",
    whatsapp: true,
    reviews: 200,
    rating: 4.9,
  },
  {
    name: "Barbearia Corte Real",
    category: "Barbearia",
    address: "Rua dos Cortes, 222",
    phone: "(11) 98333-4444",
    presence: "so_redes_sociais",
    website: null,
    instagram: "@cortereal_barber",
    facebook: null,
    whatsapp: true,
    reviews: 150,
    rating: 4.7,
    brand_color: "#1a1a2e",
  },
  {
    name: "Smart Fit Centro",
    category: "Academia",
    address: "Av. Paulista, 1000",
    phone: "(11) 3000-0000",
    presence: "site_proprio",
    website: "https://smartfit.com.br",
    instagram: "@smartfit",
    facebook: "fb.com/smartfit",
    whatsapp: false,
    reviews: 500,
    rating: 4.1,
  },
  {
    name: "Lava Rápido Brilho",
    category: "Limpeza",
    address: "Rua das Águas, 333",
    phone: "(11) 99222-3333",
    presence: "sem_site_detectado",
    website: null,
    instagram: null,
    facebook: null,
    whatsapp: true,
    reviews: 18,
    rating: 4.0,
  },
  {
    name: "Chaveiro 24h Segurança Total",
    category: "Chaveiro",
    address: "Rua das Chaves, 50",
    phone: "(11) 99000-1111",
    presence: "sem_site_detectado",
    website: null,
    instagram: null,
    facebook: null,
    whatsapp: true,
    reviews: 30,
    rating: 4.4,
  },
  {
    name: "Elétrica e Hidráulica São Jorge",
    category: "Elétrica e hidráulica",
    address: "Rua dos Fios, 789",
    phone: "(11) 3444-5555",
    presence: "sem_site_detectado",
    website: null,
    instagram: null,
    facebook: null,
    whatsapp: false,
    reviews: 7,
    rating: 3.9,
  },
  {
    name: "Floricultura Jardim Encantado",
    category: "Floricultura",
    address: "Rua das Flores, 100",
    phone: "(11) 98555-6666",
    presence: "so_redes_sociais",
    website: null,
    instagram: "@jardimencantado_flores",
    facebook: "fb.com/jardimencantado",
    whatsapp: true,
    reviews: 42,
    rating: 4.6,
    brand_color: "#2E7D32",
  },
  {
    name: "Ótica Visão Clara",
    category: "Ótica",
    address: "Rua dos Óculos, 200",
    phone: "(11) 3666-7777",
    presence: "site_proprio",
    website: "https://visaoclara.com.br",
    instagram: "@visaoclara",
    facebook: null,
    whatsapp: true,
    reviews: 95,
    rating: 4.5,
  },
  {
    name: "Salão Beleza Pura",
    category: "Salão de beleza",
    address: "Rua da Vaidade, 150",
    phone: "(11) 99777-8888",
    presence: "so_redes_sociais",
    website: null,
    instagram: "@belezapura_salao",
    facebook: "fb.com/belezapura",
    whatsapp: true,
    reviews: 180,
    rating: 4.8,
    brand_color: "#C2185B",
  },
  {
    name: "Estúdio Ink Tattoo",
    category: "Estúdio de tatuagem",
    address: "Rua Alternativa, 77",
    phone: "(11) 98111-2222",
    presence: "so_redes_sociais",
    website: null,
    instagram: "@inktattoo_studio",
    facebook: null,
    whatsapp: true,
    reviews: 210,
    rating: 4.9,
  },
];

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `lead_${idCounter.toString().padStart(4, "0")}`;
}

export function generateMockLeads(
  region: string,
  category?: string
): Lead[] {
  idCounter = 0;

  const filtered = category
    ? MOCK_BUSINESSES.filter(
        (b) => b.category.toLowerCase() === category.toLowerCase()
      )
    : MOCK_BUSINESSES;

  const businesses = (filtered.length > 0 ? filtered : MOCK_BUSINESSES).map(
    (b) => {
      const id = generateId();
      return { ...b, id, region };
    }
  );

  return businesses.map((b) => {
    const business: BusinessEntity = {
      id: b.id,
      normalized_name: b.name,
      category: b.category,
      address: `${b.address} - ${region}`,
      region,
      phone: b.phone,
      lat: null,
      lng: null,
      source_refs: ["mock"],
      created_at: new Date().toISOString(),
    };

    const signals: DigitalSignals = {
      business_id: b.id,
      has_website: b.presence === "site_proprio",
      has_social_only: b.presence === "so_redes_sociais",
      website_url: b.website,
      instagram_url: b.instagram,
      facebook_url: b.facebook,
      whatsapp_detected: b.whatsapp,
      linktree_url: null,
      google_maps_url: null,
      review_count: b.reviews,
      average_rating: b.rating,
      confidence: 0.8,
      presence_status: b.presence,
      brand_color: b.brand_color ?? null,
      checked_at: new Date().toISOString(),
    };

    const score = calculateScore(business, signals);

    return { business, signals, score, pipeline: null };
  });
}
