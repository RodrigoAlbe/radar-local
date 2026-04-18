export interface ExternalApiKeys {
  googlePlacesApiKey: string;
  openAiApiKey: string;
  geminiApiKey: string;
}

export const EXTERNAL_API_KEYS_STORAGE_KEY = "radar_local_external_api_keys";

export const initialExternalApiKeys: ExternalApiKeys = {
  googlePlacesApiKey: "",
  openAiApiKey: "",
  geminiApiKey: "",
};

function normalizeApiKey(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 300);
}

export function normalizeExternalApiKeys(value: unknown): ExternalApiKeys {
  if (!value || typeof value !== "object") {
    return initialExternalApiKeys;
  }

  const candidate = value as Partial<Record<keyof ExternalApiKeys, unknown>>;

  return {
    googlePlacesApiKey: normalizeApiKey(candidate.googlePlacesApiKey),
    openAiApiKey: normalizeApiKey(candidate.openAiApiKey),
    geminiApiKey: normalizeApiKey(candidate.geminiApiKey),
  };
}

