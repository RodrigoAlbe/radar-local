"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  Loader2,
  LocateFixed,
  MapPin,
  Radar,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { useStore } from "@/lib/store";

const CATEGORY_OPTIONS = [
  "",
  "Dentista",
  "Estetica",
  "Pet shop",
  "Veterinaria",
  "Advogado",
  "Oficina",
  "Imobiliaria",
  "Academia",
  "Assistencia tecnica",
] as const;

const SUGGESTIONS = ["Dentistas", "Advogados", "Pet Shops", "Oficinas"] as const;

export default function SearchAdminPage() {
  const router = useRouter();
  const { setLeads, addSearchJob } = useStore();
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [radius, setRadius] = useState(5);
  const [maxResults, setMaxResults] = useState(50);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const canSearch = location.trim().length > 0;

  const handleGeolocate = async () => {
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocalizacao nao suportada neste navegador");
      return;
    }

    setGeoLoading(true);
    setGeoError("");

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 600000,
        });
      });

      const { latitude, longitude } = position.coords;

      try {
        const res = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
        const data = await res.json();
        setLocation(data.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } catch {
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (err) {
      const geoErr = err as GeolocationPositionError;
      const messages: Record<number, string> = {
        1: "Permissao de localizacao negada. Libere no navegador.",
        2: "Nao foi possivel determinar sua localizacao. Tente novamente.",
        3: "Tempo esgotado ao buscar localizacao. Tente novamente.",
      };
      setGeoError(messages[geoErr?.code] || "Erro ao obter localizacao");
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!canSearch) return;

    setLoading(true);
    setSearchError("");

    try {
      const res = await fetch("/api/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location.trim(),
          category: category || undefined,
          radius,
          maxResults,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao buscar oportunidades");
      }

      if (!data.leads || data.leads.length === 0) {
        setSearchError("Nenhuma oportunidade encontrada. Tente outra localizacao ou ajuste o nicho.");
        setLoading(false);
        return;
      }

      setLeads(data.leads);

      addSearchJob({
        id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: "local_user",
        region: location.trim(),
        category: category || "Todas",
        radius,
        status: "completed",
        results_count: data.total,
        created_at: new Date().toISOString(),
      });

      router.push("/resultados");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao buscar oportunidades";
      setSearchError(message);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (value: string) => {
    const mapped = value.replace("Dentistas", "Dentista").replace("Advogados", "Advogado").replace("Pet Shops", "Pet shop").replace("Oficinas", "Oficina");
    setCategory(mapped);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-12 pb-8">
      <section className="grid gap-12 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,480px)] xl:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e5f4f7] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#0a6e70]">
            <Sparkles className="h-3.5 w-3.5" />
            Discovery mode
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-[0.98] tracking-tight text-[#082d45] md:text-6xl">
            Pronto para encontrar
            <br />
            <span className="text-[#0a6e70]">novas oportunidades?</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#677684]">
            Transforme dados locais em inteligencia de vendas. Nosso radar analisa sinais de operacao, contato e maturidade digital para destacar quem tem mais chance de fechamento hoje.
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute h-72 w-72 rounded-full border border-dashed border-[#8fe0ec] animate-[spin_22s_linear_infinite]" />
          <div className="absolute h-48 w-48 rounded-full border border-[#7dc7d4]/30 animate-[spin_14s_linear_infinite_reverse]" />
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-[#004253] to-[#005b71] text-white shadow-[0_28px_55px_rgba(0,91,113,0.28)]">
            <Radar className="h-14 w-14" />
            <span className="absolute right-6 top-6 h-3 w-3 rounded-full bg-[#8e3900] shadow-[0_0_0_8px_rgba(142,57,0,0.12)]" />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_38px_rgba(15,34,49,0.06)] md:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_220px] xl:items-center">
          <FieldShell icon={<MapPin className="h-4 w-4" />} label="Localizacao">
            <input
              id="page-search"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Ex: Sao Paulo, SP"
              className="w-full bg-transparent text-sm font-medium text-[#0f2231] outline-none placeholder:text-[#95a0ab]"
            />
          </FieldShell>

          <FieldShell icon={<Target className="h-4 w-4" />} label="Categoria">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full bg-transparent text-sm font-medium text-[#0f2231] outline-none"
            >
              <option value="">Todos os nichos</option>
              {CATEGORY_OPTIONS.filter(Boolean).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FieldShell>

          <FieldShell icon={<Search className="h-4 w-4" />} label="Raio de busca">
            <select
              value={radius}
              onChange={(event) => setRadius(Number(event.target.value))}
              className="w-full bg-transparent text-sm font-medium text-[#0f2231] outline-none"
            >
              {[3, 5, 8, 10, 15, 20].map((item) => (
                <option key={item} value={item}>
                  {item} km
                </option>
              ))}
            </select>
          </FieldShell>

          <button
            type="button"
            onClick={handleSearch}
            disabled={!canSearch || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8e3900] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#7b3100] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar Leads
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a97a2]">
              Sugestoes:
            </span>
            {SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => applySuggestion(item)}
                className="rounded-full bg-[#edf1f4] px-4 py-1.5 text-xs font-bold text-[#0a5064] transition hover:bg-[#e4eaee]"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 rounded-full bg-[#eef8fb] px-4 py-2 text-xs font-bold text-[#0a6e70] transition hover:bg-[#e2f3f7] disabled:opacity-70"
            >
              {geoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
              Usar minha localizacao
            </button>
            <label className="text-xs font-semibold text-[#8a97a2]">
              Max leads
              <input
                type="number"
                min={10}
                max={100}
                step={10}
                value={maxResults}
                onChange={(event) => setMaxResults(Number(event.target.value) || 50)}
                className="ml-2 w-16 rounded-full border border-[#dde4ea] bg-[#f8fafc] px-3 py-1.5 text-center text-[#0f2231] outline-none"
              />
            </label>
          </div>
        </div>

        {geoError ? (
          <p className="mt-4 text-sm text-[#b0441c]">{geoError}</p>
        ) : null}

        {searchError ? (
          <div className="mt-4 rounded-2xl border border-[#f4d4ca] bg-[#fff4f0] px-4 py-3 text-sm text-[#8b4a2e]">
            {searchError}
          </div>
        ) : null}
      </section>

      <section className="space-y-8">
        <div className="flex items-end gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0a6e70]">The Engine</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#082d45]">
              Como funciona o Vendability Score?
            </h2>
          </div>
          <div className="hidden h-px flex-1 bg-[#dfe5eb] lg:block" />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <EngineCard
            icon={<Radar className="h-5 w-5" />}
            title="Captura de sinais"
            body="Monitoramos presença digital, contato disponível e indicios de operacao viva em tempo real."
          />
          <EngineCard
            icon={<BrainCircuit className="h-5 w-5" />}
            title="Analise de IA"
            body="Nosso score cruza sinais de compra, maturidade e clareza de melhoria para priorizar quem vale abordagem agora."
          />
          <EngineCard
            icon={<ArrowRight className="h-5 w-5" />}
            title="Score de 0 a 100"
            body="Leads com score alto aparecem no topo com oferta sugerida, urgencia e mensagem pronta para envio."
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#08384a_0%,#0a5064_45%,#0b6d84_100%)] px-6 py-8 text-white shadow-[0_18px_40px_rgba(8,56,74,0.22)] md:px-8">
        <p className="max-w-2xl text-2xl font-extrabold tracking-tight">
          Aumente sua taxa de conversao em ate 40%
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/78">
          Use os filtros avancados para encontrar empresas que ainda dependem de canais improvisados e tem mais espaco para uma oferta comercial clara.
        </p>
      </section>
    </div>
  );
}

function FieldShell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a97a2]">
        {label}
      </p>
      <div className="flex items-center gap-3 text-[#0b6d84]">
        {icon}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function EngineCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[24px] bg-white p-7 shadow-[0_12px_28px_rgba(15,34,49,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,34,49,0.08)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf8fa] text-[#0a6e70]">
        {icon}
      </div>
      <h3 className="mt-6 text-lg font-bold text-[#082d45]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#677684]">{body}</p>
    </article>
  );
}
