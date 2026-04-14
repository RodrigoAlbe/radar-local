"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  Inbox,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PIPELINE_LABELS, type Lead, type PipelineStatus } from "@/lib/types";

const STATUSES: PipelineStatus[] = [
  "novo",
  "abordado",
  "respondeu",
  "negociando",
  "proposta_enviada",
  "convertido",
  "sem_interesse",
];

const NEXT_STATUS: Partial<Record<PipelineStatus, PipelineStatus>> = {
  novo: "abordado",
  abordado: "respondeu",
  respondeu: "negociando",
  negociando: "proposta_enviada",
  proposta_enviada: "convertido",
};

const DRAG_TYPE = "application/radar-pipeline";

const COLUMN_META: Record<PipelineStatus, { badge: string; dot: string }> = {
  novo: { badge: "Nova", dot: "bg-[#46d6e3]" },
  abordado: { badge: "Abordado", dot: "bg-[#b0441c]" },
  respondeu: { badge: "Respondeu", dot: "bg-[#68cc94]" },
  negociando: { badge: "Negociando", dot: "bg-[#3b7d91]" },
  proposta_enviada: { badge: "Proposta", dot: "bg-[#0b6d84]" },
  convertido: { badge: "Convertido", dot: "bg-[#1d8f61]" },
  sem_interesse: { badge: "Descartado", dot: "bg-[#9aa6b2]" },
};

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function normalizeTerm(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isOverdue(iso: string | null | undefined) {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

function isToday(iso: string | null | undefined) {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function getLeadPriorityRank(lead: Lead) {
  const followup = lead.pipeline?.next_followup;
  if (followup && isOverdue(followup)) return 0;
  if (followup && isToday(followup)) return 1;
  if (lead.pipeline?.proposed_value) return 2;
  return 3;
}

function getPipelineSortTimestamp(lead: Lead, status: PipelineStatus) {
  if (status === "novo") {
    return new Date(lead.pipeline?.created_at ?? lead.business.created_at ?? 0).getTime();
  }

  return new Date(
    lead.pipeline?.last_contact_at ??
      lead.pipeline?.created_at ??
      lead.business.created_at ??
      0,
  ).getTime();
}

function getFollowupLabel(followup: string | null | undefined) {
  if (!followup) return "Sem follow-up";
  if (isOverdue(followup)) return "Atrasado";
  if (isToday(followup)) return "Hoje";
  return new Date(`${followup}T12:00:00`).toLocaleDateString("pt-BR");
}

function leadInitials(lead: Lead) {
  return lead.business.normalized_name.slice(0, 3).toUpperCase();
}

export default function PipelineAdminPage() {
  const { getPipelineLeads, updatePipeline, isHydrated } = useStore();
  const pipeline = getPipelineLeads();
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PipelineStatus | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const findLeadById = useCallback(
    (id: string): Lead | undefined => {
      for (const list of Object.values(pipeline)) {
        const found = list.find((lead) => lead.business.id === id);
        if (found) return found;
      }
      return undefined;
    },
    [pipeline],
  );

  const handleAdvance = (lead: Lead, to: PipelineStatus) => {
    updatePipeline(lead.business.id, to);
    showToast(`${lead.business.normalized_name} movido para ${PIPELINE_LABELS[to]}`);
  };

  const onDragStart = (
    event: React.DragEvent,
    businessId: string,
    fromStatus: PipelineStatus,
  ) => {
    event.dataTransfer.setData(
      DRAG_TYPE,
      JSON.stringify({ businessId, fromStatus }),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const onColumnDrop = (event: React.DragEvent, toStatus: PipelineStatus) => {
    event.preventDefault();
    setDragOverColumn(null);
    const raw = event.dataTransfer.getData(DRAG_TYPE);
    if (!raw) return;

    try {
      const { businessId, fromStatus } = JSON.parse(raw) as {
        businessId: string;
        fromStatus: PipelineStatus;
      };

      if (fromStatus === toStatus) return;
      const lead = findLeadById(businessId);
      if (!lead) return;
      handleAdvance(lead, toStatus);
    } catch {
      // ignore invalid payload
    }
  };

  const totalLeads = Object.values(pipeline).flat().length;
  const totalValue = Object.values(pipeline)
    .flat()
    .reduce((sum, lead) => sum + (lead.pipeline?.proposed_value ?? 0), 0);
  const activeLeads = totalLeads - pipeline.sem_interesse.length - pipeline.convertido.length;
  const criticalFollowups = Object.values(pipeline)
    .flat()
    .filter((lead) => isOverdue(lead.pipeline?.next_followup)).length;
  const conversionRate = totalLeads ? `${Math.round((pipeline.convertido.length / totalLeads) * 100)}%` : "0%";

  const visiblePipeline = useMemo(() => {
    const query = normalizeTerm(searchTerm.trim());

    return Object.fromEntries(
      STATUSES.map((status) => {
        const leads = [...pipeline[status]]
          .filter((lead) => {
            if (!query) return true;

            const haystack = normalizeTerm(
              `${lead.business.normalized_name} ${lead.business.category} ${lead.business.region}`,
            );

            return haystack.includes(query);
          })
          .sort((a, b) => {
            const priorityDelta = getLeadPriorityRank(a) - getLeadPriorityRank(b);
            if (priorityDelta !== 0) return priorityDelta;

            const recencyDelta =
              getPipelineSortTimestamp(b, status) - getPipelineSortTimestamp(a, status);
            if (recencyDelta !== 0) return recencyDelta;

            return b.score.score - a.score.score;
          });

        return [status, leads];
      }),
    ) as Record<PipelineStatus, Lead[]>;
  }, [pipeline, searchTerm]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#005b71]" />
        <p className="text-sm text-[#73808c]">Carregando pipeline...</p>
      </div>
    );
  }

  if (totalLeads === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Inbox className="h-12 w-12 text-[#9aa6b2]" />
        <div>
          <h2 className="text-lg font-semibold text-[#0f2231]">Pipeline vazio</h2>
          <p className="mt-1 text-sm text-[#73808c]">
            Faça uma busca e comece a abordar leads.
          </p>
        </div>
        <Link
          href="/search"
          className="rounded-xl bg-[#0a5064] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          Buscar leads
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 pb-8">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0b6d84] px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TopCard label="Leads ativos" value={String(activeLeads)} helper="+ 12% neste mes" />
        <TopCard label="Valor proposto" value={formatMoney(totalValue)} helper="Ticket medio: 5,9k" />
        <TopCard label="Follow-ups criticos" value={String(criticalFollowups)} helper="Acoes atrasadas" accent />
        <TopCard label="Taxa de conversao" value={conversionRate} helper="Top 10% da carteira" />
      </section>

      <section className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a97a2]" />
          <input
            id="page-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Buscar leads no pipeline"
            placeholder="Buscar leads, empresas..."
            className="w-full rounded-full border-none bg-[#e9edf2] py-3 pl-11 pr-4 text-sm text-[#0f2231] outline-none placeholder:text-[#8a97a2]"
          />
        </div>

        <Link
          href="/search"
          aria-label="Criar uma nova prospeccao"
          className="hidden rounded-xl bg-[#0a5064] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 lg:inline-flex"
        >
          Nova prospeccao
        </Link>
      </section>

      <section className="overflow-x-auto pb-3">
        <div className="grid min-w-[1180px] gap-5 xl:grid-cols-7">
          {STATUSES.map((status) => (
            <div
              key={status}
              role="region"
              aria-labelledby={`pipeline-column-${status}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverColumn(status);
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(event) => onColumnDrop(event, status)}
              className={`min-h-[520px] rounded-[26px] bg-white p-4 shadow-[0_12px_28px_rgba(15,34,49,0.05)] ${
                dragOverColumn === status ? "ring-2 ring-[#0b6d84]/20" : ""
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${COLUMN_META[status].dot}`} />
                  <p id={`pipeline-column-${status}`} className="text-sm font-bold text-[#0f2231]">
                    {PIPELINE_LABELS[status]}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#7b8792]">
                  {visiblePipeline[status].length}
                </span>
              </div>

              <div className="space-y-3">
                {visiblePipeline[status].length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#dde4ea] bg-[#f8fafc] px-4 py-5 text-sm text-[#73808c]">
                    Sem leads nesta etapa.
                  </div>
                ) : (
                  visiblePipeline[status].map((lead) => {
                    const nextStatus = NEXT_STATUS[status];

                    return (
                      <article
                        key={lead.business.id}
                        draggable
                        aria-label={`${lead.business.normalized_name}, etapa ${PIPELINE_LABELS[status]}`}
                        onDragStart={(event) => onDragStart(event, lead.business.id, status)}
                        className="rounded-[20px] border border-[#edf1f5] bg-[#fbfcfe] p-4 transition hover:border-[#d8e2e9] hover:shadow-[0_12px_24px_rgba(15,34,49,0.05)]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dde8ef] text-xs font-bold text-[#0b3348]">
                            {leadInitials(lead)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-[#0f2231]">
                                  {lead.business.normalized_name}
                                </p>
                                <p className="truncate text-xs text-[#8a97a2]">
                                  {lead.business.category}
                                </p>
                              </div>
                              <span className="text-xs font-bold text-[#0b3348]">
                                {lead.score.score}
                              </span>
                            </div>

                            <div className="mt-3 space-y-2 text-xs text-[#73808c]">
                              <p>
                                Proposta: {lead.pipeline?.proposed_value ? formatMoney(lead.pipeline.proposed_value) : "Nao definida"}
                              </p>
                              <p>{getFollowupLabel(lead.pipeline?.next_followup)}</p>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-2">
                              <Link
                                href={`/lead/${lead.business.id}`}
                                aria-label={`Ver detalhes de ${lead.business.normalized_name}`}
                                className="text-xs font-semibold text-[#0b3348] transition hover:text-[#0a6e70]"
                              >
                                Ver detalhes
                              </Link>

                              {nextStatus ? (
                                <button
                                  type="button"
                                  onClick={() => handleAdvance(lead, nextStatus)}
                                  aria-label={`Avancar ${lead.business.normalized_name} para ${PIPELINE_LABELS[nextStatus]}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#eef3f7] px-3 py-1.5 text-xs font-bold text-[#0b3348] transition hover:bg-[#e5edf2]"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                  Avancar
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="rounded-[28px] bg-white p-5 shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef8fb] text-[#0a6e70]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f2231]">Resumo do pipeline</p>
              <p className="text-xs text-[#73808c]">Etapas vivas para acompanhamento diario</p>
            </div>
          </div>
        </article>

        <article className="rounded-[24px] bg-[#08384a] p-5 text-white shadow-[0_18px_38px_rgba(8,56,74,0.2)]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#70d0de]">Meta mensal</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#70d0de]/40">
              <span className="text-xs font-bold">75%</span>
            </div>
            <div>
              <p className="text-lg font-black">R$ 42k / R$ 56k</p>
              <p className="text-xs text-white/70">Ritmo mensal do time</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function TopCard({
  label,
  value,
  helper,
  accent = false,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: boolean;
}) {
  return (
    <article className={`rounded-[22px] p-5 shadow-[0_12px_28px_rgba(15,34,49,0.04)] ${accent ? "bg-[#fff3eb]" : "bg-white"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8792]">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-[#082d45]">{value}</p>
      <p className="mt-2 text-xs text-[#73808c]">{helper}</p>
    </article>
  );
}
