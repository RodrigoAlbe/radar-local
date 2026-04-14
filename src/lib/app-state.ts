import { Lead, SearchJob } from "./types";

export interface AppState {
  leads: Lead[];
  searchJobs: SearchJob[];
  savedLeads: string[];
  discardedLeads: string[];
  currentResultIds: string[];
}

export const STORAGE_KEY = "radar_local_state";

export const initialAppState: AppState = {
  leads: [],
  searchJobs: [],
  savedLeads: [],
  discardedLeads: [],
  currentResultIds: [],
};

export function normalizeAppState(value: unknown): AppState {
  if (!value || typeof value !== "object") {
    return initialAppState;
  }

  const candidate = value as Partial<AppState>;
  const leads = Array.isArray(candidate.leads) ? candidate.leads : [];

  return {
    leads,
    searchJobs: Array.isArray(candidate.searchJobs) ? candidate.searchJobs : [],
    savedLeads: Array.isArray(candidate.savedLeads)
      ? candidate.savedLeads.filter((item): item is string => typeof item === "string")
      : [],
    discardedLeads: Array.isArray(candidate.discardedLeads)
      ? candidate.discardedLeads.filter((item): item is string => typeof item === "string")
      : [],
    currentResultIds: Array.isArray(candidate.currentResultIds)
      ? candidate.currentResultIds.filter((item): item is string => typeof item === "string")
      : leads.map((lead) => lead?.business?.id).filter((item): item is string => typeof item === "string"),
  };
}
