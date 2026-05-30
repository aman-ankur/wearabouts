import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAccountStatusForUser } from "./accountPersistence";
import { createSupabaseAccountServerClient } from "./supabaseAccountServerClient";

export function getBearerTokenFromAuthorizationHeader(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export interface AccountRouteSession {
  ok: true;
  supabase: SupabaseClient;
  user: User;
  userId: string;
  email: string | null;
  circleId: string;
  profileId: string;
}

export type AccountRouteSessionResult =
  | AccountRouteSession
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    };

export async function requireAccountSession(
  request: Request,
  options: {
    supabase?: SupabaseClient;
    requestedProfileId?: unknown;
  } = {},
): Promise<AccountRouteSessionResult> {
  const token = getBearerTokenFromAuthorizationHeader(request.headers.get("authorization"));
  if (!token) {
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
    supabase,
    user: data.user,
    userId: data.user.id,
    email: data.user.email ?? null,
    circleId: account.circle.id,
    profileId: requestedProfileId,
  };
}
