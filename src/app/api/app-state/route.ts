import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { initialAppState, normalizeAppState } from "@/lib/app-state";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabase-server";
import { enforceLocalApiAccess, enforceSimpleRateLimit } from "@/lib/api-security";

export const dynamic = "force-dynamic";

const STATE_PATH = path.join(process.cwd(), "data", "app-state.json");
const BACKUP_PATH = path.join(process.cwd(), "data", "app-state.backup.json");
const APP_STATE_SCOPE = "default";

function getStateWeight(state: ReturnType<typeof normalizeAppState>): number {
  return (
    state.leads.length * 10 +
    state.searchJobs.length * 2 +
    state.savedLeads.length * 3 +
    state.discardedLeads.length * 2 +
    state.currentResultIds.length
  );
}

async function readLocalState() {
  try {
    const raw = await fs.readFile(STATE_PATH, "utf-8");
    return normalizeAppState(JSON.parse(raw));
  } catch {
    return initialAppState;
  }
}

async function readSupabaseState() {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("app_state_store")
      .select("state")
      .eq("scope", APP_STATE_SCOPE)
      .maybeSingle();

    if (error) {
      console.error("Erro ao ler app_state_store:", error);
      return null;
    }

    return normalizeAppState(data?.state);
  } catch (error) {
    console.error("Falha ao consultar Supabase app_state_store:", error);
    return null;
  }
}

async function writeSupabaseState(state: ReturnType<typeof normalizeAppState>) {
  if (!isSupabaseServerConfigured()) {
    return;
  }

  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return;

    const { error } = await supabase.from("app_state_store").upsert(
      {
        scope: APP_STATE_SCOPE,
        state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "scope" },
    );

    if (error) {
      console.error("Erro ao salvar app_state_store:", error);
    }
  } catch (error) {
    console.error("Falha ao gravar app_state_store no Supabase:", error);
  }
}

export async function GET(request: NextRequest) {
  const accessDenied = enforceLocalApiAccess(request);
  if (accessDenied) return accessDenied;

  const [localState, supabaseState] = await Promise.all([
    readLocalState(),
    readSupabaseState(),
  ]);

  const useSupabase =
    supabaseState && getStateWeight(supabaseState) > getStateWeight(localState);
  const state = useSupabase ? supabaseState : localState;

  if (!useSupabase && isSupabaseServerConfigured() && getStateWeight(localState) > 0) {
    await writeSupabaseState(localState);
  }

  return NextResponse.json({
    state,
    source: useSupabase ? "supabase" : "local",
  });
}

export async function PUT(request: NextRequest) {
  const accessDenied = enforceLocalApiAccess(request);
  if (accessDenied) return accessDenied;

  const rateLimited = enforceSimpleRateLimit(request, {
    key: "app-state-put",
    limit: 60,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const state = normalizeAppState(body?.state);

    await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });

    try {
      const currentRaw = await fs.readFile(STATE_PATH, "utf-8");
      const currentState = normalizeAppState(JSON.parse(currentRaw));
      if (currentState.leads.length > 0 || currentState.searchJobs.length > 0) {
        await fs.writeFile(BACKUP_PATH, JSON.stringify(currentState, null, 2), "utf-8");
      }
    } catch {
      // sem estado anterior para backup
    }

    await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
    await writeSupabaseState(state);

    return NextResponse.json({
      ok: true,
      persisted: {
        local: true,
        supabase: isSupabaseServerConfigured(),
      },
    });
  } catch (error) {
    console.error("Erro ao salvar app-state:", error);
    return NextResponse.json({ error: "Erro ao salvar estado" }, { status: 500 });
  }
}
