import Link from "next/link";
import { Lead, PIPELINE_LABELS } from "@/lib/types";
import CategoryLogo from "@/components/CategoryLogo";
import ScoreBadge from "@/components/ScoreBadge";
import { getLeadSalesInsight } from "@/lib/sales-intelligence";
import {
  ArrowUpRight,
  Camera,
  Globe,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";

interface AdminLeadRowProps {
  lead: Lead;
  onOpenWhatsApp?: (lead: Lead) => void;
}

const PRESENCE_LABELS = {
  site_proprio: "Site proprio",
  so_redes_sociais: "So redes sociais",
  sem_site_detectado: "Sem site detectado",
  indeterminado: "Presenca indefinida",
};

const PRESENCE_TONES = {
  site_proprio: "bg-[#edf7e8] text-[#3e6037]",
  so_redes_sociais: "bg-[#fff2c9] text-[#765600]",
  sem_site_detectado: "bg-[#dceccc] text-[#386631]",
  indeterminado: "bg-[#f0f3ed] text-[#626a61]",
};

function formatDistance(distance: number | null | undefined): string | null {
  if (typeof distance !== "number" || !Number.isFinite(distance)) return null;
  if (distance < 1000) return `${Math.round(distance)} m`;
  return `${(distance / 1000).toFixed(distance < 10000 ? 1 : 0)} km`;
}

export default function AdminLeadRow({
  lead,
  onOpenWhatsApp,
}: AdminLeadRowProps) {
  const distanceLabel = formatDistance(lead.distance_meters);
  const statusLabel = lead.pipeline
    ? PIPELINE_LABELS[lead.pipeline.status]
    : "Novo lead";
  const insight = getLeadSalesInsight(lead);

  return (
    <article className="group rounded-[28px] border border-[#e1e6dc] bg-[#fbfdf8] px-5 py-5 shadow-[0_14px_32px_rgba(59,74,56,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(59,74,56,0.08)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <CategoryLogo
            category={lead.business.category}
            businessName={lead.business.normalized_name}
            primaryColor={lead.signals.brand_color ?? "#5f8e57"}
            size={58}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold tracking-tight text-[#191d17]">
                  {lead.business.normalized_name}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-[#687069]">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{lead.business.region}</span>
                </p>
              </div>

              <div className="shrink-0">
                <ScoreBadge
                  score={lead.score.score}
                  band={lead.score.priority_band}
                  size="sm"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {distanceLabel ? (
                <span className="rounded-full bg-[#f1f6ec] px-3 py-1 text-[11px] font-medium text-[#43603f]">
                  {distanceLabel}
                </span>
              ) : null}

              <span
                className={`rounded-full px-3 py-1 text-[11px] font-medium ${PRESENCE_TONES[lead.signals.presence_status]}`}
              >
                {PRESENCE_LABELS[lead.signals.presence_status]}
              </span>

              {lead.signals.instagram_url ? (
                <span className="rounded-full bg-[#fff3f8] px-3 py-1 text-[11px] font-medium text-[#9f4b72]">
                  <Camera className="mr-1 inline h-3.5 w-3.5" />
                  Instagram
                </span>
              ) : null}

              {lead.signals.whatsapp_detected ? (
                <span className="rounded-full bg-[#eef7f0] px-3 py-1 text-[11px] font-medium text-[#2f6744]">
                  <MessageCircle className="mr-1 inline h-3.5 w-3.5" />
                  WhatsApp
                </span>
              ) : null}

              {lead.signals.review_count > 0 ? (
                <span className="rounded-full bg-[#fff7df] px-3 py-1 text-[11px] font-medium text-[#7a5d08]">
                  <Star className="mr-1 inline h-3.5 w-3.5" />
                  {lead.signals.review_count} reviews
                </span>
              ) : null}
            </div>

            <div className="mt-4 rounded-[24px] bg-[#f2f5ee] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7b8278]">
                Leitura comercial
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#386631]">
                <Sparkles className="h-4 w-4" />
                {insight.mainProblem}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-[#191d17]">
                  Oferta: {insight.suggestedOffer}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 font-medium text-[#687069]">
                  Faixa: {insight.suggestedPriceRange}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 font-medium text-[#687069]">
                  {insight.urgencyLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[24rem] xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7a8278]">
                Nicho e contato
              </p>
              <p className="mt-1 text-sm font-semibold text-[#42493f]">
                {lead.business.category}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {lead.business.phone ? (
                <span className="rounded-full bg-[#f4f7f1] px-3 py-1 text-[11px] font-medium text-[#4e5750]">
                  <Phone className="mr-1 inline h-3.5 w-3.5" />
                  {lead.business.phone}
                </span>
              ) : null}

              {lead.signals.website_url ? (
                <span className="rounded-full bg-[#f4f7f1] px-3 py-1 text-[11px] font-medium text-[#4e5750]">
                  <Globe className="mr-1 inline h-3.5 w-3.5" />
                  Site
                </span>
              ) : null}
            </div>

            <p className="text-xs leading-relaxed text-[#626963]">
              {insight.recommendedMessage}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start xl:flex-col xl:items-end">
            <span className="rounded-full bg-[#e4f1db] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#386631]">
              {statusLabel}
            </span>

            <div className="flex items-center gap-2">
              {lead.signals.whatsapp_detected && lead.business.phone ? (
                <button
                  type="button"
                  onClick={() => onOpenWhatsApp?.(lead)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef7f0] text-[#2f6744] transition hover:bg-[#e2f0e7]"
                  aria-label={`Abrir WhatsApp de ${lead.business.normalized_name}`}
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              ) : null}

              <Link
                href={`/lead/${lead.business.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#4d7d46] to-[#386631] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(56,102,49,0.18)] transition hover:opacity-90"
              >
                Abrir oportunidade
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
