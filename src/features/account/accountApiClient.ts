import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountStatus, OnboardingProfile } from "./accountTypes";
import { wearaboutsGuestIdHeader, wearaboutsProfileIdHeader } from "./accountSession";
import { getSupabaseBrowserClient } from "./supabaseBrowserClient";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export const wearaboutsGuestIdStorageKey = "wearabouts_guest_id";
export const activeWardrobeProfileStorageKey = "wearabouts_active_profile_id";
export const activeWardrobeProfileChangedEvent = "wearabouts-active-profile-changed";

async function readAccountResponse(response: Response): Promise<AccountStatus> {
  const payload = await response.json() as { account?: AccountStatus; error?: string };
  if (!response.ok || !payload.account) {
    throw new Error(payload.error ?? "Could not load account.");
  }

  return payload.account;
}

export async function fetchAccountStatus(accessToken: string, fetcher: Fetcher = fetch): Promise<AccountStatus> {
  return readAccountResponse(
    await fetcher("/api/account/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );
}

export async function completeOnboarding(
  accessToken: string,
  profile: OnboardingProfile,
  fetcher: Fetcher = fetch,
): Promise<AccountStatus> {
  return readAccountResponse(
    await fetcher("/api/account/me", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    }),
  );
}

export async function createCircleProfile(
  accessToken: string,
  profile: OnboardingProfile,
  fetcher: Fetcher = fetch,
): Promise<AccountStatus> {
  return readAccountResponse(
    await fetcher("/api/account/profiles", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    }),
  );
}

export async function updateCircleProfile(
  accessToken: string,
  profileId: string,
  profile: OnboardingProfile,
  fetcher: Fetcher = fetch,
): Promise<AccountStatus> {
  return readAccountResponse(
    await fetcher(`/api/account/profiles/${encodeURIComponent(profileId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    }),
  );
}

export async function createAuthorizationHeaders(
  supabase: Pick<SupabaseClient, "auth"> | null = getSupabaseBrowserClient(),
): Promise<Record<string, string>> {
  if (!supabase) {
    throw new Error("Sign in to continue.");
  }

  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) {
    throw new Error("Sign in to continue.");
  }

  return { Authorization: `Bearer ${accessToken}` };
}

export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") {
    throw new Error("Guest mode is only available in the browser.");
  }

  const existing = window.localStorage.getItem(wearaboutsGuestIdStorageKey);
  if (existing) {
    return existing;
  }

  const guestId = crypto.randomUUID();
  window.localStorage.setItem(wearaboutsGuestIdStorageKey, guestId);
  return guestId;
}

export function getActiveWardrobeProfileId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(activeWardrobeProfileStorageKey);
}

export function setActiveWardrobeProfileId(profileId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (profileId) {
    window.localStorage.setItem(activeWardrobeProfileStorageKey, profileId);
  } else {
    window.localStorage.removeItem(activeWardrobeProfileStorageKey);
  }
  window.dispatchEvent(new CustomEvent(activeWardrobeProfileChangedEvent, { detail: { profileId } }));
}

export function subscribeToActiveWardrobeProfileChange(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(activeWardrobeProfileChangedEvent, listener);
  return () => window.removeEventListener(activeWardrobeProfileChangedEvent, listener);
}

export async function createWardrobeSessionHeaders(
  supabase: Pick<SupabaseClient, "auth"> | null = getSupabaseBrowserClient(),
): Promise<Record<string, string>> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
      const activeProfileId = getActiveWardrobeProfileId();
      if (activeProfileId) {
        headers[wearaboutsProfileIdHeader] = activeProfileId;
      }
      return headers;
    }
  }

  return { [wearaboutsGuestIdHeader]: getOrCreateGuestId() };
}

export async function fetchWithAccountSession(
  input: RequestInfo | URL,
  init: RequestInit = {},
  fetcher: Fetcher = fetch,
): Promise<Response> {
  const authorizationHeaders = await createWardrobeSessionHeaders();
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(authorizationHeaders)) {
    headers.set(key, value);
  }

  return fetcher(input, { ...init, headers });
}
