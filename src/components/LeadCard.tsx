"use client";

import Link from "next/link";
import { Lead, PIPELINE_LABELS, PIPELINE_COLORS } from "@/lib/types";
import ScoreBadge from "./ScoreBadge";
import {
  MapPin,
  Phone,
  Globe,
  Camera,
  MessageCircle,
  Star,
  ChevronRight,
} from "lucide-react";

interface LeadCardProps {
  lead: Lead;
}

export default function LeadCard({ lead }: LeadCardProps) {
  const { business, signals, score, pipeline, distance_meters } = lead;

  const presenceLabel = {
    site_proprio: "Site próprio",
    so_redes_sociais: "Só redes sociais",
    sem_site_detectado: "Sem site detectado",
    indeterminado: "Indeterminado",
  }[signals.presence_status];

  const presenceColor = {
    site_proprio: "text-green-600 bg-green-50",
    so_redes_sociais: "text-amber-600 bg-amber-50",
    sem_site_detectado: "text-red-600 bg-red-50",
    indeterminado: "text-gray-500 bg-gray-50",
  }[signals.presence_status];

  const topReason = score.score_reasons.find((r) => r.points > 0);
  const distanceLabel =
    typeof distance_meters === "number" && Number.isFinite(distance_meters)
      ? distance_meters < 1000
        ? `${Math.round(distance_meters)} m`
        : `${(distance_meters / 1000).toFixed(distance_meters < 10000 ? 1 : 0)} km`
      : null;

  return (
    <Link href={`/lead/${business.id}`}>
      <div className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-all active:scale-[0.98] animate-slide-up">
        <div className="flex items-start gap-3">
          <ScoreBadge score={score.score} band={score.priority_band} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate text-[15px]">
                  {business.normalized_name}
                </h3>
                <p className="text-xs text-muted mt-0.5">{business.category}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted flex-shrink-0 mt-1" />
            </div>

            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{business.address}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {distanceLabel && (
                <span className="inline-flex items-center gap-1 text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {distanceLabel}
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${presenceColor}`}
              >
                <Globe className="w-3 h-3" />
                {presenceLabel}
              </span>

              {signals.instagram_url && (
                <span className="inline-flex items-center gap-1 text-[11px] text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                  <Camera className="w-3 h-3" />
                  IG
                </span>
              )}

              {signals.whatsapp_detected && (
                <span className="inline-flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <MessageCircle className="w-3 h-3" />
                  Zap
                </span>
              )}

              {business.phone && (
                <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  <Phone className="w-3 h-3" />
                  Tel
                </span>
              )}

              {signals.review_count > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3" />
                  {signals.review_count} reviews
                </span>
              )}
            </div>

            {topReason && (
              <p className="text-[11px] text-primary mt-2 font-medium">
                {topReason.label}
              </p>
            )}

            {pipeline && (
              <span
                className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-2 ${PIPELINE_COLORS[pipeline.status]}`}
              >
                {PIPELINE_LABELS[pipeline.status]}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
