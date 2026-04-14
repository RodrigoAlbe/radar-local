export interface SocialOverride {
  instagram_url?: string | null;
  facebook_url?: string | null;
  linktree_url?: string | null;
}

const SOCIAL_OVERRIDES: Record<string, SocialOverride> = {
  ChIJ_YfmJa73zpQRzseRsHBsPAM: {
    instagram_url: "https://www.instagram.com/analins.personalhair/",
  },
};

export function getSocialOverride(businessId: string | null | undefined): SocialOverride | null {
  if (!businessId) return null;
  return SOCIAL_OVERRIDES[businessId] ?? null;
}
