import type { AccountStatus, OnboardingProfile } from "./accountTypes";

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
