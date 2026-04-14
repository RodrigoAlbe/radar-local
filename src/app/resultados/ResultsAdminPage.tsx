"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Camera,
  Loader2,
  Search,
  SearchX,
  Workflow,
} from "lucide-react";
import { getLeadSalesInsight } from "@/lib/sales-intelligence";
import { useStore } from "@/lib/store";
import { SearchFilters, type Lead } from "@/lib/types";

type SortMode = "relevance" | "score" | "reviews" | "name";

const INITIAL_FILTERS: SearchFilters = {
  semSite: false,
  soRedesSociais: false,
  comTelefone: false,
  comWhatsapp: false,
  minReviews: 0,
  excluirFranquias: false,
};

function normalizeTerm(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function leadInitials(lead: Lead) {
  return lead.business.normalized_name.slice(0, 3).toUpperCase();
}

function hasFranchiseSignal(lead: Lead) {
  return lead.score.score_reasons.some((reason) => reason.label === "Franquia ou rede");
}

export default function ResultsAdminPage() {
  const {
    state,
    getFilteredLeads,
    isHydrated,
    saveLead,
    discardLead,
  } = useStore();
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeads = useMemo(() => {
    const leads = getFilteredLeads(filters);

    if (sortMode === "relevance") {
      return leads;
    }

    return [...leads].sort((a, b) => {
      switch (sortMode) {
        case "score":
          return b.score.score - a.score.score;
        case "reviews":
          return b.signals.review_count - a.signals.review_count;
        case "name":
          return a.business.normalized_name.localeCompare(b.business.normalized_name);
        default:
          return 0;
      }
    });
  }, [filters, getFilteredLeads, sortMode]);

  const displayedLeads = useMemo(() => {
    const query = normalizeTerm(searchTerm);
    if (!query) return filteredLeads;

    return filteredLeads.filter((lead) => {
      const haystack = normalizeTerm(
        `${lead.business.normalized_name} ${lead.business.category} ${lead.business.region}`,
      );

      return haystack.includes(query);
    });
  }, [filteredLeads, searchTerm]);

  const selectedCount = useMemo(() => {
    const currentIds = new Set(state.currentResultIds);
    return state.savedLeads.filter((id) => currentIds.has(id)).length;
  }, [state.currentResultIds, state.savedLeads]);

  const updateFilter = (key: keyof SearchFilters, value?: boolean | number) => {
    setFilters((current) => ({
      ...current,
      [key]: value ?? !(current[key] as boolean),
    }));
  };

  if (!isHydrated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#005b71]" />
        <p className="text-sm text-[#73808c]">Carregando leads...</p>
      </div>
    );
  }

  if (state.currentResultIds.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <SearchX className="h-12 w-12 text-[#9aa6b2]" />
        <div>
          <h2 className="text-lg font-semibold text-[#0f2231]">Nenhuma busca realizada</h2>
          <p className="mt-1 text-sm text-[#73808c]">
            Rode uma busca para preencher a etapa de triagem.
          </p>
        </div>
        <Link
          href="/search"
          className="rounded-xl bg-[#0a5064] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          Ir para busca
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 pb-24">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7b8792]">
              Prospecting engine
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#082d45] md:text-5xl">
              Busca e Triagem
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#73808c]">
              Identifique leads de alta conversao atraves de inteligencia geografica, score comercial e sinais de maturidade digital.
            </p>
          </div>
          <div className="rounded-[20px] bg-[#fff3eb] px-5 py-4 shadow-[0_12px_28px_rgba(142,57,0,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8e3900]">Hot leads today</p>
            <p className="mt-2 text-3xl font-black text-[#082d45]">{displayedLeads.length}</p>
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-[0_12px_28px_rgba(15,34,49,0.05)] md:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_140px_200px]">
            <FieldRow label="Localizacao">
              <span className="truncate">{state.searchJobs[0]?.region ?? "Sem localizacao recente"}</span>
            </FieldRow>
            <FieldRow label="Categoria">
              <span className="truncate">{state.searchJobs[0]?.category ?? "Todas"}</span>
            </FieldRow>
            <FieldRow label="Raio de busca">
              <span>{state.searchJobs[0]?.radius ?? 0} km</span>
            </FieldRow>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a5064] px-5 py-4 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              Atualizar Radar
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#7b8792]">
                Filtros rapidos
              </span>
              <FilterChip active={filters.semSite} label="Sem site" onClick={() => updateFilter("semSite")} />
              <FilterChip active={filters.soRedesSociais} label="Social only" onClick={() => updateFilter("soRedesSociais")} />
              <FilterChip active={filters.comWhatsapp} label="WhatsApp" onClick={() => updateFilter("comWhatsapp")} />
              <FilterChip active={filters.minReviews === 0} label="Low rating" onClick={() => updateFilter("minReviews", 0)} />
              <FilterChip active={filters.minReviews === 20} label="20+ reviews" onClick={() => updateFilter("minReviews", filters.minReviews === 20 ? 0 : 20)} />
            </div>

            <div className="flex items-center gap-2 rounded-full bg-[#f1f5f8] px-4 py-2 text-sm text-[#5f6f7d]">
              <span>Ordenar por</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="bg-transparent font-semibold text-[#0f2231] outline-none"
              >
                <option value="relevance">Relevancia</option>
                <option value="score">Score</option>
                <option value="reviews">Reviews</option>
                <option value="name">Nome</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a97a2]" />
          <input
            id="page-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar rapida de empresas..."
            className="w-full rounded-full border-none bg-[#e9edf2] py-3 pl-11 pr-4 text-sm text-[#0f2231] outline-none placeholder:text-[#8a97a2]"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {displayedLeads.map((lead) => {
            const insight = getLeadSalesInsight(lead);
            const saved = state.savedLeads.includes(lead.business.id);

            return (
              <article
                key={lead.business.id}
                className="rounded-[24px] bg-white p-5 shadow-[0_12px_28px_rgba(15,34,49,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dde8ef] text-sm font-bold text-[#0b3348]">
                      {leadInitials(lead)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-[#0f2231]">
                        {lead.business.normalized_name}
                      </h2>
                      <p className="truncate text-sm text-[#73808c]">
                        {lead.business.category}
                      </p>
                      {lead.signals.review_count > 0 ? (
                        <p className="mt-1 text-xs text-[#8a97a2]">
                          {lead.signals.review_count} reviews
                          {lead.signals.average_rating ? ` (${lead.signals.average_rating.toFixed(1)})` : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8792]">
                      Vendability score
                    </p>
                    <p className="mt-2 text-3xl font-black text-[#082d45]">
                      {lead.score.score}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {lead.signals.presence_status === "sem_site_detectado" ? (
                    <Badge tone="danger" label="No website" />
                  ) : null}
                  {lead.signals.has_social_only ? <Badge tone="muted" label="Instagram first" icon={<Camera className="h-3.5 w-3.5" />} /> : null}
                  {lead.signals.whatsapp_detected ? <Badge tone="good" label="WhatsApp ready" /> : null}
                  {hasFranchiseSignal(lead) ? <Badge tone="ghost" label="Franchise" /> : null}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_150px]">
                  <div>
                    <p className="text-sm font-semibold text-[#0f2231]">{insight.mainProblem}</p>
                    <p className="mt-2 text-xs leading-relaxed text-[#73808c]">
                      Oferta sugerida: {insight.suggestedOffer}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f6f8fb] px-4 py-4 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8792]">Faixa</p>
                    <p className="mt-2 text-sm font-bold text-[#082d45]">{insight.suggestedPriceRange}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <Link
                    href={`/lead/${lead.business.id}`}
                    className="text-sm font-semibold text-[#0b3348] transition hover:text-[#0a6e70]"
                  >
                    Ver Detalhes
                  </Link>

                  <div className="flex items-center gap-2">
                    {saved ? (
                      <button
                        type="button"
                        onClick={() => discardLead(lead.business.id)}
                        className="rounded-xl bg-[#eef2f6] px-4 py-2 text-sm font-semibold text-[#5f6f7d] transition hover:bg-[#e5ebf0]"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => saveLead(lead.business.id)}
                        className="rounded-xl bg-[#0a5064] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                      >
                        Salvar Lead
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedCount > 0 ? (
        <div className="fixed bottom-24 right-4 z-40 rounded-[20px] bg-[#08384a] px-5 py-4 text-white shadow-[0_20px_40px_rgba(8,56,74,0.24)] lg:bottom-8 lg:right-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#70d0de]">
            Selecionados
          </p>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <p className="text-2xl font-black">{selectedCount} leads</p>
              <p className="text-xs text-white/70">prontos para pipeline</p>
            </div>
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0b7b8a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Workflow className="h-4 w-4" />
              Ir para pipeline
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a97a2]">{label}</p>
      <div className="min-h-6 text-sm font-medium text-[#0f2231]">{children}</div>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
        active ? "bg-[#d8f4f6] text-[#0a6e70]" : "bg-[#f1f5f8] text-[#5f6f7d] hover:bg-[#e7edf2]"
      }`}
    >
      {label}
    </button>
  );
}

function Badge({
  tone,
  label,
  icon,
}: {
  tone: "danger" | "muted" | "good" | "ghost";
  label: string;
  icon?: React.ReactNode;
}) {
  const toneClass = {
    danger: "bg-[#fff0ed] text-[#b0441c]",
    muted: "bg-[#eef3f7] text-[#4f6472]",
    good: "bg-[#ebf8ef] text-[#206b4d]",
    ghost: "bg-[#f3f5f8] text-[#7a8792]",
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${toneClass}`}>
      {icon}
      {label}
    </span>
  );
}
