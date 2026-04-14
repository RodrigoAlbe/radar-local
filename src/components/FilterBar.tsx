"use client";

import { SearchFilters } from "@/lib/types";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  totalCount: number;
  filteredCount: number;
}

export default function FilterBar({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCount = [
    filters.semSite,
    filters.soRedesSociais,
    filters.comTelefone,
    filters.comWhatsapp,
    filters.minReviews > 0,
    filters.excluirFranquias,
  ].filter(Boolean).length;

  const toggle = (key: keyof SearchFilters) => {
    if (key === "minReviews") return;
    onChange({ ...filters, [key]: !filters[key] });
  };

  const clearAll = () => {
    onChange({
      semSite: false,
      soRedesSociais: false,
      comTelefone: false,
      comWhatsapp: false,
      minReviews: 0,
      excluirFranquias: false,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {activeCount > 0 && (
            <span className="bg-primary text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        <span className="text-xs text-muted">
          {filteredCount} de {totalCount} leads
        </span>
      </div>

      {expanded && (
        <div className="bg-white rounded-xl border border-border p-3 space-y-2 animate-slide-up">
          <FilterChip
            label="Sem site detectado"
            active={filters.semSite}
            onClick={() => toggle("semSite")}
          />
          <FilterChip
            label="Só redes sociais"
            active={filters.soRedesSociais}
            onClick={() => toggle("soRedesSociais")}
          />
          <FilterChip
            label="Com telefone"
            active={filters.comTelefone}
            onClick={() => toggle("comTelefone")}
          />
          <FilterChip
            label="Com WhatsApp"
            active={filters.comWhatsapp}
            onClick={() => toggle("comWhatsapp")}
          />
          <FilterChip
            label="Excluir franquias"
            active={filters.excluirFranquias}
            onClick={() => toggle("excluirFranquias")}
          />

          <div className="flex items-center gap-2 pt-1">
            <label className="text-xs text-muted">Mín. reviews:</label>
            <input
              type="number"
              min={0}
              value={filters.minReviews}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minReviews: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              className="w-16 text-xs border border-border rounded-lg px-2 py-1.5 bg-background"
            />
          </div>

          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-danger hover:underline pt-1"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-background text-muted border-border hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}
