import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountStatus, OnboardingProfile } from "./accountTypes";
import { getSupabaseBrowserClient } from "./supabaseBrowserClient";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

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

export async function fetchWithAccountSession(
  input: RequestInfo | URL,
  init: RequestInit = {},
  fetcher: Fetcher = fetch,
): Promise<Response> {
  const authorizationHeaders = await createAuthorizationHeaders();
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(authorizationHeaders)) {
    headers.set(key, value);
  }

  return fetcher(input, { ...init, headers });
}
