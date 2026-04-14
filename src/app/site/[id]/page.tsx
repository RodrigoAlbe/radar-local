"use client";

/* eslint-disable @next/next/no-img-element */

import { CSSProperties, use, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Lead } from "@/lib/types";
import {
  generateSiteContent,
  getResolvedColor,
  getSiteVisualTheme,
  SiteContent,
  SiteSourceLink,
  SiteVisualTheme,
} from "@/lib/site-generator";
import { inferLeadCategory } from "@/lib/category-inference";
import { ensureLeadSitePublished, fetchPublishedLead } from "@/lib/site-share";
import {
  Phone,
  MapPin,
  MessageCircle,
  Star,
  ChevronUp,
  ExternalLink,
  Camera,
  Share2,
  ArrowRight,
  Shield,
  CheckCircle2,
  Quote,
  Search,
  TrendingUp,
  Smartphone,
  Globe,
  Link2,
} from "lucide-react";
import CategoryLogo from "@/components/CategoryLogo";

const STORAGE_KEY = "radar_local_state";

function getLeadFromStorage(id: string): Lead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    return state.leads?.find((l: Lead) => l.business.id === id) ?? null;
  } catch {
    return null;
  }
}

function isPrivatePreviewHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "localhost" || normalized === "127.0.0.1") return true;
  if (normalized.startsWith("192.168.")) return true;
  if (normalized.startsWith("10.")) return true;

  const match = normalized.match(/^172\.(\d{1,2})\./);
  if (match) {
    const secondOctet = Number.parseInt(match[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  return false;
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(36px)",
      transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function getSourceLinkMeta(kind: SiteSourceLink["kind"]) {
  switch (kind) {
    case "website":
      return {
        icon: <Globe className="w-4 h-4" />,
        className:
          "bg-white text-gray-900 shadow-lg shadow-black/10 hover:bg-white/90",
      };
    case "instagram":
      return {
        icon: <Camera className="w-4 h-4" />,
        className:
          "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:scale-105",
      };
    case "facebook":
      return {
        icon: <Share2 className="w-4 h-4" />,
        className: "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105",
      };
    case "linktree":
      return {
        icon: <Link2 className="w-4 h-4" />,
        className: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105",
      };
    default:
      return {
        icon: <MapPin className="w-4 h-4" />,
        className: "glass text-white hover:bg-white/[0.08]",
      };
  }
}

type BrandMedia = {
  heroImageUrl: string | null;
  logoImageUrl: string | null;
  faviconUrl: string | null;
  source: string | null;
};

function normalizeBrandMedia(
  value: Partial<BrandMedia> | null | undefined,
): BrandMedia | null {
  const normalized: BrandMedia = {
    heroImageUrl:
      typeof value?.heroImageUrl === "string" ? value.heroImageUrl : null,
    logoImageUrl:
      typeof value?.logoImageUrl === "string" ? value.logoImageUrl : null,
    faviconUrl:
      typeof value?.faviconUrl === "string" ? value.faviconUrl : null,
    source: typeof value?.source === "string" ? value.source : null,
  };

  if (
    !normalized.heroImageUrl &&
    !normalized.logoImageUrl &&
    !normalized.faviconUrl
  ) {
    return null;
  }

  return normalized;
}

function getBrandAvatarUrl(brandMedia: BrandMedia | null): string | null {
  return brandMedia?.logoImageUrl ?? brandMedia?.faviconUrl ?? null;
}

function normalizeCategory(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getCategoryHeroMeta(category: string) {
  const normalized = normalizeCategory(category);
  const rules: Array<{
    match: string[];
    badge: string;
    title: string;
    detail: string;
    accent: string;
    scene: string;
  }> = [
    { match: ["pet", "veterin"], badge: "PET CARE", title: "Banho, cuidado e carinho", detail: "Espaco preparado para tutores e pets", accent: "#7da66f", scene: "pet" },
    { match: ["restaurante", "lanchonete", "padaria"], badge: "SABOR", title: "Atendimento e vitrine convidativa", detail: "Cardapio, balcao e experiencia local", accent: "#d79b54", scene: "food" },
    { match: ["barbearia", "salao", "beleza", "estetica", "harmonizacao"], badge: "BELEZA", title: "Cuidado pessoal com estilo", detail: "Agenda, ambiente e atendimento proximos", accent: "#b97d8f", scene: "beauty" },
    { match: ["academia", "fitness"], badge: "MOVIMENTO", title: "Rotina ativa e acolhedora", detail: "Treino, acompanhamento e constancia", accent: "#6f95b8", scene: "fitness" },
    { match: ["odontolog", "clinica"], badge: "SAUDE", title: "Confianca logo na chegada", detail: "Estrutura clara, segura e profissional", accent: "#6ca7a0", scene: "health" },
    { match: ["mecanica", "autoeletrica", "oficina", "assistencia tecnica", "conserto"], badge: "OFICINA", title: "Servico agil e de bairro", detail: "Diagnostico, manutencao e contato rapido", accent: "#7d8892", scene: "service" },
    { match: ["advogado", "juridico", "direito"], badge: "JURIDICO", title: "Confianca desde o primeiro contato", detail: "Atendimento claro, profissional e objetivo", accent: "#8f7a63", scene: "service" },
    { match: ["imobiliaria"], badge: "IMOVEIS", title: "Atendimento consultivo", detail: "Anuncios, visitas e relacionamento local", accent: "#9c8a67", scene: "home" },
    { match: ["floricultura"], badge: "FLORES", title: "Delicadeza e presenca local", detail: "Arranjos, presentes e atendimento humano", accent: "#a47a93", scene: "flowers" },
    { match: ["lavanderia"], badge: "CUIDADO", title: "Praticidade no dia a dia", detail: "Coleta, entrega e organizacao do servico", accent: "#7aa2b8", scene: "clean" },
    { match: ["papelaria", "loja de roupas", "loja"], badge: "VITRINE", title: "Produtos e atendimento em destaque", detail: "Colecoes, promocoes e presenca de loja real", accent: "#c28c5d", scene: "retail" },
    { match: ["idiomas", "escola"], badge: "APRENDIZADO", title: "Turmas e atendimento acolhedor", detail: "Matriculas, horarios e presenca local", accent: "#7d8dc6", scene: "school" },
  ];

  const rule = rules.find((item) => item.match.some((token) => normalized.includes(token)));
  return (
    rule ?? {
      badge: "NEGOCIO LOCAL",
      title: "Presenca profissional na regiao",
      detail: "Contato, vitrine e confianca na mesma pagina",
      accent: "#9f8c78",
      scene: "default",
    }
  );
}

function getCategoryHeroArtPath(category: string) {
  const meta = getCategoryHeroMeta(category);
  switch (meta.scene) {
    case "service":
      return "/hero-arts/service.png";
    case "pet":
      return "/hero-arts/pet.png";
    case "food":
      return "/hero-arts/food.png";
    case "beauty":
      return "/hero-arts/beauty.png";
    case "health":
      return "/hero-arts/health.png";
    case "home":
      return "/hero-arts/retail.png";
    case "retail":
      return "/hero-arts/retail.png";
    default:
      return "/hero-arts/retail.png";
  }
}

function BrandAssetImage({
  src,
  alt,
  className = "",
  style,
}: {
  src: string | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
    />
  );
}

type HeroVisualProps = {
  business: Lead["business"];
  signals: Lead["signals"];
  content: SiteContent;
  colors: ReturnType<typeof getResolvedColor>;
  visualTheme: SiteVisualTheme;
  phone: string;
  brandMedia: BrandMedia | null;
};

function BrandHeroPreview({
  business,
  signals,
  content,
  colors,
  phone,
  brandMedia,
}: HeroVisualProps) {
  const websiteLink =
    content.sourceLinks.find((link) => link.kind === "website") ??
    content.sourceLinks[0] ??
    null;
  const avatarUrl = getBrandAvatarUrl(brandMedia);
  const heroImageUrl = brandMedia?.heroImageUrl ?? null;

  return (
    <div className="relative w-[320px] sm:w-[430px]">
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 w-[260px] sm:w-[340px] h-[220px] sm:h-[280px] blur-[80px] opacity-35"
        style={{ backgroundColor: colors.primary }}
      />

      <div className="glass-strong theme-panel overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-[11px] text-white/35 truncate">
            {websiteLink?.value ?? business.normalized_name}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                {avatarUrl ? (
                  <BrandAssetImage
                    src={avatarUrl}
                    alt={`Marca de ${business.normalized_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CategoryLogo
                    category={business.category}
                    businessName={business.normalized_name}
                    primaryColor={colors.primary}
                    size={48}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-base truncate">
                  {business.normalized_name}
                </p>
                <p className="text-white/35 text-xs truncate">
                  {content.heroSubtitle}
                </p>
              </div>
            </div>
            {websiteLink && (
              <span
                className="px-3 py-1 rounded-full text-[10px] font-semibold text-white whitespace-nowrap"
                style={{ backgroundColor: colors.primary }}
              >
                Site oficial
              </span>
            )}
          </div>

          {(heroImageUrl || avatarUrl) && (
            <div className="relative h-40 sm:h-48 rounded-[26px] overflow-hidden border border-white/[0.08]">
              {heroImageUrl ? (
                <>
                  <BrandAssetImage
                    src={heroImageUrl}
                    alt={`Imagem da marca ${business.normalized_name}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                </>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(140deg, ${colors.primary}32 0%, rgba(255,255,255,.04) 100%)` }}
                />
              )}

              {!heroImageUrl && avatarUrl && (
                <div className="absolute inset-0 flex items-center justify-between gap-4 p-5 sm:p-6">
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.18em] uppercase text-white/45 font-semibold">
                      Assinatura visual
                    </p>
                    <p className="text-white font-semibold text-base mt-2">
                      {business.normalized_name}
                    </p>
                    <p className="text-white/45 text-xs mt-2 leading-relaxed max-w-[180px]">
                      {content.tagline}
                    </p>
                  </div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] overflow-hidden bg-white shadow-2xl shadow-black/20 flex items-center justify-center flex-shrink-0 p-3">
                    <BrandAssetImage
                      src={avatarUrl}
                      alt={`Marca de ${business.normalized_name}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.18em] uppercase text-white/45 font-semibold">
                    {heroImageUrl ? "Visual da marca" : "Presenca digital"}
                  </p>
                  <p className="text-white font-semibold text-sm truncate">
                    {content.heroSubtitle}
                  </p>
                </div>
                {brandMedia?.source && (
                  <span className="glass rounded-full px-3 py-1 text-[10px] text-white/65 whitespace-nowrap">
                    {brandMedia.source}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="glass theme-card p-4 space-y-3">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/35">
                Apresentacao
              </p>
              <p className="text-white font-semibold text-sm leading-snug">
                {content.tagline}
              </p>
              <p className="text-white/35 text-xs leading-relaxed">
                {content.aboutText.slice(0, 120)}...
              </p>
            </div>

            <div className="glass theme-card p-4 space-y-3">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/35">
                Destaques
              </p>
              <div className="space-y-2">
                {content.aboutHighlights.slice(0, 3).map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-xs text-white/65"
                  >
                    <CheckCircle2
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: colors.primary }}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {content.sourceLinks.slice(0, 3).map((link) => (
              <div
                key={`${link.kind}-${link.href}`}
                className="glass rounded-full px-3 py-2 text-[11px] text-white/60"
              >
                {link.label}: {link.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {signals.review_count > 0 && signals.average_rating && (
        <div className="absolute -left-5 sm:-left-10 top-14 glass-strong rounded-2xl theme-card px-4 py-3 float-slow z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-sm">⭐</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                {signals.average_rating.toFixed(1)}
              </p>
              <p className="text-white/30 text-[10px]">
                {signals.review_count} reviews
              </p>
            </div>
          </div>
        </div>
      )}

      {phone && (
        <div className="absolute -right-4 sm:-right-10 bottom-10 glass-strong rounded-2xl theme-card px-4 py-3 float-alt z-30">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">Contato direto</p>
              <p className="text-white/30 text-[10px]">{phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialHeroPreview({
  business,
  content,
  colors,
  brandMedia,
}: HeroVisualProps) {
  const socialLinks = content.sourceLinks.filter((link) =>
    ["instagram", "facebook", "linktree"].includes(link.kind)
  );
  const featured = socialLinks[0] ?? content.sourceLinks[0] ?? null;
  const avatarUrl = getBrandAvatarUrl(brandMedia);
  const heroImageUrl = brandMedia?.heroImageUrl ?? null;

  return (
    <div className="relative w-[320px] sm:w-[390px]">
      <div
        className="absolute top-10 right-6 w-[210px] h-[210px] rounded-full blur-[90px] opacity-35"
        style={{ backgroundColor: colors.primary }}
      />

      <div className="space-y-4">
        <div
          className="glass-strong theme-panel p-5 sm:p-6 rotate-[-4deg] shadow-2xl shadow-black/35"
          style={{ transformOrigin: "bottom right" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-white/[0.06]"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, rgba(255,255,255,.15))` }}
              >
                {avatarUrl ? (
                  <BrandAssetImage
                    src={avatarUrl}
                    alt={`Perfil de ${business.normalized_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">
                  {featured?.value ?? business.normalized_name}
                </p>
                <p className="text-white/35 text-[11px] truncate">
                  Perfil em destaque
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.18em]">
              Social
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-[22px] overflow-hidden relative">
              {heroImageUrl ? (
                <>
                  <BrandAssetImage
                    src={heroImageUrl}
                    alt={`Imagem social da marca ${business.normalized_name}`}
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-white font-semibold text-sm">
                      {content.tagline}
                    </p>
                    <p className="text-white/50 text-xs mt-2 leading-relaxed">
                      {content.aboutText.slice(0, 92)}...
                    </p>
                  </div>
                </>
              ) : avatarUrl ? (
                <div
                  className="px-4 py-5 flex items-center gap-4"
                  style={{ background: `linear-gradient(160deg, ${colors.primary}28 0%, rgba(255,255,255,.05) 100%)` }}
                >
                  <div className="w-16 h-16 rounded-[22px] overflow-hidden bg-white shadow-xl shadow-black/20 flex items-center justify-center p-2.5 flex-shrink-0">
                    <BrandAssetImage
                      src={avatarUrl}
                      alt={`Marca de ${business.normalized_name}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm">
                      {content.tagline}
                    </p>
                    <p className="text-white/40 text-xs mt-2 leading-relaxed">
                      {content.aboutText.slice(0, 94)}...
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="px-4 py-5"
                  style={{ background: `linear-gradient(160deg, ${colors.primary}28 0%, rgba(255,255,255,.05) 100%)` }}
                >
                  <p className="text-white font-semibold text-sm">
                    {content.tagline}
                  </p>
                  <p className="text-white/40 text-xs mt-2 leading-relaxed">
                    {content.aboutText.slice(0, 110)}...
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {content.sourceBadges.slice(0, 3).map((badge, index) => (
                <div
                  key={`${badge}-${index}`}
                  className="glass rounded-2xl px-3 py-3 text-[11px] text-white/60 text-center leading-snug"
                >
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ml-6 glass theme-panel p-4 sm:p-5 rotate-[3deg] shadow-xl shadow-black/25">
          <div className="flex items-center justify-between gap-3">
            <p className="text-white font-semibold text-sm">Canais da marca</p>
            <span className="text-white/30 text-[11px]">Atualizado</span>
          </div>
          <div className="mt-3 space-y-2">
            {socialLinks.slice(0, 3).map((link) => (
              <div
                key={`${link.kind}-${link.href}`}
                className="flex items-center justify-between glass rounded-2xl px-3 py-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getSourceLinkMeta(link.kind).icon}
                  <div className="min-w-0">
                    <p className="text-white/75 text-xs font-semibold">
                      {link.label}
                    </p>
                    <p className="text-white/35 text-[11px] truncate">
                      {link.value}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustedHeroPreview({
  business,
  signals,
  content,
  colors,
  brandMedia,
}: HeroVisualProps) {
  const rating = signals.average_rating ?? 4.9;
  const reviewCount = signals.review_count || 12;
  const avatarUrl = getBrandAvatarUrl(brandMedia);

  return (
    <div className="relative w-[320px] sm:w-[420px]">
      <div
        className="absolute top-8 left-10 w-[240px] h-[240px] rounded-full blur-[100px] opacity-30"
        style={{ backgroundColor: colors.primary }}
      />

      <div className="glass-strong theme-panel p-5 sm:p-6 shadow-2xl shadow-black/40">
        <div className="grid grid-cols-[1.2fr,0.8fr] gap-4">
          <div
            className="rounded-[28px] p-5"
            style={{ background: `linear-gradient(155deg, ${colors.primary}26 0%, rgba(255,255,255,.05) 100%)` }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/[0.07] flex items-center justify-center flex-shrink-0">
                {avatarUrl ? (
                  <BrandAssetImage
                    src={avatarUrl}
                    alt={`Marca de ${business.normalized_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CategoryLogo
                    category={business.category}
                    businessName={business.normalized_name}
                    primaryColor={colors.primary}
                    size={48}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {business.normalized_name}
                </p>
                <p className="text-white/35 text-[11px] truncate">
                  Presenca validada
                </p>
              </div>
            </div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-white/35 font-semibold">
              Reputacao local
            </p>
            <div className="flex items-end gap-3 mt-4">
              <span className="text-5xl font-black text-white">
                {rating.toFixed(1)}
              </span>
              <div className="pb-1">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-white/10"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-white/35 text-[11px] mt-1">
                  {reviewCount} avaliacoes
                </p>
              </div>
            </div>
            <p className="text-white/45 text-xs leading-relaxed mt-4">
              {content.aboutText.slice(0, 120)}...
            </p>
          </div>

          <div className="space-y-3">
            {content.aboutHighlights.slice(0, 3).map((item) => (
              <div
                key={item}
                className="glass rounded-2xl theme-card px-4 py-4 text-white/70 text-xs leading-snug"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="glass rounded-2xl theme-card p-4 text-center">
            <MessageCircle className="w-4 h-4 mx-auto text-emerald-400" />
            <p className="text-white font-semibold text-xs mt-2">Contato facil</p>
            <p className="text-white/35 text-[10px]">Atendimento rapido</p>
          </div>
          <div className="glass rounded-2xl theme-card p-4 text-center">
            <MapPin
              className="w-4 h-4 mx-auto"
              style={{ color: colors.primary }}
            />
            <p className="text-white font-semibold text-xs mt-2">Regiao</p>
            <p className="text-white/35 text-[10px] truncate">
              {business.region}
            </p>
          </div>
          <div className="glass rounded-2xl theme-card p-4 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto text-green-400" />
            <p className="text-white font-semibold text-xs mt-2">Confianca</p>
            <p className="text-white/35 text-[10px]">Presenca validada</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const heroPreviewVariants = [BrandHeroPreview, SocialHeroPreview, TrustedHeroPreview] as const;
void heroPreviewVariants;

export default function SitePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [extractedColor, setExtractedColor] = useState<string | null>(null);
  const [brandMedia, setBrandMedia] = useState<BrandMedia | null>(null);
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [publicBaseUrl, setPublicBaseUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrateBrandColor = async (nextLead: Lead) => {
      if (nextLead.signals.brand_color) {
        if (!cancelled) {
          setExtractedColor(nextLead.signals.brand_color);
        }
        return;
      }

      if (typeof window === "undefined") return;

      const cacheKey = `brand_color_${id}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        if (!cancelled) {
          setExtractedColor(cached === "__none__" ? null : cached);
        }
        return;
      }

      const urls = [
        nextLead.signals.website_url,
        nextLead.signals.instagram_url,
        nextLead.signals.facebook_url,
        nextLead.signals.google_maps_url,
      ].filter((url): url is string => !!url && url.startsWith("http"));

      for (const url of urls) {
        try {
          const res = await fetch("/api/extract-color", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          if (!res.ok) continue;

          const data = (await res.json()) as { color?: string | null };
          if (cancelled) return;

          if (data.color) {
            setExtractedColor(data.color);
            localStorage.setItem(cacheKey, data.color);
            return;
          }
        } catch {
          // continue to next candidate
        }
      }

      localStorage.setItem(cacheKey, "__none__");
    };

    const hydrateBrandMedia = async (nextLead: Lead) => {
      if (typeof window === "undefined") return;

      const cacheKey = `brand_media_v2_${id}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        if (cached === "__none__") {
          if (!cancelled) {
            setBrandMedia(null);
          }
          return;
        }

        try {
          const parsed = normalizeBrandMedia(JSON.parse(cached));
          if (parsed) {
            if (!cancelled) {
              setBrandMedia(parsed);
            }
            return;
          }
        } catch {
          // ignore invalid cache and refetch
        }
      }

      const payload = {
        websiteUrl: nextLead.signals.website_url ?? undefined,
        instagramUrl: nextLead.signals.instagram_url ?? undefined,
        facebookUrl: nextLead.signals.facebook_url ?? undefined,
        linktreeUrl: nextLead.signals.linktree_url ?? undefined,
      };

      if (
        !payload.websiteUrl &&
        !payload.instagramUrl &&
        !payload.facebookUrl &&
        !payload.linktreeUrl
      ) {
        localStorage.setItem(cacheKey, "__none__");
        return;
      }

      try {
        const res = await fetch("/api/extract-brand-assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("extract-brand-assets");
        }

        const parsed = normalizeBrandMedia(
          (await res.json()) as Partial<BrandMedia>,
        );

        if (cancelled) return;

        if (parsed) {
          setBrandMedia(parsed);
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
          return;
        }
      } catch {
        // fall back to default visuals
      }

      setBrandMedia(null);
      localStorage.setItem(cacheKey, "__none__");
    };

    (async () => {
      try {
        if (!cancelled) {
          setLead(null);
          setLoaded(false);
          setExtractedColor(null);
          setBrandMedia(null);
          setIsOwner(false);
          setShortCode(null);
          setPublicBaseUrl(null);
          setCopied(false);
        }

        const serverResult = await fetchPublishedLead(id);

        if (cancelled) return;

        fetch("/api/public-url")
          .then((response) => response.json())
          .then((data) => {
            if (data.url) setPublicBaseUrl(data.url);
          })
          .catch(() => {});

        const localLead = getLeadFromStorage(id);
        const isLocalPreview =
          typeof window !== "undefined" &&
          isPrivatePreviewHost(window.location.hostname);
        setIsOwner(Boolean(localLead && isLocalPreview));
        const nextLead = serverResult?.lead ?? localLead;

        if (!nextLead) return;

        setLead(nextLead);

        if (serverResult?.shortCode) {
          setShortCode(serverResult.shortCode);
        }

        if (!serverResult && localLead) {
          const code = await ensureLeadSitePublished(localLead);
          if (cancelled) return;
          if (code) setShortCode(code);
        }

        await Promise.all([
          hydrateBrandColor(nextLead),
          hydrateBrandMedia(nextLead),
        ]);
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  const onScroll = useCallback(() => setScrollY(window.scrollY), []);
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const categorySeed = lead ? inferLeadCategory(lead) : "";
  const heroImageUrl = brandMedia?.heroImageUrl ?? null;

  useEffect(() => {
    setHeroImageFailed(false);
  }, [heroImageUrl, categorySeed]);

  if (!loaded) return (
    <div
      data-site-loading="true"
      className="fixed inset-0 z-[200] bg-[#f7f0e8] flex items-center justify-center"
    >
      <div className="relative"><div className="w-12 h-12 border-2 border-[#d7c8b8] rounded-full" /><div className="absolute inset-0 w-12 h-12 border-2 border-[#3a2d21] border-t-transparent rounded-full animate-spin" /></div>
    </div>
  );

  if (!lead) return (
    <div className="fixed inset-0 z-[200] bg-[#f7f0e8] flex flex-col items-center justify-center gap-4">
      <p className="text-[#6d5b49] text-lg">Lead não encontrado</p>
      <Link href="/" className="text-[#8c5a2b] hover:underline text-sm">Voltar</Link>
    </div>
  );

  const inferredCategory = inferLeadCategory(lead);
  const displayLead =
    inferredCategory === lead.business.category
      ? lead
      : {
          ...lead,
          business: {
            ...lead.business,
            category: inferredCategory,
          },
        };
  const { business, signals } = displayLead;
  const content = generateSiteContent(displayLead);
  const colors = getResolvedColor(business.category, extractedColor);
  const visualTheme = getSiteVisualTheme(displayLead, colors.primary);
  const phone = business.phone ?? "";
  const whatsappNumber = phone.replace(/\D/g, "");
  const scrolled = scrollY > 80;
  const brandAvatarUrl = getBrandAvatarUrl(brandMedia);
  const normalizedCategory = normalizeCategory(business.category);
  const categoryPill = normalizedCategory.includes("local")
    ? business.category
    : `${business.category} local`;
  const primaryChannel = content.secondaryCta ?? content.sourceLinks[0] ?? null;
  const heroArtPath = getCategoryHeroArtPath(business.category);
  const themeVars: CSSProperties & Record<string, string> = {
    colorScheme: "light",
    backgroundColor: "#fcf9f4",
    backgroundImage: `radial-gradient(circle at 12% 10%, ${colors.primary}14 0%, transparent 30%), radial-gradient(circle at 86% 8%, #f2eee9 0%, transparent 26%), linear-gradient(180deg, #fcf9f4 0%, #f4f0ea 48%, #fcf9f4 100%)`,
    "--glass-bg": visualTheme.glassBackground,
    "--glass-strong-bg": visualTheme.glassStrongBackground,
    "--glass-border": visualTheme.glassBorder,
    "--theme-card-radius": visualTheme.cardRadius,
    "--theme-panel-radius": visualTheme.panelRadius,
    "--theme-nav-bg": visualTheme.navBackground,
    "--theme-grid-opacity": visualTheme.gridOpacity,
    "--theme-shine-opacity": visualTheme.shineOpacity,
    "--theme-aura-primary": visualTheme.auraPrimary,
    "--theme-aura-secondary": visualTheme.auraSecondary,
    "--font-display": `"Plus Jakarta Sans", var(--font-geist-sans), "Segoe UI", sans-serif`,
    "--font-body": `"Plus Jakarta Sans", var(--font-geist-sans), "Segoe UI", sans-serif`,
    "--theme-shadow": "rgba(84, 67, 60, 0.28)",
    "--theme-shadow-soft": "rgba(84, 67, 60, 0.18)",
    "--surface-base": "#fcf9f4",
    "--surface-low": "#f6f3ee",
    "--surface-high": "#f2eee9",
    "--surface-highest": "#e5e2dd",
    "--surface-strong": "#fbf7f2",
    "--surface-accent": "#ffdbcd",
    "--primary": "#924a28",
    "--primary-container": "#d27d56",
    "--secondary-container": "#d6e7a1",
    "--on-secondary-container": "#5a682f",
    "--tertiary-container": "#af8f3b",
    "--outline-variant": "#dac2b8",
    "--ink-strong": "#1c1c19",
    "--ink-color": "#54433c",
    "--ink-soft": "#6b5a52",
  };

  const handleCopyShortLink = async () => {
    if (!publicBaseUrl) return;

    setCopyingLink(true);
    try {
      const code = shortCode ?? (await ensureLeadSitePublished(lead));
      if (!code) return;

      setShortCode(code);
      const shortUrl = `${publicBaseUrl}/s/${code}`;
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setCopyingLink(false);
    }
  };

  return (
    <div
      className={`site-shell fixed inset-0 z-[200] overflow-auto scroll-smooth theme-${visualTheme.variant}`}
      style={themeVars}
    >
      <style>{`
        @keyframes glow-pulse { 0%,100%{opacity:.3} 50%{opacity:.6} }
        @keyframes float-slow { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(2deg)} }
        @keyframes float-alt { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(-1.5deg)} }
        @keyframes text-glow { 0%,100%{text-shadow:0 0 20px rgba(255,255,255,0)} 50%{text-shadow:0 0 40px rgba(255,255,255,.06)} }
        .site-shell{font-family:var(--font-body);background-attachment:fixed}
        .site-shell h1,.site-shell h2{font-family:var(--font-display);letter-spacing:-0.045em;font-weight:700}
        .site-shell h3{letter-spacing:-0.02em}
        .glow-pulse{animation:none}
        .float-slow{animation:none}
        .float-alt{animation:none}
        .text-glow{animation:none;text-shadow:none}
        .glass{background:linear-gradient(180deg,var(--surface-low) 0%, var(--surface-base) 100%);border:0 !important;box-shadow:0 12px 32px rgba(84,67,60,0.08)}
        .glass-strong{background:linear-gradient(180deg,var(--surface-high) 0%, var(--surface-low) 100%);border:0 !important;box-shadow:0 12px 32px rgba(84,67,60,0.08)}
        .surface{background:linear-gradient(180deg,var(--surface-low) 0%, var(--surface-base) 100%);border:0 !important;box-shadow:0 12px 32px rgba(84,67,60,0.08)}
        .surface-strong{background:linear-gradient(180deg,var(--surface-strong) 0%, var(--surface-low) 100%);border:0 !important;box-shadow:0 12px 32px rgba(84,67,60,0.08)}
        .surface-tinted{background:linear-gradient(180deg,var(--surface-highest) 0%, var(--surface-low) 100%);border:0 !important;box-shadow:0 12px 32px rgba(84,67,60,0.08)}
        .card-hover{transition:all .4s cubic-bezier(.16,1,.3,1)}
        .card-hover:hover{transform:translateY(-3px);box-shadow:0 26px 60px -34px var(--theme-shadow)}
        .shine{position:relative;overflow:hidden}
        .shine::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,calc(var(--theme-shine-opacity) + 0.01)) 0%,transparent 36%);opacity:0;transition:opacity .35s ease}
        .shine:hover::after{opacity:1}
        .theme-card{border-radius:var(--theme-card-radius)}
        .theme-panel{border-radius:var(--theme-panel-radius)}
        .section-shell{max-width:72rem;margin:0 auto;padding-left:1.25rem;padding-right:1.25rem}
        .eyebrow{display:inline-flex;align-items:center;gap:.55rem;padding:.55rem .9rem;border-radius:999px;font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;background:var(--surface-highest);color:var(--ink-soft);border:0}
      `}</style>

      {isOwner && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-[var(--surface-low)]/90 backdrop-blur-xl">
          <div className="section-shell py-2 flex items-center justify-between text-xs gap-3">
            <span className="text-[var(--ink-soft)] truncate">
              Demo para <strong className="text-[var(--ink-strong)]">{business.normalized_name}</strong>
            </span>
            <div className="flex items-center gap-3 flex-shrink-0">
              {publicBaseUrl ? (
                <button
                  onClick={handleCopyShortLink}
                  disabled={copyingLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[var(--ink-color)] hover:text-[var(--ink-strong)] bg-[var(--surface-strong)]"
                >
                  {copied ? (
                    <><CheckCircle2 className="w-3 h-3" />Copiado!</>
                  ) : copyingLink ? (
                    <><ExternalLink className="w-3 h-3" />Gerando...</>
                  ) : (
                    <><ExternalLink className="w-3 h-3" />Copiar link curto</>
                  )}
                </button>
              ) : (
                <span className="text-[var(--ink-soft)] text-[11px]">
                  Link público indisponível. Rode `npm run tunnel`.
                </span>
              )}
              <Link
                href={`/lead/${business.id}`}
                className="text-[var(--ink-soft)] hover:text-[var(--ink-strong)] underline underline-offset-2"
              >
                Painel
              </Link>
            </div>
          </div>
        </div>
      )}

      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 bg-[var(--surface-base)]/85 backdrop-blur-xl ${
          scrolled ? "shadow-sm" : ""
        }`}
        style={{ top: isOwner ? "2.5rem" : "0" }}
      >
        <div className="section-shell py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[var(--surface-strong)] flex items-center justify-center overflow-hidden">
              {brandAvatarUrl ? (
                <BrandAssetImage
                  src={brandAvatarUrl}
                  alt={`Marca de ${business.normalized_name}`}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <CategoryLogo category={business.category} businessName={business.normalized_name} primaryColor={colors.primary} size={36} />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[var(--ink-strong)] truncate">
                {business.normalized_name}
              </p>
              <p className="text-xs text-[var(--ink-soft)] truncate">
                {business.category} em {business.region}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-[0.22em] font-semibold text-[var(--ink-soft)]">
              <a href="#servicos" className="hover:text-[var(--primary)] transition-colors">Serviços</a>
              <a href="#sobre" className="hover:text-[var(--primary)] transition-colors">Sobre</a>
              <a href="#depoimentos" className="hover:text-[var(--primary)] transition-colors">Depoimentos</a>
              <a href="#contato" className="hover:text-[var(--primary)] transition-colors">Contato</a>
            </div>
            <a
              href="#contato"
              className="px-6 py-2.5 rounded-[999px] text-xs font-semibold text-white transition-all hover:translate-y-[-1px]"
              style={{ background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)` }}
            >
              Solicitar atendimento
            </a>
          </div>
        </div>
      </nav>

      <main data-site-ready="true" style={{ paddingTop: isOwner ? "9rem" : "5rem" }}>
        <section className="relative px-4 sm:px-6 py-10 sm:py-16 overflow-hidden">
          <div className="section-shell">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 z-10">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--secondary-container)] text-[var(--on-secondary-container)] text-[11px] font-semibold tracking-[0.22em] uppercase">
                  <MapPin className="w-3.5 h-3.5" />
                  {categoryPill}
                </span>
                <h1 className="mt-7 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--ink-strong)] leading-[1.08] max-w-xl">
                  {content.heroTitle}
                </h1>
                <p className="mt-6 text-[var(--ink-color)] text-lg leading-relaxed max-w-xl">
                  {content.tagline}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  {signals.whatsapp_detected && whatsappNumber ? (
                    <a
                      href={content.whatsappMessage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-4 rounded-full text-white font-semibold text-base hover:shadow-lg transition-all"
                      style={{ background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)` }}
                    >
                      Chamar no WhatsApp
                    </a>
                  ) : (
                    <a
                      href="#contato"
                      className="px-8 py-4 rounded-full text-white font-semibold text-base hover:shadow-lg transition-all"
                      style={{ background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)` }}
                    >
                      Solicitar atendimento
                    </a>
                  )}
                  <a
                    href={primaryChannel?.href ?? "#sobre"}
                    target={primaryChannel ? "_blank" : undefined}
                    rel={primaryChannel ? "noopener noreferrer" : undefined}
                    className="px-8 py-4 rounded-full bg-[var(--surface-highest)] text-[var(--ink-strong)] font-semibold text-base hover:bg-[var(--surface-high)] transition-all"
                  >
                    Conheça o espaço
                  </a>
                </div>
              </div>
              <div className="lg:col-span-6 relative">
                <div
                  className="aspect-[4/5] rounded-[28px] overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-700 shadow-2xl"
                  style={{ boxShadow: "0 22px 50px rgba(84,67,60,0.2)" }}
                >
                  {heroImageUrl && !heroImageFailed ? (
                    <img
                      src={heroImageUrl}
                      alt={`Imagem de ${business.normalized_name}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImageFailed(true)}
                    />
                  ) : (
                    <img
                      src={heroArtPath}
                      alt={`Hero art de ${business.category}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[var(--tertiary-container)] rounded-full opacity-30 blur-2xl" />
              </div>
            </div>
          </div>
        </section>

      <section id="servicos" className="bg-[var(--surface-low)] py-16 sm:py-24 rounded-t-[3rem] -mt-10 relative z-10">
        <div className="section-shell">
          <Reveal>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
              <div className="max-w-2xl">
                <span className="eyebrow">Serviços</span>
                <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl text-[var(--ink-strong)]">
                  O que o cliente encontra aqui
                </h2>
                <p className="mt-4 text-[var(--ink-soft)] leading-relaxed">
                  Em vez de um grid frio de cards, a ideia é apresentar os serviços com cara de vitrine organizada e confiável.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="w-12 h-1 bg-[var(--primary)] rounded-full" />
                <span className="w-4 h-1 bg-[var(--outline-variant)] rounded-full" />
              </div>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {content.services.map((service, index) => (
              <Reveal key={service.name} delay={index * 70}>
                <div className="bg-[var(--surface-strong)] rounded-[24px] p-6 sm:p-7 card-hover">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: `var(--surface-highest)` }}>
                    <div className="text-2xl">{service.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--ink-strong)]">{service.name}</h3>
                  <p className="mt-3 text-[var(--ink-color)] leading-relaxed">{service.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[var(--primary)] font-semibold text-sm">
                    Saber mais <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="sobre" className="py-16 sm:py-24">
        <div className="section-shell">
          <div className="grid lg:grid-cols-[1.05fr,0.95fr] gap-10 items-start">
            <Reveal>
              <div className="space-y-6">
                <span className="eyebrow">Sobre a marca</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[var(--ink-strong)] leading-tight">
                  Um site com cara de negócio real, acolhedor e fácil de confiar.
                </h2>
                <p className="text-[var(--ink-color)] text-lg leading-relaxed">
                  {content.aboutText}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {content.aboutHighlights.map((item, index) => (
                    <div key={`${item}-${index}`} className="surface rounded-[20px] px-4 py-4 flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: colors.primary }} />
                      <span className="text-sm text-[var(--ink-color)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="surface-strong theme-panel p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Presença digital</p>
                    <h3 className="mt-2 text-2xl text-[var(--ink-strong)]">Como o site ajuda no dia a dia</h3>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${colors.primary}18` }}>
                    <Shield className="w-6 h-6" style={{ color: colors.primary }} />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    {
                      icon: <Search className="w-5 h-5" />,
                      title: "Ser encontrado com mais clareza",
                      desc: "Quem busca no Google encontra rapidamente o nome, a região e a forma de contato.",
                    },
                    {
                      icon: <TrendingUp className="w-5 h-5" />,
                      title: "Passar confiança logo na primeira visita",
                      desc: "Um layout claro, organizado e com cara de negócio real transmite segurança antes da conversa começar.",
                    },
                    {
                      icon: <Smartphone className="w-5 h-5" />,
                      title: "Facilitar a ação no celular",
                      desc: "Telefone, WhatsApp, Maps e redes ficam sempre próximos para quem decide rápido.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="surface-tinted rounded-[20px] p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `var(--surface-highest)`, color: colors.primary }}>
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-[var(--ink-strong)]">{item.title}</h4>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-color)]">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="depoimentos" className="bg-[var(--surface-high)] py-16 sm:py-24 rounded-[2rem] mx-4 sm:mx-6">
        <div className="section-shell">
          <Reveal>
            <div className="text-center mb-12">
              <span className="eyebrow">Depoimentos</span>
              <h2 className="mt-4 text-3xl sm:text-4xl text-[var(--ink-strong)]">A sensação que a marca quer passar</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {content.testimonials.map((testimonial) => (
              <Reveal key={testimonial.name}>
                <div className="surface rounded-[22px] p-5 flex flex-col h-full">
                  <Quote className="w-7 h-7" style={{ color: `${colors.primary}99` }} />
                  <p className="mt-4 text-sm leading-relaxed text-[var(--ink-color)] flex-1">&ldquo;{testimonial.text}&rdquo;</p>
                  <div className="mt-5">
                    <p className="font-semibold text-[var(--ink-strong)]">{testimonial.name}</p>
                    <div className="mt-2 flex gap-0.5">
                      {Array.from({ length: testimonial.rating }).map((_, index) => (
                        <Star key={index} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="py-14 sm:py-20">
        <div className="section-shell">
          <div className="grid lg:grid-cols-[1.05fr,0.95fr] gap-6 lg:gap-8 items-stretch">
            <Reveal>
              <div className="surface-strong theme-panel p-6 sm:p-8 h-full">
                <span className="eyebrow">Contato</span>
                <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl text-[var(--ink-strong)]">Onde encontrar a marca</h2>
                <div className="mt-8 grid sm:grid-cols-2 gap-4">
                  <div className="surface rounded-[22px] p-5 sm:col-span-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: colors.primary }} />
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Endereço</p>
                        <p className="mt-2 text-[var(--ink-color)] leading-relaxed">{business.address}</p>
                        {signals.google_maps_url && (
                          <a href={signals.google_maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm font-medium" style={{ color: colors.primary }}>
                            Ver no Maps
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="surface rounded-[22px] p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Telefone</p>
                    {phone ? (
                      <a href={`tel:${phone}`} className="mt-2 block text-lg font-semibold text-[var(--ink-strong)] hover:underline">
                        {phone}
                      </a>
                    ) : (
                      <p className="mt-2 text-[var(--ink-soft)]">Não informado</p>
                    )}
                    {signals.whatsapp_detected && phone && (
                      <a href={content.whatsappMessage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-[#25D366]">
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                  <div className="surface rounded-[22px] p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Horário sugerido</p>
                    <div className="mt-2 space-y-2 text-sm text-[var(--ink-color)]">
                      {[["Seg – Sex", "08:00 – 18:00"], ["Sábado", "08:00 – 12:00"], ["Domingo", "Fechado"]].map(([day, hour]) => (
                        <div key={day} className="flex items-center justify-between">
                          <span>{day}</span>
                          <span className="font-medium text-[var(--ink-strong)]">{hour}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {content.sourceLinks.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {content.sourceLinks.map((link) => {
                      const meta = getSourceLinkMeta(link.kind);
                      return (
                        <a
                          key={`${link.kind}-${link.href}`}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-[18px] text-sm font-semibold transition-all bg-[var(--surface-highest)] text-[var(--ink-color)] hover:text-[var(--ink-strong)] hover:translate-y-[-1px]"
                        >
                          {meta.icon}
                          <span className="flex flex-col items-start leading-tight">
                            <span>{link.label}</span>
                            <span className="text-xs font-normal text-[var(--ink-soft)]">{link.value}</span>
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="surface theme-panel p-4 sm:p-5 h-full flex flex-col">
                <div className="rounded-[26px] overflow-hidden h-[320px] sm:h-[400px] relative">
                  {business.lat && business.lng ? (
                    <iframe
                      title="Mapa"
                      src={`https://maps.google.com/maps?q=${business.lat},${business.lng}&z=15&output=embed`}
                      className="absolute inset-0 w-full h-full border-0"
                      loading="lazy"
                      allowFullScreen
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--ink-soft)] bg-[var(--surface-high)]">
                      Mapa indisponível
                    </div>
                  )}
                </div>
                <div className="mt-4 surface-tinted rounded-[22px] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Pronto para atender</p>
                  <p className="mt-2 text-[var(--ink-color)] leading-relaxed">
                    Atendemos a região de {business.region} com um site pensado para converter visita em contato, sem exagero tecnológico e com cara de negócio de verdade.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <footer className="pt-8 pb-16">
        <div className="section-shell">
          <div className="surface-strong rounded-[30px] p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface-strong)] flex items-center justify-center overflow-hidden">
                  {brandAvatarUrl ? (
                    <BrandAssetImage
                      src={brandAvatarUrl}
                      alt={`Marca de ${business.normalized_name}`}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <CategoryLogo category={business.category} businessName={business.normalized_name} primaryColor={colors.primary} size={42} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink-strong)]">{business.normalized_name}</p>
                  <p className="text-sm text-[var(--ink-soft)]">{business.category} · {business.region}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {signals.whatsapp_detected && whatsappNumber ? (
                  <a
                    href={content.whatsappMessage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-[18px] px-5 py-3 bg-[#25D366] text-white font-semibold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Falar agora
                  </a>
                ) : phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center justify-center gap-2 rounded-[18px] px-5 py-3 text-white font-semibold"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Phone className="w-4 h-4" />
                    {phone}
                  </a>
                ) : null}
                {primaryChannel && (
                  <a
                    href={primaryChannel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-[18px] px-5 py-3 text-[var(--ink-color)] font-semibold bg-[var(--surface-highest)]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Canal oficial
                  </a>
                )}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-transparent text-sm text-[var(--ink-soft)] flex flex-col sm:flex-row justify-between gap-3">
              <span>© {new Date().getFullYear()} {business.normalized_name}. Todos os direitos reservados.</span>
              <span>Layout pensado para parecer um negócio local moderno, e não um app.</span>
            </div>
          </div>
        </div>
      </footer>
      </main>

      {/* ── FLOATING WHATSAPP ── */}
      {signals.whatsapp_detected && whatsappNumber && (
        <a href={content.whatsappMessage} target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-[210] w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/25 flex items-center justify-center hover:scale-105 transition-all border-4 border-white"
          style={{ opacity: scrollY > 400 ? 1 : 0, pointerEvents: scrollY > 400 ? "auto" : "none", transition: "all .3s ease" }}>
          <MessageCircle className="w-6 h-6" />
        </a>
      )}

      {/* ── SCROLL TO TOP ── */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-[210] w-11 h-11 rounded-full bg-[var(--surface-highest)] text-[var(--ink-soft)] hover:text-[var(--ink-strong)] flex items-center justify-center transition-all shadow-lg"
        style={{ opacity: scrollY > 400 ? 1 : 0, pointerEvents: scrollY > 400 ? "auto" : "none", transition: "all .3s ease" }}>
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}
