import { NextResponse, type NextRequest } from "next/server";
import { updateCircleWardrobeProfile } from "@/src/features/account/accountPersistence";
import { validateOnboardingProfile } from "@/src/features/account/accountProfile";
import { getBearerTokenFromAuthorizationHeader } from "@/src/features/account/accountSession";
import { createSupabaseAccountServerClient } from "@/src/features/account/supabaseAccountServerClient";

async function authenticateRequest(request: NextRequest) {
  const token = getBearerTokenFromAuthorizationHeader(request.headers.get("authorization"));
  if (!token) {
    return { error: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  }

  const supabase = createSupabaseAccountServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 }) };
  }

  return { supabase, user: data.user };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ profileId: string }> }) {
  const auth = await authenticateRequest(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { profileId } = await context.params;
  if (!profileId) {
    return NextResponse.json({ error: "Choose a Circle profile to update." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected profile details." }, { status: 400 });
  }

  const bodyObject = typeof body === "object" && body ? body as Record<string, unknown> : {};
  const validation = validateOnboardingProfile({
    displayName: bodyObject.displayName,
    genderPresentation: bodyObject.genderPresentation,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const account = await updateCircleWardrobeProfile(auth.supabase, auth.user, profileId, validation.value);
    return NextResponse.json({ account });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update profile.";
    const status = message.includes("not available") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
