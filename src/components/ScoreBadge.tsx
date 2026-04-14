"use client";

import { PriorityBand } from "@/lib/types";
import { PRIORITY_BAND_COLORS, PRIORITY_BAND_LABELS } from "@/lib/scoring";

interface ScoreBadgeProps {
  score: number;
  band: PriorityBand;
  size?: "sm" | "md" | "lg";
}

export default function ScoreBadge({ score, band, size = "md" }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-16 h-16 text-xl",
  };

  const ringColors: Record<PriorityBand, string> = {
    alta: "ring-red-400",
    media_alta: "ring-orange-400",
    media: "ring-yellow-400",
    baixa: "ring-gray-300",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ring-2 ${ringColors[band]} ${PRIORITY_BAND_COLORS[band]}`}
        title={PRIORITY_BAND_LABELS[band]}
      >
        {score}
      </div>
      {size === "lg" && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BAND_COLORS[band]}`}>
          {PRIORITY_BAND_LABELS[band]}
        </span>
      )}
    </div>
  );
}
