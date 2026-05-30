import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AccountStatus, CircleSummary, GenderPresentation, OnboardingProfile, WardrobeProfileSummary } from "./accountTypes";
import { createDefaultCircleName } from "./accountProfile";

interface AccountUser {
  id: string;
  email?: string | null;
}

interface CircleRow {
  id: string;
  name: string;
}

interface CircleMemberRow {
  circle_id: string;
}

interface WardrobeProfileRow {
  id: string;
  circle_id: string;
  display_name: string;
  gender_presentation: GenderPresentation;
  profile_type: WardrobeProfileSummary["profileType"];
}

export function toAccountStatus(
  user: AccountUser,
  circle: CircleRow | null,
  profile: WardrobeProfileRow | null,
): AccountStatus {
  const circleSummary: CircleSummary | null = circle ? { id: circle.id, name: circle.name } : null;
  const profileSummary: WardrobeProfileSummary | null = profile
    ? {
        id: profile.id,
        circleId: profile.circle_id,
        displayName: profile.display_name,
        genderPresentation: profile.gender_presentation,
        profileType: profile.profile_type,
      }
    : null;

  return {
    email: user.email ?? null,
    onboardingComplete: Boolean(circleSummary && profileSummary),
    circle: circleSummary,
    profile: profileSummary,
  };
}

export async function getAccountStatusForUser(supabase: SupabaseClient, user: User): Promise<AccountStatus> {
  const membership = await findPrimaryMembership(supabase, user.id);
  if (!membership) {
    return toAccountStatus(user, null, null);
  }

  const [circle, profile] = await Promise.all([
    findCircle(supabase, membership.circle_id),
    findPersonalProfile(supabase, membership.circle_id, user.id),
  ]);

  return toAccountStatus(user, circle, profile);
}

export async function completeAccountOnboarding(
  supabase: SupabaseClient,
  user: User,
  profile: OnboardingProfile,
): Promise<AccountStatus> {
  const membership = await findPrimaryMembership(supabase, user.id);
  const circle = membership
    ? await findCircleOrThrow(supabase, membership.circle_id)
    : await createDefaultCircle(supabase, user.id, profile.displayName);

  if (!membership) {
    await insertCircleMember(supabase, circle.id, user.id);
  }

  const wardrobeProfile = await upsertPersonalProfile(supabase, {
    circleId: circle.id,
    userId: user.id,
    displayName: profile.displayName,
    genderPresentation: profile.genderPresentation,
  });

  return toAccountStatus(user, circle, wardrobeProfile);
}

async function findPrimaryMembership(supabase: SupabaseClient, userId: string): Promise<CircleMemberRow | null> {
  const { data, error } = await supabase
    .from("circle_members")
    .select("circle_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  return data as CircleMemberRow | null;
}

async function findCircle(supabase: SupabaseClient, circleId: string): Promise<CircleRow | null> {
  const { data, error } = await supabase.from("circles").select("id,name").eq("id", circleId).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  return data as CircleRow | null;
}

async function findCircleOrThrow(supabase: SupabaseClient, circleId: string): Promise<CircleRow> {
  const circle = await findCircle(supabase, circleId);
  if (!circle) {
    throw new Error("Could not find Circle for account.");
  }

  return circle;
}

async function createDefaultCircle(supabase: SupabaseClient, userId: string, displayName: string): Promise<CircleRow> {
  const { data, error } = await supabase
    .from("circles")
    .insert({
      name: createDefaultCircleName(displayName),
      created_by_user_id: userId,
    })
    .select("id,name")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  return data as CircleRow;
}

async function insertCircleMember(supabase: SupabaseClient, circleId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("circle_members").insert({
    circle_id: circleId,
    user_id: userId,
    role: "owner",
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function findPersonalProfile(
  supabase: SupabaseClient,
  circleId: string,
  userId: string,
): Promise<WardrobeProfileRow | null> {
  const { data, error } = await supabase
    .from("wardrobe_profiles")
    .select("id,circle_id,display_name,gender_presentation,profile_type")
    .eq("circle_id", circleId)
    .eq("owner_user_id", userId)
    .eq("profile_type", "personal")
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  return data as WardrobeProfileRow | null;
}

async function upsertPersonalProfile(
  supabase: SupabaseClient,
  input: {
    circleId: string;
    userId: string;
    displayName: string;
    genderPresentation: GenderPresentation;
  },
): Promise<WardrobeProfileRow> {
  const existing = await findPersonalProfile(supabase, input.circleId, input.userId);
  const values = {
    circle_id: input.circleId,
    owner_user_id: input.userId,
    display_name: input.displayName,
    gender_presentation: input.genderPresentation,
    profile_type: "personal",
  };

  const query = existing
    ? supabase.from("wardrobe_profiles").update(values).eq("id", existing.id)
    : supabase.from("wardrobe_profiles").insert(values);

  const { data, error } = await query.select("id,circle_id,display_name,gender_presentation,profile_type").single();
  if (error) {
    throw new Error(error.message);
  }

  return data as WardrobeProfileRow;
}
