import { afterEach, describe, expect, it, vi } from "vitest";
import { wearaboutsGuestIdHeader } from "./accountSession";
import {
  activeWardrobeProfileStorageKey,
  completeOnboarding,
  createAuthorizationHeaders,
  createCircleProfile,
  createWardrobeSessionHeaders,
  fetchAccountStatus,
  setActiveWardrobeProfileId,
  updateCircleProfile,
  wearaboutsGuestIdStorageKey,
} from "./accountApiClient";
import type { AccountStatus } from "./accountTypes";

const account: AccountStatus = {
  email: "aankur@example.com",
  onboardingComplete: true,
  circle: { id: "circle-1", name: "Aankur's Circle" },
  profile: {
    id: "profile-1",
    circleId: "circle-1",
    displayName: "Aankur",
    genderPresentation: "men",
    profileType: "personal",
  },
  profiles: [
    {
      id: "profile-1",
      circleId: "circle-1",
      displayName: "Aankur",
      genderPresentation: "men",
      profileType: "personal",
    },
  ],
};

describe("accountApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches account status with a bearer token", async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return new Response(JSON.stringify({ account }), { status: 200 });
    };

    await expect(fetchAccountStatus("token-1", fetcher)).resolves.toEqual(account);

    expect(calls).toEqual([
      {
        input: "/api/account/me",
        init: {
          headers: { Authorization: "Bearer token-1" },
        },
      },
    ]);
  });

  it("submits onboarding details with a bearer token", async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return new Response(JSON.stringify({ account }), { status: 200 });
    };

    await expect(
      completeOnboarding("token-1", { displayName: "Aankur", genderPresentation: "men" }, fetcher),
    ).resolves.toEqual(account);

    expect(calls).toEqual([
      {
        input: "/api/account/me",
        init: {
          method: "POST",
          headers: {
            Authorization: "Bearer token-1",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ displayName: "Aankur", genderPresentation: "men" }),
        },
      },
    ]);
  });

  it("creates another Circle profile with a bearer token", async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return new Response(JSON.stringify({ account }), { status: 200 });
    };

    await expect(
      createCircleProfile("token-1", { displayName: "Sara", genderPresentation: "women" }, fetcher),
    ).resolves.toEqual(account);

    expect(calls).toEqual([
      {
        input: "/api/account/profiles",
        init: {
          method: "POST",
          headers: {
            Authorization: "Bearer token-1",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ displayName: "Sara", genderPresentation: "women" }),
        },
      },
    ]);
  });

  it("updates a selected Circle profile with a bearer token", async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return new Response(JSON.stringify({ account }), { status: 200 });
    };

    await expect(
      updateCircleProfile("token-1", "profile-2", { displayName: "Sara", genderPresentation: "women" }, fetcher),
    ).resolves.toEqual(account);

    expect(calls).toEqual([
      {
        input: "/api/account/profiles/profile-2",
        init: {
          method: "PATCH",
          headers: {
            Authorization: "Bearer token-1",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ displayName: "Sara", genderPresentation: "women" }),
        },
      },
    ]);
  });

  it("throws the API error message when account requests fail", async () => {
    const fetcher = async () =>
      new Response(JSON.stringify({ error: "Your session has expired. Sign in again." }), { status: 401 });

    await expect(fetchAccountStatus("expired", fetcher)).rejects.toThrow("Your session has expired. Sign in again.");
  });

  it("creates authorization headers from the active Supabase browser session", async () => {
    const supabase = {
      auth: {
        getSession: async () => ({ data: { session: { access_token: "token-1" } }, error: null }),
      },
    };

    await expect(createAuthorizationHeaders(supabase as never)).resolves.toEqual({ Authorization: "Bearer token-1" });
  });

  it("creates wardrobe session headers from the active Supabase browser session", async () => {
    const storage = new Map<string, string>([[activeWardrobeProfileStorageKey, "profile-2"]]);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      dispatchEvent: vi.fn(),
    });
    const supabase = {
      auth: {
        getSession: async () => ({ data: { session: { access_token: "token-1" } }, error: null }),
      },
    };

    await expect(createWardrobeSessionHeaders(supabase as never)).resolves.toEqual({
      Authorization: "Bearer token-1",
      "x-wearabouts-profile-id": "profile-2",
    });
  });

  it("stores the active wardrobe profile locally", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      dispatchEvent: vi.fn(),
    });

    setActiveWardrobeProfileId("profile-2");

    expect(storage.get(activeWardrobeProfileStorageKey)).toBe("profile-2");
  });

  it("falls back to a temporary guest id for wardrobe session headers", async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    vi.stubGlobal("crypto", { randomUUID: () => "018f77c2-2e8b-4a69-9ac7-31d0f05d90aa" });

    await expect(createWardrobeSessionHeaders(null)).resolves.toEqual({
      [wearaboutsGuestIdHeader]: "018f77c2-2e8b-4a69-9ac7-31d0f05d90aa",
    });
    expect(storage.get(wearaboutsGuestIdStorageKey)).toBe("018f77c2-2e8b-4a69-9ac7-31d0f05d90aa");
  });
});
