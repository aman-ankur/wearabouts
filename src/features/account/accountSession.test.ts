import { describe, expect, it } from "vitest";
import { getBearerTokenFromAuthorizationHeader } from "./accountSession";
import { requireAccountSession } from "./accountSession";

describe("accountSession", () => {
  it("returns the bearer token from an authorization header", () => {
    expect(getBearerTokenFromAuthorizationHeader("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("trims extra whitespace around the bearer token", () => {
    expect(getBearerTokenFromAuthorizationHeader("Bearer   token-value   ")).toBe("token-value");
  });

  it("returns null for missing or non-bearer headers", () => {
    expect(getBearerTokenFromAuthorizationHeader(null)).toBeNull();
    expect(getBearerTokenFromAuthorizationHeader("Basic abc")).toBeNull();
    expect(getBearerTokenFromAuthorizationHeader("Bearer ")).toBeNull();
  });

  it("resolves the authenticated user's active Circle and wardrobe profile", async () => {
    const supabase = createMockSupabase({
      user: { id: "user-1", email: "aankur@example.com" },
      membership: { circle_id: "circle-1" },
      circle: { id: "circle-1", name: "Aankur's Circle" },
      profile: {
        id: "profile-1",
        circle_id: "circle-1",
        display_name: "Aankur",
        gender_presentation: "men",
        profile_type: "personal",
      },
    });

    await expect(
      requireAccountSession(new Request("https://wearabouts.test/api", { headers: { Authorization: "Bearer token-1" } }), {
        supabase,
      }),
    ).resolves.toMatchObject({
      ok: true,
      userId: "user-1",
      circleId: "circle-1",
      profileId: "profile-1",
    });
  });

  it("rejects a requested wardrobe profile outside the user's Circle", async () => {
    const supabase = createMockSupabase({
      user: { id: "user-1", email: "aankur@example.com" },
      membership: { circle_id: "circle-1" },
      circle: { id: "circle-1", name: "Aankur's Circle" },
      profile: {
        id: "profile-1",
        circle_id: "circle-1",
        display_name: "Aankur",
        gender_presentation: "men",
        profile_type: "personal",
      },
      requestedProfile: null,
    });

    await expect(
      requireAccountSession(new Request("https://wearabouts.test/api", { headers: { Authorization: "Bearer token-1" } }), {
        supabase,
        requestedProfileId: "profile-from-another-circle",
      }),
    ).resolves.toEqual({
      ok: false,
      status: 403,
      error: "That wardrobe profile is not available in your Circle.",
    });
  });
});

function createMockSupabase(input: {
  user: { id: string; email: string | null };
  membership: { circle_id: string } | null;
  circle: { id: string; name: string } | null;
  profile: {
    id: string;
    circle_id: string;
    display_name: string;
    gender_presentation: "men" | "women" | "unisex" | "prefer_not_to_say";
    profile_type: "personal" | "shared";
  } | null;
  requestedProfile?: { id: string; circle_id: string } | null;
}) {
  return {
    auth: {
      getUser: async (token: string) => ({
        data: token === "token-1" ? { user: input.user } : { user: null },
        error: null,
      }),
    },
    from(table: string) {
      return createQuery(table, input);
    },
  } as never;
}

function createQuery(table: string, input: Parameters<typeof createMockSupabase>[0]) {
  const filters: Array<{ column: string; value: unknown }> = [];
  const query = {
    select: () => query,
    eq: (column: string, value: unknown) => {
      filters.push({ column, value });
      return query;
    },
    order: () => query,
    limit: () => query,
    maybeSingle: async () => {
      if (table === "circle_members") return { data: input.membership, error: null };
      if (table === "circles") return { data: input.circle, error: null };
      if (table === "wardrobe_profiles") {
        const requestedId = filters.find((filter) => filter.column === "id")?.value;
        if (requestedId) {
          return { data: input.requestedProfile ?? null, error: null };
        }

        return { data: input.profile, error: null };
      }
      return { data: null, error: null };
    },
  };

  return query;
}
