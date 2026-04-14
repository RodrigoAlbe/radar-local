"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { generateApproaches } from "@/lib/approach-generator";
import { buildSiteUrl, fetchPublicBaseUrl } from "@/lib/whatsapp";
import {
  ensureLeadSitePublished,
  fetchPublishedLead,
  publishLeadToServer,
} from "@/lib/site-share";
import {
  calculateScore,
  PRIORITY_BAND_COLORS,
  PRIORITY_BAND_LABELS,
} from "@/lib/scoring";
import { getLeadSalesInsight } from "@/lib/sales-intelligence";
import {
  DigitalSignals,
  PipelineStatus,
  PIPELINE_LABELS,
  PIPELINE_COLORS,
} from "@/lib/types";
import ScoreBadge from "@/components/ScoreBadge";
import ApproachMessage from "@/components/ApproachMessage";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Camera,
  Share2,
  MessageCircle,
  Star,
  Bookmark,
  Trash2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Eye,
  DollarSign,
  Calendar,
  Save,
} from "lucide-react";

type EditableSocialPlatform = "instagram" | "facebook" | "linktree";

function normalizeSocialInput(
  platform: EditableSocialPlatform,
  raw: string
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (platform === "instagram") {
    const handle = trimmed.replace(/^@/, "");
    if (/^[a-zA-Z0-9._]+$/.test(handle)) {
      return `https://www.instagram.com/${handle}/`;
    }

    try {
      const url = new URL(
        /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      );
      const [firstSegment] = url.pathname.split("/").filter(Boolean);
      return firstSegment
        ? `https://www.instagram.com/${firstSegment}/`
        : null;
    } catch {
      return null;
    }
  }

  if (platform === "facebook") {
    const handle = trimmed.replace(/^@/, "");
    if (/^[a-zA-Z0-9._-]+$/.test(handle)) {
      return `https://www.facebook.com/${handle}`;
    }

    try {
      const url = new URL(
        /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      );
      if (url.pathname === "/profile.php") {
        const profileId = url.searchParams.get("id");
        return profileId
          ? `https://www.facebook.com/profile.php?id=${profileId}`
          : null;
      }

      const [firstSegment] = url.pathname.split("/").filter(Boolean);
      return firstSegment
        ? `https://www.facebook.com/${firstSegment}`
        : null;
    } catch {
      return null;
    }
  }

  const handle = trimmed
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?linktr\.ee\//i, "")
    .replace(/^https?:\/\/(www\.)?linktree\.ee?\//i, "")
    .split(/[/?#]/)[0];

  if (/^[a-zA-Z0-9._-]+$/.test(handle)) {
    return `https://linktr.ee/${handle}`;
  }

  try {
    const url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    );
    const [firstSegment] = url.pathname.split("/").filter(Boolean);
    return firstSegment ? `https://linktr.ee/${firstSegment}` : null;
  } catch {
    return null;
  }
}

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    getLeadById,
    upsertLead,
    updatePipeline,
    updatePipelineFields,
    saveLead,
    discardLead,
    isHydrated,
  } = useStore();
  const [showAllReasons, setShowAllReasons] = useState(false);
  const [notes, setNotes] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  const [copyingScreenshotLink, setCopyingScreenshotLink] = useState(false);
  const [demoShareUrl, setDemoShareUrl] = useState("");
  const [screenshotShareUrl, setScreenshotShareUrl] = useState("");
  const [resolvingShareUrls, setResolvingShareUrls] = useState(false);
  const [proposedValue, setProposedValue] = useState("");
  const [nextFollowup, setNextFollowup] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);
  const [socialEnrichmentStatus, setSocialEnrichmentStatus] = useState<
    "idle" | "loading" | "found" | "manual" | "not_found" | "error"
  >("idle");
  const [instagramInput, setInstagramInput] = useState("");
  const [facebookInput, setFacebookInput] = useState("");
  const [linktreeInput, setLinktreeInput] = useState("");
  const [socialFormDirty, setSocialFormDirty] = useState(false);
  const [savingSocials, setSavingSocials] = useState(false);

  const showToast = (message: string, type: "success" | "warning") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const lead = getLeadById(id);
  const businessId = lead?.business.id ?? "";
  const businessName = lead?.business.normalized_name ?? "";
  const region = lead?.business.region ?? "";
  const websiteUrl = lead?.signals.website_url ?? null;
  const hasKnownSocial = Boolean(
    lead?.signals.instagram_url ||
      lead?.signals.facebook_url ||
      lead?.signals.linktree_url
  );
  const currentInstagramUrl = lead?.signals.instagram_url ?? "";
  const currentFacebookUrl = lead?.signals.facebook_url ?? "";
  const currentLinktreeUrl = lead?.signals.linktree_url ?? "";

  const resolveShareLinks = useCallback(async () => {
    if (!lead) return null;

    const baseUrl = await fetchPublicBaseUrl();
    if (!baseUrl) return null;

    const shortCode = await ensureLeadSitePublished(lead);
    const demoUrl = buildSiteUrl(baseUrl, lead.business.id, shortCode);
    const imageUrl = `${baseUrl}/api/site-screenshot/${encodeURIComponent(
      lead.business.id,
    )}?name=${encodeURIComponent(lead.business.normalized_name)}`;

    return { demoUrl, imageUrl };
  }, [lead]);

  useEffect(() => {
    setSocialEnrichmentStatus("idle");
    setSocialFormDirty(false);
  }, [businessId]);

  useEffect(() => {
    if (socialFormDirty) return;
    setInstagramInput(currentInstagramUrl);
    setFacebookInput(currentFacebookUrl);
    setLinktreeInput(currentLinktreeUrl);
  }, [
    currentFacebookUrl,
    currentInstagramUrl,
    currentLinktreeUrl,
    socialFormDirty,
  ]);

  useEffect(() => {
    setNotes(lead?.pipeline?.notes ?? "");
  }, [lead?.business.id, lead?.pipeline?.notes]);

  useEffect(() => {
    if (!lead) {
      setDemoShareUrl("");
      setScreenshotShareUrl("");
      return;
    }

    let cancelled = false;

    (async () => {
      setResolvingShareUrls(true);
      try {
        const links = await resolveShareLinks();
        if (!cancelled) {
          setDemoShareUrl(links?.demoUrl ?? "");
          setScreenshotShareUrl(links?.imageUrl ?? "");
        }
      } catch {
        if (!cancelled) {
          setDemoShareUrl("");
          setScreenshotShareUrl("");
        }
      } finally {
        if (!cancelled) {
          setResolvingShareUrls(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lead, resolveShareLinks]);

  useEffect(() => {
    if (!lead || !websiteUrl || hasKnownSocial || socialEnrichmentStatus !== "idle") {
      return;
    }

    let cancelled = false;

    const enrichSocials = async () => {
      setSocialEnrichmentStatus("loading");

      try {
        const response = await fetch("/api/enrich-social", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            websiteUrl,
            businessName,
            region,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to enrich socials");
        }

        const data = (await response.json()) as {
          instagram_url: string | null;
          facebook_url: string | null;
          linktree_url: string | null;
          confidence: number;
        };

        if (cancelled) return;

        const foundNewSocial =
          (!lead.signals.instagram_url && data.instagram_url) ||
          (!lead.signals.facebook_url && data.facebook_url) ||
          (!lead.signals.linktree_url && data.linktree_url);

        if (!foundNewSocial) {
          setSocialEnrichmentStatus("not_found");
          return;
        }

        const nextSignals: DigitalSignals = {
          ...lead.signals,
          instagram_url: lead.signals.instagram_url ?? data.instagram_url ?? null,
          facebook_url: lead.signals.facebook_url ?? data.facebook_url ?? null,
          linktree_url: lead.signals.linktree_url ?? data.linktree_url ?? null,
          has_social_only: lead.signals.has_website
            ? false
            : Boolean(data.instagram_url || data.facebook_url || data.linktree_url),
          presence_status: lead.signals.has_website
            ? "site_proprio"
            : (data.instagram_url || data.facebook_url || data.linktree_url)
              ? "so_redes_sociais"
              : lead.signals.presence_status,
          confidence: Math.max(lead.signals.confidence, data.confidence || 0),
          checked_at: new Date().toISOString(),
        };

        const updatedLead = {
          ...lead,
          signals: nextSignals,
          score: calculateScore(lead.business, nextSignals),
        };

        upsertLead(updatedLead);

        const publishedLead = await fetchPublishedLead(lead.business.id);
        if (!cancelled && publishedLead) {
          await publishLeadToServer(updatedLead);
        }

        if (!cancelled) {
          setSocialEnrichmentStatus("found");
        }
      } catch {
        if (!cancelled) {
          setSocialEnrichmentStatus("error");
        }
      }
    };

    void enrichSocials();

    return () => {
      cancelled = true;
    };
  }, [
    businessName,
    businessId,
    hasKnownSocial,
    lead,
    region,
    socialEnrichmentStatus,
    upsertLead,
    websiteUrl,
  ]);

  if (!isHydrated && !lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-sm text-muted">Carregando lead...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-sm text-muted">{"Lead n\u00E3o encontrado"}</p>
        <button
          onClick={() => router.back()}
          className="text-primary text-sm font-medium hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  const { business, signals, score, pipeline } = lead;
  const approaches = generateApproaches(lead);
  const currentStatus = pipeline?.status ?? "novo";
  const salesInsight = getLeadSalesInsight(lead);

  const positiveReasons = score.score_reasons.filter((r) => r.points > 0);
  const negativeReasons = score.score_reasons.filter((r) => r.points < 0);
  const displayedReasons = showAllReasons
    ? score.score_reasons
    : score.score_reasons.slice(0, 3);
  const socialInputsChanged =
    instagramInput !== (signals.instagram_url ?? "") ||
    facebookInput !== (signals.facebook_url ?? "") ||
    linktreeInput !== (signals.linktree_url ?? "");

  const handleStatusChange = (status: PipelineStatus) => {
    updatePipeline(business.id, status, notes || undefined);
  };

  const handleSaveSocials = async () => {
    const nextInstagram = normalizeSocialInput("instagram", instagramInput);
    const nextFacebook = normalizeSocialInput("facebook", facebookInput);
    const nextLinktree = normalizeSocialInput("linktree", linktreeInput);

    if (instagramInput.trim() && !nextInstagram) {
      showToast("Instagram inv\u00E1lido", "warning");
      return;
    }

    if (facebookInput.trim() && !nextFacebook) {
      showToast("Facebook inv\u00E1lido", "warning");
      return;
    }

    if (linktreeInput.trim() && !nextLinktree) {
      showToast("Linktree inv\u00E1lido", "warning");
      return;
    }

    setSavingSocials(true);

    try {
      const hasAnySocial = Boolean(nextInstagram || nextFacebook || nextLinktree);
      const nextSignals: DigitalSignals = {
        ...signals,
        instagram_url: nextInstagram,
        facebook_url: nextFacebook,
        linktree_url: nextLinktree,
        has_social_only: signals.has_website ? false : hasAnySocial,
        presence_status: signals.has_website
          ? "site_proprio"
          : hasAnySocial
            ? "so_redes_sociais"
            : "sem_site_detectado",
        confidence: 1,
        checked_at: new Date().toISOString(),
      };

      const updatedLead = {
        ...lead,
        signals: nextSignals,
        score: calculateScore(business, nextSignals),
      };

      upsertLead(updatedLead);
      setInstagramInput(nextInstagram ?? "");
      setFacebookInput(nextFacebook ?? "");
      setLinktreeInput(nextLinktree ?? "");
      setSocialFormDirty(false);
      setSocialEnrichmentStatus(hasAnySocial ? "manual" : "not_found");

      const publishedLead = await fetchPublishedLead(business.id);
      if (publishedLead) {
        await publishLeadToServer(updatedLead);
      }

      showToast("Redes sociais atualizadas", "success");
    } catch {
      showToast("N\u00E3o foi poss\u00EDvel salvar as redes sociais", "warning");
    } finally {
      setSavingSocials(false);
    }
  };

  const handleCopyPublicLink = async () => {
    setCopyingLink(true);
    try {
      const links = demoShareUrl
        ? { demoUrl: demoShareUrl, imageUrl: screenshotShareUrl }
        : await resolveShareLinks();
      if (!links?.demoUrl) {
        showToast("Link p\u00FAblico indispon\u00EDvel - rode `npm run tunnel`", "warning");
        return;
      }

      await navigator.clipboard.writeText(links.demoUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      showToast("Link p\u00FAblico copiado", "success");
    } catch {
      showToast("N\u00E3o foi poss\u00EDvel copiar o link p\u00FAblico", "warning");
    } finally {
      setCopyingLink(false);
    }
  };

  const handleCopyScreenshotLink = async () => {
    setCopyingScreenshotLink(true);
    try {
      const links = screenshotShareUrl
        ? { demoUrl: demoShareUrl, imageUrl: screenshotShareUrl }
        : await resolveShareLinks();
      if (!links?.imageUrl) {
        showToast("Link da imagem indispon\u00EDvel - rode `npm run tunnel`", "warning");
        return;
      }

      await navigator.clipboard.writeText(links.imageUrl);
      showToast("Link da imagem copiado", "success");
    } catch {
      showToast("N\u00E3o foi poss\u00EDvel copiar o link da imagem", "warning");
    } finally {
      setCopyingScreenshotLink(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 pb-8 font-[family:var(--font-plus-jakarta)]">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-[#476246]" : "bg-[#765600]"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar para a tela anterior"
          className="inline-flex items-center gap-2 self-start rounded-full border border-[#dfe4db] bg-white px-4 py-2 text-sm font-semibold text-[#73808c] transition hover:border-[#cfd8c9] hover:text-[#0f2231]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="flex flex-wrap gap-2 text-xs text-[#73808c]">
          <span className="rounded-full bg-white px-3 py-2 shadow-[0_10px_24px_rgba(15,34,49,0.04)]">
            {PIPELINE_LABELS[currentStatus]}
          </span>
          <span className="rounded-full bg-white px-3 py-2 shadow-[0_10px_24px_rgba(15,34,49,0.04)]">
            Score {score.score}
          </span>
          {signals.whatsapp_detected ? (
            <span className="rounded-full bg-[#e7f6f2] px-3 py-2 text-[#127d63] shadow-[0_10px_24px_rgba(15,34,49,0.04)]">
              WhatsApp detectado
            </span>
          ) : null}
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className="space-y-5">
          <article className="rounded-[32px] border border-[#edf1f5] bg-white shadow-[0_12px_28px_rgba(15,34,49,0.05)] p-6 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#7b8792]">
              {"Oportunidade em analise"}
            </p>

            <div className="mt-4 flex items-start gap-4">
              <ScoreBadge score={score.score} band={score.priority_band} size="lg" />
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0f2231] md:text-4xl">
                  {business.normalized_name}
                </h1>
                <p className="mt-2 text-base leading-relaxed text-[#73808c]">
                  {business.category} em {business.region}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-[#73808c] shadow-[0_10px_24px_rgba(15,34,49,0.05)]">
                <MapPin className="h-4 w-4 text-[#6b7369]" />
                <span className="truncate">{business.address}</span>
              </div>

              {business.phone ? (
                <a href={`tel:${business.phone}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0a6e70] shadow-[0_10px_24px_rgba(15,34,49,0.05)] transition hover:bg-[#f8fbf5]">
                  <Phone className="h-4 w-4" />
                  {business.phone}
                </a>
              ) : null}

              {signals.website_url ? (
                <a href={signals.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0a6e70] shadow-[0_10px_24px_rgba(15,34,49,0.05)] transition hover:bg-[#f8fbf5]">
                  <Globe className="h-4 w-4 shrink-0" />
                  <span className="max-w-[18rem] truncate">{signals.website_url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {signals.instagram_url ? (
                <a href={signals.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#fff0f5] px-3 py-2 text-xs font-semibold text-[#b44777]">
                  <Camera className="h-3.5 w-3.5" />
                  Instagram
                </a>
              ) : null}
              {signals.facebook_url ? (
                <a href={signals.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-3 py-2 text-xs font-semibold text-[#355f9f]">
                  <Share2 className="h-3.5 w-3.5" />
                  Facebook
                </a>
              ) : null}
              {signals.whatsapp_detected ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f6ea] px-3 py-2 text-xs font-semibold text-[#2f6744]">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </span>
              ) : null}
              {signals.review_count > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#fff7df] px-3 py-2 text-xs font-semibold text-[#765600]">
                  <Star className="h-3.5 w-3.5" />
                  {signals.review_count} reviews{signals.average_rating ? ` (${signals.average_rating.toFixed(1)})` : ""}
                </span>
              ) : null}
            </div>
          </article>

          <article className="rounded-[32px] border border-[#edf1f5] bg-white shadow-[0_12px_28px_rgba(15,34,49,0.05)] p-5 shadow-[0_12px_28px_rgba(15,34,49,0.05)] md:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7b8792]">Oferta sugerida</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0f2231]">
              O que vender primeiro para este lead
            </h2>
            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="rounded-[24px] bg-[#f2f5ee] px-5 py-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7b8792]">
                  Leitura comercial
                </p>
                <p className="mt-3 text-lg font-semibold leading-snug text-[#0f2231]">
                  {salesInsight.mainProblem}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#73808c]">
                  {salesInsight.whyNow}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#0f2231]">
                    {salesInsight.suggestedOffer}
                  </span>
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-[#73808c]">
                    {salesInsight.suggestedPriceRange}
                  </span>
                  <span className="rounded-full bg-[#e7f6f2] px-3 py-2 text-xs font-semibold text-[#0a6e70]">
                    {salesInsight.urgencyLabel}
                  </span>
                </div>
              </div>

              <div className="rounded-[24px] bg-[linear-gradient(135deg,#fff3eb_0%,#fffaf6_100%)] px-5 py-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8e3900]">
                  Proximo passo recomendado
                </p>
                <p className="mt-3 text-lg font-semibold leading-snug text-[#8e3900]">
                  {salesInsight.nextStep}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#8b5b4a]">
                  Canal sugerido: {salesInsight.suggestedChannel}. Nicho identificado: {salesInsight.nicheLabel}.
                </p>
                <p className="mt-4 rounded-[20px] bg-white/70 px-4 py-3 text-sm leading-relaxed text-[#3f5c39]">
                  {salesInsight.recommendedMessage}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[32px] border border-[#edf1f5] bg-white shadow-[0_12px_28px_rgba(15,34,49,0.05)] p-5 md:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7b8792]">Abordagem</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0f2231]">Mensagem recomendada</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#73808c]">Use a mensagem por canal e avance o lead com contexto comercial mais claro.</p>
            <div className="mt-5">
              <ApproachMessage variants={approaches} phone={business.phone ?? undefined} whatsappDetected={signals.whatsapp_detected} />
            </div>
            <div className="mt-5 space-y-3 border-t border-[#dfe4db] pt-5">
              <div className="grid gap-3 xl:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-demo-link"
                    className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6b7369]"
                  >
                    Link da LP
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input id="lead-demo-link" type="text" readOnly aria-label="Link publico da landing page demonstrativa" value={resolvingShareUrls ? "Gerando link..." : demoShareUrl} placeholder="Suba o tunnel para gerar o link publico" className="min-w-0 flex-1 rounded-full border border-[#dde4ea] bg-white px-4 py-3 text-sm text-[#0f2231] placeholder:text-[#8a9388] focus:outline-none" />
                    <button type="button" onClick={handleCopyPublicLink} aria-label="Copiar link publico da landing page" disabled={copyingLink || !demoShareUrl} className={`w-full shrink-0 rounded-full px-4 py-3 text-sm font-semibold transition sm:w-auto ${copyingLink || !demoShareUrl ? "cursor-not-allowed bg-[#d8ddd5] text-[#98a094]" : linkCopied ? "bg-[#e7f6f2] text-[#0a6e70]" : "bg-[#0a5064] text-white shadow-[0_16px_32px_rgba(56,102,49,0.18)] hover:bg-[#08384a]"}`}>{linkCopied ? "Copiado!" : copyingLink ? "Copiando..." : "Copiar"}</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-image-link"
                    className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6b7369]"
                  >
                    Link da imagem
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input id="lead-image-link" type="text" readOnly aria-label="Link publico da imagem da demonstracao" value={resolvingShareUrls ? "Gerando imagem..." : screenshotShareUrl} placeholder="Suba o tunnel para gerar o link da imagem" className="min-w-0 flex-1 rounded-full border border-[#dde4ea] bg-white px-4 py-3 text-sm text-[#0f2231] placeholder:text-[#8a9388] focus:outline-none" />
                    <button type="button" onClick={handleCopyScreenshotLink} aria-label="Copiar link da imagem da demonstracao" disabled={copyingScreenshotLink || !screenshotShareUrl} className={`w-full shrink-0 rounded-full px-4 py-3 text-sm font-semibold transition sm:w-auto ${copyingScreenshotLink || !screenshotShareUrl ? "cursor-not-allowed bg-[#d8ddd5] text-[#98a094]" : "bg-white text-[#0a6e70] shadow-[0_10px_24px_rgba(15,34,49,0.05)] ring-1 ring-[#d8dfd4] hover:bg-[#f8fbf5]"}`}>{copyingScreenshotLink ? "Copiando..." : "Copiar"}</button>
                  </div>
                </div>
              </div>
              {!demoShareUrl && !resolvingShareUrls ? (<p className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Link publico indisponivel no momento. Suba o tunnel para gerar a LP e a imagem.</p>) : null}
            </div>
          </article>

          <article className="rounded-[32px] border border-[#edf1f5] bg-white shadow-[0_12px_28px_rgba(15,34,49,0.05)] p-5 md:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7b8792]">Presenca digital</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0f2231]">{"Presen\u00E7a digital"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#73808c]">Confira os sinais detectados e corrija manualmente as redes quando precisar.</p>
            <div className="mt-5 grid gap-2 md:grid-cols-2">
              <PresenceItem label={"Site pr\u00F3prio"} detected={signals.has_website} />
              <PresenceItem label="Instagram" detected={!!signals.instagram_url} />
              <PresenceItem label="Facebook" detected={!!signals.facebook_url} />
              <PresenceItem label="WhatsApp" detected={signals.whatsapp_detected} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#73808c]">
              <span className="rounded-full bg-white px-3 py-2 shadow-[0_10px_24px_rgba(15,34,49,0.04)]">{"Confian\u00E7a da detec\u00E7\u00E3o: "}{Math.round(signals.confidence * 100)}%</span>
              {socialEnrichmentStatus === "loading" ? (<span className="rounded-full bg-white px-3 py-2 shadow-[0_10px_24px_rgba(15,34,49,0.04)]">Verificando redes sociais a partir do site...</span>) : null}
              {socialEnrichmentStatus === "found" ? (<span className="rounded-full bg-[#e7f6f2] px-3 py-2 text-[#127d63]">Encontramos rede social automaticamente.</span>) : null}
              {socialEnrichmentStatus === "manual" ? (<span className="rounded-full bg-[#e7f6f2] px-3 py-2 text-[#127d63]">Redes sociais salvas manualmente.</span>) : null}
            </div>
            <div className="mt-5 space-y-3 border-t border-[#dfe4db] pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#0f2231]">Corrigir redes sociais</h3>
                  <p className="mt-1 text-xs text-[#73808c]">Cole a URL completa ou use um @handle.</p>
                </div>
                <button type="button" onClick={handleSaveSocials} aria-label="Salvar redes sociais corrigidas" disabled={!socialInputsChanged || savingSocials} className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${!socialInputsChanged || savingSocials ? "cursor-not-allowed bg-[#d8ddd5] text-[#98a094]" : "bg-[#0a5064] text-white shadow-[0_16px_32px_rgba(56,102,49,0.18)] hover:bg-[#08384a]"}`}><Save className="h-4 w-4" />{savingSocials ? "Salvando..." : "Salvar redes"}</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <SocialInput id="social-instagram" label="Instagram" placeholder="@analins.personalhair" value={instagramInput} onChange={(value) => { setInstagramInput(value); setSocialFormDirty(true); }} />
                <SocialInput id="social-facebook" label="Facebook" placeholder="facebook.com/sua-pagina" value={facebookInput} onChange={(value) => { setFacebookInput(value); setSocialFormDirty(true); }} />
                <SocialInput id="social-linktree" label="Linktree" placeholder="linktr.ee/sua-marca" value={linktreeInput} onChange={(value) => { setLinktreeInput(value); setSocialFormDirty(true); }} />
              </div>
            </div>
          </article>

          <article className="rounded-[32px] bg-[linear-gradient(135deg,#fff3eb_0%,#fffaf6_100%)] p-5 md:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#8e3900]">Demo comercial</p>
            <h2 className="mt-3 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#8e3900]"><Eye className="h-5 w-5" />{"Site de demonstra\u00E7\u00E3o"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#8b5b4a]">A mensagem fica sem links no corpo. Compartilhe a LP e a imagem pelos campos acima e abra a demo quando quiser revisar.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={`/site/${business.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir site demo de ${business.normalized_name}`} className="inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-full bg-[#0a5064] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(0,91,113,0.24)] transition hover:bg-[#08384a]"><Eye className="h-4 w-4" />Ver site demo</a>
            </div>
          </article>
        </div>

        <div className="space-y-5">
          <article className="rounded-[32px] bg-[linear-gradient(135deg,#dff0d3_0%,#edf6e7_100%)] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#8e3900]">Vendabilidade</p>
            <p className="mt-3 text-5xl font-extrabold tracking-tight text-[#2f512a]">{score.score}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#4b6747]">
              {`${positiveReasons.length} sinais positivos e ${negativeReasons.length} pontos de atencao neste lead.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-2 text-xs font-bold ${PRIORITY_BAND_COLORS[score.priority_band]}`}>{PRIORITY_BAND_LABELS[score.priority_band]}</span>
              <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#73808c]">{PIPELINE_LABELS[currentStatus]}</span>
            </div>
          </article>

          <article className="rounded-[32px] border border-[#edf1f5] bg-white shadow-[0_12px_28px_rgba(15,34,49,0.05)] p-5 shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7b8792]">Score de vendabilidade</p>
            <div className="mt-4 space-y-2">
              {displayedReasons.map((reason, i) => (
                <div key={i} className="flex items-center justify-between rounded-[20px] bg-[#f3f6ef] px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    {reason.points > 0 ? (<TrendingUp className="h-3.5 w-3.5 text-[#0a6e70]" />) : (<TrendingDown className="h-3.5 w-3.5 text-[#b55b5b]" />)}
                    <span className="text-[#0f2231]">{reason.label}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${reason.points > 0 ? "text-[#0a6e70]" : "text-[#b55b5b]"}`}>{reason.points > 0 ? "+" : ""}{reason.points}</span>
                </div>
              ))}
            </div>
            {score.score_reasons.length > 3 ? (<button type="button" aria-expanded={showAllReasons} onClick={() => setShowAllReasons(!showAllReasons)} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0a6e70] hover:underline">{showAllReasons ? (<><ChevronUp className="h-3 w-3" />Mostrar menos</>) : (<><ChevronDown className="h-3 w-3" />Ver todos ({score.score_reasons.length})</>)}</button>) : null}
            <div className="mt-5 border-t border-[#e2e8dc] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#0f2231]">Score total</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-[#0f2231]">{score.score}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${PRIORITY_BAND_COLORS[score.priority_band]}`}>{PRIORITY_BAND_LABELS[score.priority_band]}</span>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[32px] border border-[#edf1f5] bg-white shadow-[0_12px_28px_rgba(15,34,49,0.05)] p-5 md:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7b8792]">Pipeline</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0f2231]">{"Status da negocia\u00E7\u00E3o"}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {(Object.entries(PIPELINE_LABELS) as [PipelineStatus, string][]).map(([status, label]) => (
                <button key={status} type="button" aria-pressed={currentStatus === status} onClick={() => handleStatusChange(status)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${currentStatus === status ? PIPELINE_COLORS[status] + " border-current" : "border-[#dde4ea] bg-white text-[#73808c] hover:border-[#d3dde6]"}`}>{label}</button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange("abordado")}
                className="rounded-full bg-[#fff2c9] px-4 py-2 text-xs font-semibold text-[#765600] transition hover:opacity-90"
              >
                Registrar abordagem enviada
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("respondeu")}
                className="rounded-full bg-[#e9e8ff] px-4 py-2 text-xs font-semibold text-[#5a53a6] transition hover:opacity-90"
              >
                Registrar resposta recebida
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="lead-proposed-value" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#6b7369]"><DollarSign className="h-3.5 w-3.5" />Valor proposto</label>
                <div className="flex items-center gap-2 rounded-[24px] border border-[#dde4ea] bg-white px-4 py-3">
                  <span className="text-sm font-semibold text-[#73808c]">R$</span>
                  <input id="lead-proposed-value" type="text" aria-label="Valor proposto para este lead" value={proposedValue || (pipeline?.proposed_value?.toString() ?? "")} onChange={(e) => setProposedValue(e.target.value)} onBlur={() => { const num = parseFloat(proposedValue.replace(/[^\d,.]/g, "").replace(",", ".")); if (!isNaN(num) && num > 0) { updatePipelineFields(business.id, { proposed_value: num }); } setProposedValue(""); }} placeholder="0,00" className="flex-1 bg-transparent text-sm text-[#0f2231] outline-none placeholder:text-[#8a9388]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lead-next-followup" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#6b7369]"><Calendar className="h-3.5 w-3.5" />{"Pr\u00F3ximo follow-up"}</label>
                <input id="lead-next-followup" type="date" aria-label="Selecionar proximo follow-up" value={nextFollowup || (pipeline?.next_followup ?? "")} onChange={(e) => { setNextFollowup(e.target.value); updatePipelineFields(business.id, { next_followup: e.target.value || null }); }} className="w-full rounded-[24px] border border-[#dde4ea] bg-white px-4 py-3 text-sm text-[#0f2231] outline-none" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lead-notes" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#6b7369]"><StickyNote className="h-3.5 w-3.5" />{"Coment\u00E1rios do lead"}</label>
                <textarea id="lead-notes" aria-label="Comentarios internos do lead" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => { updatePipelineFields(business.id, { notes }); }} placeholder={"Anota\u00E7\u00F5es sobre a negocia\u00E7\u00E3o, contexto do cliente, pr\u00F3ximos passos..."} className="h-28 w-full resize-none rounded-[24px] border border-[#dde4ea] bg-white px-4 py-3 text-sm text-[#0f2231] outline-none placeholder:text-[#8a9388]" />
              </div>
            </div>
            {pipeline?.last_contact_at ? (<p className="mt-4 text-xs text-[#73808c]">{"\u00DAltimo contato:"}{" "}{new Date(pipeline.last_contact_at).toLocaleDateString("pt-BR")}</p>) : null}
          </article>

          <article className="rounded-[32px] border border-[#edf1f5] bg-white shadow-[0_12px_28px_rgba(15,34,49,0.05)] p-5 shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7b8792]">Acoes</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0f2231]">
              Decisao rapida
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#73808c]">
              Salve este lead para seguir no funil ou descarte se ele nao fizer sentido agora.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <button type="button" aria-label={`Salvar ${business.normalized_name} no pipeline`} onClick={() => { saveLead(business.id); router.back(); }} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#0a5064] to-[#0b7b8a] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_34px_rgba(0,91,113,0.2)] transition hover:opacity-90"><Bookmark className="h-4 w-4" />Salvar lead</button>
              <button type="button" aria-label={`Descartar ${business.normalized_name}`} onClick={() => { discardLead(business.id); router.back(); }} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#eef2ea] px-6 py-3 text-sm font-semibold text-[#73808c] transition hover:bg-[#e4eadf]"><Trash2 className="h-4 w-4" />Descartar lead</button>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function PresenceItem({
  label,
  detected,
}: {
  label: string;
  detected: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-[20px] px-4 py-3 text-xs font-semibold ${
        detected
          ? "bg-white text-[#0a6e70]"
          : "bg-white text-[#b55b5b]"
      }`}
    >
      <div
        className={`h-2 w-2 rounded-full ${
          detected ? "bg-[#0a5064]" : "bg-[#d17d7d]"
        }`}
      />
      {label}
      <span className="ml-auto text-[10px] opacity-70">
        {detected ? "Detectado" : "N\u00E3o detectado"}
      </span>
    </div>
  );
}

function SocialInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span
        className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b7369]"
      >
        {label}
      </span>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-[#dde4ea] bg-white px-4 py-3 text-sm text-[#0f2231] outline-none transition placeholder:text-[#8a9388] focus:border-[#386631] focus:ring-2 focus:ring-[#386631]/10"
      />
    </label>
  );
}




