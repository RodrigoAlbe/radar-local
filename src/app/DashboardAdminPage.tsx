"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  CheckCheck,
  Clock3,
  MessageCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { getLeadSalesInsight } from "@/lib/sales-intelligence";
import { PIPELINE_LABELS, type Lead } from "@/lib/types";

function rate(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function isOverdue(date: string | null | undefined) {
  if (!date) return false;
  return new Date(`${date}T12:00:00`).getTime() < Date.now();
}

function leadAvatar(lead: Lead) {
  return lead.business.normalized_name.slice(0, 2).toUpperCase();
}

export default function DashboardAdminPage() {
  const { state } = useStore();

  const metrics = useMemo(() => {
    const leads = state.leads;
    const contacted = leads.filter((lead) => (lead.pipeline?.status ?? "novo") !== "novo");
    const responded = leads.filter((lead) => {
      const status = lead.pipeline?.status;
      return status === "respondeu" || status === "negociando" || status === "proposta_enviada" || status === "convertido";
    });
    const meetings = leads.filter((lead) => {
      const status = lead.pipeline?.status;
      return status === "negociando" || status === "proposta_enviada" || status === "convertido";
    });
    const closedValue = leads
      .filter((lead) => lead.pipeline?.status === "convertido")
      .reduce((sum, lead) => sum + (lead.pipeline?.proposed_value ?? 0), 0);

    return {
      found: leads.length,
      contacted: contacted.length,
      responseRate: rate(responded.length, contacted.length),
      meetingRate: rate(meetings.length, contacted.length),
      closedValue,
    };
  }, [state.leads]);

  const queue = useMemo(() => {
    return [...state.leads]
      .filter((lead) => {
        const status = lead.pipeline?.status ?? "novo";
        return (
          status === "novo" ||
          status === "respondeu" ||
          status === "negociando" ||
          isOverdue(lead.pipeline?.next_followup)
        );
      })
      .sort((a, b) => {
        const aOverdue = isOverdue(a.pipeline?.next_followup);
        const bOverdue = isOverdue(b.pipeline?.next_followup);
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        return b.score.score - a.score.score;
      })
      .slice(0, 6)
      .map((lead) => ({
        lead,
        insight: getLeadSalesInsight(lead),
      }));
  }, [state.leads]);

  const followups = useMemo(() => {
    return [...state.leads]
      .filter((lead) => isOverdue(lead.pipeline?.next_followup))
      .sort((a, b) => b.score.score - a.score.score)
      .slice(0, 3);
  }, [state.leads]);

  const hotLeads = useMemo(() => {
    return [...state.leads]
      .filter((lead) => (lead.pipeline?.status ?? "novo") === "novo")
      .sort((a, b) => b.score.score - a.score.score)
      .slice(0, 4);
  }, [state.leads]);

  const nextSteps = useMemo(() => {
    return queue.slice(0, 4).map(({ lead, insight }) => ({
      id: lead.business.id,
      title: insight.nextStep,
      detail: `${lead.business.normalized_name} - ${insight.suggestedOffer}`,
    }));
  }, [queue]);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 pb-8">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#082d45]">
              ROI Comercial
            </h1>
            <p className="mt-2 text-sm text-[#73808c]">
              Performance do seu radar nos ultimos 30 dias
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-[#d8f4f6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#0a6e70]">
            Live updates
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Leads Found" value={String(metrics.found)} delta="+12%" />
          <MetricCard label="Contacted" value={String(metrics.contacted)} delta="+8%" />
          <MetricCard label="Response Rate" value={metrics.responseRate} delta="-2%" />
          <MetricCard label="Meeting Rate" value={metrics.meetingRate} delta="+4%" />
          <MetricCard
            label="Closed Value"
            value={formatMoney(metrics.closedValue)}
            delta="Meta mensal"
            accent
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_340px]">
        <div className="space-y-6">
          <article className="rounded-[30px] bg-[#eef2f6] p-1">
            <div className="rounded-[24px] bg-white p-6 shadow-[0_12px_28px_rgba(15,34,49,0.04)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8fb] text-[#0b6d84]">
                    <CheckCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0f2231]">Fila Operacional</h2>
                    <p className="text-sm text-[#73808c]">
                      {queue.length} contatos priorizados para hoje
                    </p>
                  </div>
                </div>

                <Link
                  href="/pipeline"
                  className="text-sm font-bold text-[#0a6e70] transition hover:opacity-80"
                >
                  Ver fila completa
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                {queue.length === 0 ? (
                  <EmptyCard text="Nenhuma oportunidade ativa ainda. Rode uma busca para encher a fila." />
                ) : (
                  queue.slice(0, 3).map(({ lead, insight }) => (
                    <Link
                      key={lead.business.id}
                      href={`/lead/${lead.business.id}`}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-[#f6f7fb] px-4 py-4 transition hover:bg-[#eef3f7]"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dce7ef] text-sm font-bold text-[#0b3348]">
                          {leadAvatar(lead)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0f2231]">
                            {lead.business.normalized_name}
                          </p>
                          <p className="truncate text-xs text-[#73808c]">
                            {insight.suggestedOffer}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8792]">
                          Score
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#8e3900]">
                          + {lead.score.score / 10}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </article>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-[#8e3900]" />
              <h2 className="text-lg font-bold text-[#0f2231]">Novos Prioritarios</h2>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {hotLeads.length === 0 ? (
                <div className="xl:col-span-2">
                  <EmptyCard text="Sem leads novos no momento. Tente uma nova busca de nicho." />
                </div>
              ) : (
                hotLeads.map((lead) => {
                  const insight = getLeadSalesInsight(lead);

                  return (
                    <article
                      key={lead.business.id}
                      className="rounded-[24px] bg-white p-5 shadow-[0_12px_28px_rgba(15,34,49,0.05)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dce7ef] text-sm font-bold text-[#0b3348]">
                            {leadAvatar(lead)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#0f2231]">
                              {lead.business.normalized_name}
                            </p>
                            <p className="truncate text-xs text-[#73808c]">
                              {lead.business.category}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#fff2e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8e3900]">
                          Hot lead
                        </span>
                      </div>

                      <p className="mt-4 text-sm font-semibold text-[#0f2231]">
                        {insight.suggestedOffer}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-[#73808c]">
                        Potencial: {insight.suggestedPriceRange}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        <Link
                          href={`/lead/${lead.business.id}`}
                          className="text-sm font-semibold text-[#0b3348] transition hover:text-[#0a6e70]"
                        >
                          Ver detalhes
                        </Link>
                        <Link
                          href={`/lead/${lead.business.id}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#0a5064] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                        >
                          Abrir
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <article className="rounded-[28px] bg-white p-5 shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0ed] text-[#b0441c]">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0f2231]">Follow-ups Atrasados</h2>
                <p className="text-sm text-[#73808c]">Recupere as conversas mais quentes</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {followups.length === 0 ? (
                <EmptyCard text="Nenhum follow-up atrasado por enquanto." compact />
              ) : (
                followups.map((lead) => (
                  <Link
                    key={lead.business.id}
                    href={`/lead/${lead.business.id}`}
                    className="block rounded-2xl border border-[#f1d8cf] px-4 py-4 transition hover:bg-[#fff8f5]"
                  >
                    <p className="text-sm font-semibold text-[#0f2231]">
                      {lead.business.normalized_name}
                    </p>
                    <p className="mt-1 text-xs text-[#8b6a5f]">
                      {PIPELINE_LABELS[lead.pipeline?.status ?? "novo"]}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[28px] bg-[#08384a] p-5 text-white shadow-[0_18px_38px_rgba(8,56,74,0.2)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Proximos Passos</h2>
                <p className="text-sm text-white/70">O que mover agora para fechar mais rapido</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {nextSteps.length === 0 ? (
                <p className="text-sm text-white/70">
                  Assim que chegarem leads, o radar monta a fila recomendada aqui.
                </p>
              ) : (
                nextSteps.map((step, index) => (
                  <div key={step.id} className="rounded-2xl bg-white/6 px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#70d0de]">
                      Passo {index + 1}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{step.title}</p>
                    <p className="mt-1 text-xs text-white/70">{step.detail}</p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[28px] bg-white p-6 text-center shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-dashed border-[#9bd7df]">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#0b6d84] bg-[#e8f4f7] text-[#0b3348]">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
            <h3 className="mt-5 text-lg font-bold text-[#0f2231]">Radar Ativo</h3>
            <p className="mt-2 text-sm text-[#73808c]">
              Escaneando leads de alto valor no seu setor e localizacao.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  accent = false,
}: {
  label: string;
  value: string;
  delta: string;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-[20px] p-5 shadow-[0_10px_22px_rgba(15,34,49,0.04)] ${
        accent ? "bg-[#08384a] text-white" : "bg-white"
      }`}
    >
      <p className={`text-xs font-semibold ${accent ? "text-white/65" : "text-[#7b8792]"}`}>
        {label}
      </p>
      <p className={`mt-3 text-3xl font-black tracking-tight ${accent ? "text-white" : "text-[#082d45]"}`}>
        {value}
      </p>
      <p className={`mt-2 text-xs font-semibold ${accent ? "text-[#70d0de]" : "text-[#0a6e70]"}`}>
        {delta}
      </p>
    </article>
  );
}

function EmptyCard({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-[20px] border border-dashed border-[#d9e2e8] bg-[#f8fafc] text-sm text-[#73808c] ${
        compact ? "px-4 py-4" : "px-5 py-6"
      }`}
    >
      {text}
    </div>
  );
}
