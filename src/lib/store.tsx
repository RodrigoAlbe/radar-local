"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { Lead, LeadPipeline, PipelineStatus, SearchJob, SearchFilters } from "./types";
import {
  AppState,
  initialAppState,
  normalizeAppState,
  STORAGE_KEY,
} from "./app-state";

type Action =
  | { type: "SET_LEADS"; leads: Lead[] }
  | { type: "UPSERT_LEAD"; lead: Lead }
  | { type: "UPDATE_PIPELINE"; businessId: string; status: PipelineStatus; notes?: string }
  | {
      type: "UPDATE_PIPELINE_FIELDS";
      businessId: string;
      fields: { notes?: string; proposed_value?: number | null; next_followup?: string | null };
    }
  | { type: "SAVE_LEAD"; businessId: string }
  | { type: "DISCARD_LEAD"; businessId: string }
  | { type: "ADD_SEARCH_JOB"; job: SearchJob }
  | { type: "LOAD_STATE"; state: AppState };

function mergeIncomingLeads(existingLeads: Lead[], incomingLeads: Lead[]): Lead[] {
  const existingById = new Map(existingLeads.map((lead) => [lead.business.id, lead]));
  const mergedIncoming: Lead[] = [];
  const incomingIds = new Set<string>();

  for (const lead of incomingLeads) {
    incomingIds.add(lead.business.id);
    const existing = existingById.get(lead.business.id);
    mergedIncoming.push(existing ? { ...lead, pipeline: existing.pipeline } : lead);
  }

  const preservedExisting = existingLeads.filter(
    (lead) => !incomingIds.has(lead.business.id),
  );

  return [...mergedIncoming, ...preservedExisting];
}

function mergeStates(primary: AppState, secondary: AppState): AppState {
  return {
    leads: mergeIncomingLeads(primary.leads, secondary.leads),
    searchJobs: [...primary.searchJobs, ...secondary.searchJobs].slice(0, 50),
    savedLeads: Array.from(new Set([...primary.savedLeads, ...secondary.savedLeads])),
    discardedLeads: Array.from(
      new Set([...primary.discardedLeads, ...secondary.discardedLeads]),
    ),
    currentResultIds:
      primary.currentResultIds.length > 0
        ? primary.currentResultIds
        : secondary.currentResultIds,
  };
}

function getStateWeight(state: AppState): number {
  return (
    state.leads.length * 10 +
    state.savedLeads.length * 3 +
    state.discardedLeads.length * 2 +
    state.searchJobs.length +
    state.currentResultIds.length
  );
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_LEADS":
      return {
        ...state,
        leads: mergeIncomingLeads(state.leads, action.leads),
        currentResultIds: action.leads.map((lead) => lead.business.id),
      };

    case "UPSERT_LEAD": {
      const existing = state.leads.find(
        (lead) => lead.business.id === action.lead.business.id,
      );

      if (!existing) {
        return {
          ...state,
          leads: [action.lead, ...state.leads],
        };
      }

      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.business.id === action.lead.business.id
            ? {
                ...action.lead,
                pipeline: action.lead.pipeline ?? lead.pipeline,
              }
            : lead,
        ),
      };
    }

    case "UPDATE_PIPELINE": {
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.business.id === action.businessId
            ? {
                ...lead,
                pipeline: {
                  business_id: action.businessId,
                  user_id: "local_user",
                  status: action.status,
                  notes: action.notes ?? lead.pipeline?.notes ?? "",
                  proposed_value: lead.pipeline?.proposed_value ?? null,
                  next_followup: lead.pipeline?.next_followup ?? null,
                  last_contact_at:
                    action.status !== "novo"
                      ? new Date().toISOString()
                      : (lead.pipeline?.last_contact_at ?? null),
                  created_at: lead.pipeline?.created_at ?? new Date().toISOString(),
                } satisfies LeadPipeline,
              }
            : lead,
        ),
      };
    }

    case "UPDATE_PIPELINE_FIELDS": {
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.business.id === action.businessId
            ? {
                ...lead,
                pipeline: {
                  business_id: action.businessId,
                  user_id: lead.pipeline?.user_id ?? "local_user",
                  status: lead.pipeline?.status ?? "novo",
                  notes: lead.pipeline?.notes ?? "",
                  proposed_value: lead.pipeline?.proposed_value ?? null,
                  next_followup: lead.pipeline?.next_followup ?? null,
                  last_contact_at: lead.pipeline?.last_contact_at ?? null,
                  created_at: lead.pipeline?.created_at ?? new Date().toISOString(),
                  ...(action.fields.notes !== undefined && { notes: action.fields.notes }),
                  ...(action.fields.proposed_value !== undefined && {
                    proposed_value: action.fields.proposed_value,
                  }),
                  ...(action.fields.next_followup !== undefined && {
                    next_followup: action.fields.next_followup,
                  }),
                } satisfies LeadPipeline,
              }
            : lead,
        ),
      };
    }

    case "SAVE_LEAD":
      return {
        ...state,
        savedLeads: state.savedLeads.includes(action.businessId)
          ? state.savedLeads
          : [...state.savedLeads, action.businessId],
        discardedLeads: state.discardedLeads.filter((id) => id !== action.businessId),
      };

    case "DISCARD_LEAD":
      return {
        ...state,
        discardedLeads: state.discardedLeads.includes(action.businessId)
          ? state.discardedLeads
          : [...state.discardedLeads, action.businessId],
        savedLeads: state.savedLeads.filter((id) => id !== action.businessId),
      };

    case "ADD_SEARCH_JOB":
      return {
        ...state,
        searchJobs: [action.job, ...state.searchJobs].slice(0, 50),
      };

    case "LOAD_STATE":
      return normalizeAppState(action.state);

    default:
      return state;
  }
}

interface StoreContext {
  state: AppState;
  isHydrated: boolean;
  dispatch: React.Dispatch<Action>;
  setLeads: (leads: Lead[]) => void;
  updatePipeline: (businessId: string, status: PipelineStatus, notes?: string) => void;
  updatePipelineFields: (
    businessId: string,
    fields: { notes?: string; proposed_value?: number | null; next_followup?: string | null },
  ) => void;
  upsertLead: (lead: Lead) => void;
  saveLead: (businessId: string) => void;
  discardLead: (businessId: string) => void;
  addSearchJob: (job: SearchJob) => void;
  getLeadById: (id: string) => Lead | undefined;
  getFilteredLeads: (filters: SearchFilters) => Lead[];
  getPipelineLeads: () => Record<PipelineStatus, Lead[]>;
}

const Context = createContext<StoreContext | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialAppState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPersistedState() {
      let serverState: AppState | null = null;
      let localState: AppState | null = null;

      try {
        const response = await fetch("/api/app-state", { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as { state?: unknown };
          serverState = normalizeAppState(data.state);
        }
      } catch {
        // fallback local below
      }

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          localState = normalizeAppState(JSON.parse(saved));
        }
      } catch {
        // localStorage unavailable or corrupted
      }

      const nextState = serverState && localState
        ? getStateWeight(localState) >= getStateWeight(serverState)
          ? mergeStates(localState, serverState)
          : mergeStates(serverState, localState)
        : (serverState ?? localState ?? initialAppState);

      if (!cancelled && nextState) {
        dispatch({ type: "LOAD_STATE", state: nextState });
      }

      if (!cancelled) {
        setIsHydrated(true);
      }
    }

    void loadPersistedState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable/full
    }

    const timeoutId = window.setTimeout(() => {
      void fetch("/api/app-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      }).catch(() => {
        // server persistence is best-effort; local cache remains available
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [isHydrated, state]);

  const setLeads = useCallback(
    (leads: Lead[]) => dispatch({ type: "SET_LEADS", leads }),
    [],
  );

  const updatePipeline = useCallback(
    (businessId: string, status: PipelineStatus, notes?: string) =>
      dispatch({ type: "UPDATE_PIPELINE", businessId, status, notes }),
    [],
  );

  const updatePipelineFields = useCallback(
    (
      businessId: string,
      fields: { notes?: string; proposed_value?: number | null; next_followup?: string | null },
    ) => dispatch({ type: "UPDATE_PIPELINE_FIELDS", businessId, fields }),
    [],
  );

  const upsertLead = useCallback(
    (lead: Lead) => dispatch({ type: "UPSERT_LEAD", lead }),
    [],
  );

  const saveLead = useCallback(
    (businessId: string) => dispatch({ type: "SAVE_LEAD", businessId }),
    [],
  );

  const discardLead = useCallback(
    (businessId: string) => dispatch({ type: "DISCARD_LEAD", businessId }),
    [],
  );

  const addSearchJob = useCallback(
    (job: SearchJob) => dispatch({ type: "ADD_SEARCH_JOB", job }),
    [],
  );

  const getLeadById = useCallback(
    (id: string) => state.leads.find((lead) => lead.business.id === id),
    [state.leads],
  );

  const getFilteredLeads = useCallback(
    (filters: SearchFilters) => {
      if (state.currentResultIds.length === 0) {
        return [];
      }

      const currentResultIds = new Set(state.currentResultIds);

      return state.leads.filter((lead) => {
        if (!currentResultIds.has(lead.business.id)) return false;
        if (state.discardedLeads.includes(lead.business.id)) return false;

        if (
          filters.semSite &&
          lead.signals.presence_status !== "sem_site_detectado"
        ) {
          return false;
        }

        if (filters.soRedesSociais && !lead.signals.has_social_only) return false;
        if (filters.comTelefone && !lead.business.phone) return false;
        if (filters.comWhatsapp && !lead.signals.whatsapp_detected) return false;

        if (
          filters.minReviews > 0 &&
          lead.signals.review_count < filters.minReviews
        ) {
          return false;
        }

        if (
          filters.excluirFranquias &&
          lead.score.score_reasons.some((reason) => reason.label === "Franquia ou rede")
        ) {
          return false;
        }

        return true;
      });
    },
    [state.currentResultIds, state.discardedLeads, state.leads],
  );

  const getPipelineLeads = useCallback(() => {
    const pipeline: Record<PipelineStatus, Lead[]> = {
      novo: [],
      abordado: [],
      respondeu: [],
      negociando: [],
      proposta_enviada: [],
      convertido: [],
      sem_interesse: [],
    };

    for (const lead of state.leads) {
      const status = lead.pipeline?.status ?? "novo";
      pipeline[status].push(lead);
    }

    return pipeline;
  }, [state.leads]);

  return (
    <Context.Provider
      value={{
        state,
        isHydrated,
        dispatch,
        setLeads,
        updatePipeline,
        updatePipelineFields,
        upsertLead,
        saveLead,
        discardLead,
        addSearchJob,
        getLeadById,
        getFilteredLeads,
        getPipelineLeads,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useStore(): StoreContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}
