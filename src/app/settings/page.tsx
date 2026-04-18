"use client";

import { useState } from "react";
import {
  Database,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const { state, externalApiKeys, setExternalApiKey } = useStore();
  const [showKeys, setShowKeys] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 pb-8">
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7b8792]">
          Product settings
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#082d45] md:text-5xl">
          Configuracoes
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#73808c]">
          Ajuste a base operacional do Radar Local e acompanhe o que ja esta pronto
          para uma publicacao open source.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <SettingCard
          icon={<Database className="h-5 w-5" />}
          title="Persistencia"
          body="Leads, buscas e pipeline ja usam sincronizacao local + servidor para reduzir perda de contexto."
        />
        <SettingCard
          icon={<Globe className="h-5 w-5" />}
          title="Public sharing"
          body="Demos, links curtos e assets do nicho podem ser expostos via deploy publico estavel."
        />
        <SettingCard
          icon={<Users className="h-5 w-5" />}
          title="Agency ready"
          body="O modelo esta preparado para evoluir para workspaces, ownership e multiusuario."
        />
      </section>

      <section className="rounded-[28px] bg-white p-6 shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef8fb] text-[#0a6e70]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0f2231]">Chaves externas</h2>
              <p className="mt-1 text-sm text-[#73808c]">
                Configure provedores direto no admin para cada usuario da maquina.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowKeys((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full bg-[#eef2f6] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#4f5f6d]"
          >
            {showKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showKeys ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ApiKeyInput
            label="Google Places API key"
            value={externalApiKeys.googlePlacesApiKey}
            placeholder="Cole a chave para buscas reais"
            reveal={showKeys}
            onChange={(value) => setExternalApiKey("googlePlacesApiKey", value)}
          />
          <ApiKeyInput
            label="OpenAI API key"
            value={externalApiKeys.openAiApiKey}
            placeholder="Opcional para recursos de IA"
            reveal={showKeys}
            onChange={(value) => setExternalApiKey("openAiApiKey", value)}
          />
          <ApiKeyInput
            label="Gemini API key"
            value={externalApiKeys.geminiApiKey}
            placeholder="Opcional para recursos de IA"
            reveal={showKeys}
            onChange={(value) => setExternalApiKey("geminiApiKey", value)}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-[#e8edf2] bg-[#f8fafc] px-4 py-3 text-sm text-[#556471]">
          As chaves ficam salvas apenas neste navegador (localStorage). A busca usa
          a chave Google Places daqui e, na geracao de visuais do site demo, o app
          tenta Gemini/OpenAI como fallback quando nao encontra uma imagem boa da marca.
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <article className="rounded-[28px] bg-white p-6 shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef8fb] text-[#0a6e70]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0f2231]">Open source readiness</h2>
              <p className="text-sm text-[#73808c]">Checklist para o primeiro release publico</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <ChecklistItem label="Design admin alinhado ao Stitch" done />
            <ChecklistItem label="Persistencia local e remota de estado" done />
            <ChecklistItem label="Templates de demo por nicho" done />
            <ChecklistItem label="Separar secrets e exemplos de .env" />
            <ChecklistItem label="Adicionar README de instalacao e contribuicao" />
            <ChecklistItem label="Publicar uma versao sem dependencia de tunnel" />
          </div>
        </article>

        <article className="rounded-[28px] bg-[#08384a] p-6 text-white shadow-[0_18px_38px_rgba(8,56,74,0.2)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Workspace snapshot</h2>
              <p className="text-sm text-white/70">Estado atual do projeto</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <SnapshotRow label="Leads carregados" value={String(state.leads.length)} />
            <SnapshotRow label="Buscas registradas" value={String(state.searchJobs.length)} />
            <SnapshotRow label="Leads salvos" value={String(state.savedLeads.length)} />
            <SnapshotRow label="Leads descartados" value={String(state.discardedLeads.length)} />
          </div>
        </article>
      </section>
    </div>
  );
}

function SettingCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[24px] bg-white p-6 shadow-[0_12px_28px_rgba(15,34,49,0.05)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef8fb] text-[#0a6e70]">
        {icon}
      </div>
      <h2 className="mt-5 text-xl font-bold text-[#0f2231]">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-[#73808c]">{body}</p>
    </article>
  );
}

function ApiKeyInput({
  label,
  value,
  placeholder,
  reveal,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  reveal: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-2xl border border-[#e4ebf1] bg-white px-4 py-3">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#81909b]">
        {label}
      </span>
      <input
        type={reveal ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="none"
        autoComplete="off"
        className="w-full bg-transparent text-sm font-medium text-[#0f2231] outline-none placeholder:text-[#9eabb6]"
      />
    </label>
  );
}

function ChecklistItem({ label, done = false }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8fafc] px-4 py-3">
      <p className="text-sm text-[#0f2231]">{label}</p>
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          done ? "bg-[#e7f6f2] text-[#127d63]" : "bg-[#eef2f6] text-[#6a7783]"
        }`}
      >
        {done ? "Done" : "Next"}
      </span>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/8 px-4 py-3">
      <p className="text-sm text-white/72">{label}</p>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}
