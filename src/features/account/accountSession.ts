import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAccountStatusForUser } from "./accountPersistence";
import { createSupabaseAccountServerClient } from "./supabaseAccountServerClient";

export const wearaboutsGuestIdHeader = "x-wearabouts-guest-id";

const guestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getBearerTokenFromAuthorizationHeader(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export interface AccountRouteSession {
  ok: true;
  kind: "account";
  supabase: SupabaseClient;
  user: User;
  userId: string;
  email: string | null;
  circleId: string;
  profileId: string;
}

export interface GuestRouteSession {
  ok: true;
  kind: "guest";
  supabase: SupabaseClient;
  user: null;
  userId: null;
  email: null;
  guestId: string;
  circleId: string;
  profileId: string;
}

export type AccountRouteSessionResult =
  | AccountRouteSession
  | GuestRouteSession
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    };

export function getGuestIdFromHeader(header: string | null): string | null {
  const value = header?.trim().toLowerCase();
  return value && guestIdPattern.test(value) ? value : null;
}

export function getGuestOwnerFromGuestId(guestId: string): Pick<GuestRouteSession, "guestId" | "circleId" | "profileId"> {
  return {
    guestId,
    circleId: `guest-${guestId}`,
    profileId: `guest-profile-${guestId}`,
  };
}

export async function requireAccountSession(
  request: Request,
  options: {
    supabase?: SupabaseClient;
    requestedProfileId?: unknown;
    allowGuest?: boolean;
  } = {},
): Promise<AccountRouteSessionResult> {
  const token = getBearerTokenFromAuthorizationHeader(request.headers.get("authorization"));
  if (!token) {
    const guestId = options.allowGuest ? getGuestIdFromHeader(request.headers.get(wearaboutsGuestIdHeader)) : null;
    if (guestId) {
      return {
        ok: true,
        kind: "guest",
        supabase: options.supabase ?? createSupabaseAccountServerClient(),
        user: null,
        userId: null,
        email: null,
        ...getGuestOwnerFromGuestId(guestId),
      };
    }

    return { ok: false, status: 401, error: "Sign in to continue." };
  }

  const supabase = options.supabase ?? createSupabaseAccountServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, status: 401, error: "Your session has expired. Sign in again." };
  }

  const account = await getAccountStatusForUser(supabase, data.user);
  if (!account.circle || !account.profile) {
    return { ok: false, status: 403, error: "Finish onboarding to build your wardrobe." };
  }

  const requestedProfileId = typeof options.requestedProfileId === "string" ? options.requestedProfileId : null;
  if (!requestedProfileId || requestedProfileId === account.profile.id) {
    return {
      ok: true,
      kind: "account",
      supabase,
      user: data.user,
      userId: data.user.id,
      email: data.user.email ?? null,
      circleId: account.circle.id,
      profileId: account.profile.id,
    };
  }

  const { data: requestedProfile, error: requestedProfileError } = await supabase
    .from("wardrobe_profiles")
    .select("id,circle_id")
    .eq("id", requestedProfileId)
    .eq("circle_id", account.circle.id)
    .maybeSingle();
  if (requestedProfileError) {
    throw new Error(requestedProfileError.message);
  }
  if (!requestedProfile) {
    return { ok: false, status: 403, error: "That wardrobe profile is not available in your Circle." };
  }

  return {
    ok: true,
    kind: "account",
    supabase,
    user: data.user,
    userId: data.user.id,
    email: data.user.email ?? null,
    circleId: account.circle.id,
    profileId: requestedProfileId,
  };
}
