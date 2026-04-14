"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarRange, Download, Filter, Search, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function uniqueCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

export default function HistoricoPage() {
  const { state } = useStore();
  const jobs = state.searchJobs;

  const stats = useMemo(() => {
    const uniqueRegions = uniqueCount(jobs.map((job) => job.region));
    const uniqueCategories = uniqueCount(jobs.map((job) => job.category));
    const totalLeads = jobs.reduce((sum, job) => sum + job.results_count, 0);
    const avgResults = jobs.length ? Math.round(totalLeads / jobs.length) : 0;

    return {
      uniqueRegions,
      uniqueCategories,
      totalLeads,
      avgResults,
    };
  }, [jobs]);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 pb-8">
      <section className="space-y-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#082d45] md:text-5xl">
            Prospecting History
          </h1>
          <p className="mt-2 text-sm text-[#73808c]">
            Review and re-ignite previous search intelligence.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[repeat(2,minmax(0,220px))_minmax(0,1fr)]">
          <StatTile label="Total leads found" value={String(stats.totalLeads)} helper="+ 12% from last month" />
          <StatTile label="Conversations" value={String(state.leads.filter((lead) => (lead.pipeline?.status ?? "novo") !== "novo").length)} helper="10.8% average ROI" />
          <article className="rounded-[24px] bg-[linear-gradient(135deg,#08384a_0%,#0a5064_45%,#0b6d84_100%)] px-6 py-5 text-white shadow-[0_18px_38px_rgba(8,56,74,0.2)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#70d0de]">Signal velocity</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">High Engagement</h2>
            <p className="mt-2 text-sm text-white/75">
              Searches in SaaS and Fintech are performing above baseline.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-[0_12px_28px_rgba(15,34,49,0.05)] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0f2231]">Historical Search Logs</h2>
            <p className="mt-1 text-sm text-[#73808c]">Showing {jobs.length} search entries</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#f1f5f8] px-4 py-2 text-sm font-semibold text-[#5f6f7d]"
            >
              <CalendarRange className="h-4 w-4" />
              Last 30 Days
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#f1f5f8] px-4 py-2 text-sm font-semibold text-[#5f6f7d]"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-[#edf1f5]">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_140px_120px_120px] gap-4 bg-[#f8fafc] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7b8792] md:grid">
            <span>Region</span>
            <span>Category</span>
            <span>Date</span>
            <span>Leads Found</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-[#edf1f5]">
            {jobs.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#73808c]">
                Nenhum historico ainda. Rode algumas buscas para preencher esta area.
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={`${job.id}-${job.created_at}`}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_140px_120px_120px] md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0f2231]">{job.region}</p>
                    <p className="mt-1 text-xs text-[#8a97a2]">Raio {job.radius} km</p>
                  </div>
                  <div>
                    <span className="inline-flex rounded-full bg-[#e7f6f2] px-3 py-1 text-xs font-semibold text-[#127d63]">
                      {job.category}
                    </span>
                  </div>
                  <p className="text-sm text-[#5f6f7d]">{formatDate(job.created_at)}</p>
                  <div>
                    <p className="text-sm font-bold text-[#082d45]">{job.results_count}</p>
                    <div className="mt-2 h-1.5 w-16 rounded-full bg-[#e6edf2]">
                      <div
                        className="h-full rounded-full bg-[#0b6d84]"
                        style={{ width: `${Math.min(100, Math.max(8, job.results_count))}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 rounded-full bg-[#f1f5f8] px-3 py-2 text-xs font-bold text-[#0b3348]"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Reabrir
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <article className="rounded-[28px] bg-white p-6 shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
          <span className="inline-flex rounded-full bg-[#fff3eb] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8e3900]">
            Strategy tip
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#082d45]">
            Seu historico revela quais buscas costumam gerar pipeline mais rapido.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#73808c]">
            Re-runing the strongest searches often reveals fresh leads in the same neighborhoods and categories. Use this view to repeat what already proved commercial value.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0b6d84] transition hover:opacity-80"
          >
            View predictive model
            <TrendingUp className="h-4 w-4" />
          </Link>
        </article>

        <article className="rounded-[28px] bg-white p-6 shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
          <h2 className="text-lg font-bold text-[#0f2231]">Quick History Stats</h2>
          <div className="mt-5 space-y-4">
            <QuickStat label="Unique niches" value={String(stats.uniqueCategories)} />
            <QuickStat label="Regional coverage" value={`${stats.uniqueRegions} cities`} />
            <QuickStat label="Data freshness" value="92%" />
            <QuickStat label="Avg results per search" value={String(stats.avgResults)} />
          </div>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f1f5f8] px-4 py-3 text-sm font-bold text-[#0b3348] transition hover:bg-[#e8eef3]"
          >
            <Download className="h-4 w-4" />
            Download Full Archive
          </button>
        </article>
      </section>
    </div>
  );
}

function StatTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-[24px] bg-white p-5 shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8792]">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-[#082d45]">{value}</p>
      <p className="mt-2 text-xs text-[#127d63]">{helper}</p>
    </article>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8fafc] px-4 py-3">
      <p className="text-sm text-[#5f6f7d]">{label}</p>
      <span className="text-sm font-bold text-[#082d45]">{value}</span>
    </div>
  );
}
