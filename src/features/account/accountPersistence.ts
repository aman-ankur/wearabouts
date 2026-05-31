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
  profiles: WardrobeProfileRow[] = profile ? [profile] : [],
): AccountStatus {
  const circleSummary: CircleSummary | null = circle ? { id: circle.id, name: circle.name } : null;
  const toProfileSummary = (row: WardrobeProfileRow): WardrobeProfileSummary => ({
    id: row.id,
    circleId: row.circle_id,
    displayName: row.display_name,
    genderPresentation: row.gender_presentation,
    profileType: row.profile_type,
  });
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
    profiles: profiles.map(toProfileSummary),
  };
}

export async function getAccountStatusForUser(supabase: SupabaseClient, user: User): Promise<AccountStatus> {
  const membership = await findPrimaryMembership(supabase, user.id);
  if (!membership) {
    return toAccountStatus(user, null, null);
  }

  const [circle, profile, profiles] = await Promise.all([
    findCircle(supabase, membership.circle_id),
    findPrimaryPersonalProfile(supabase, membership.circle_id, user.id),
    findCircleProfiles(supabase, membership.circle_id),
  ]);

  return toAccountStatus(user, circle, profile, profiles);
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

  const profiles = await findCircleProfiles(supabase, circle.id);
  return toAccountStatus(user, circle, wardrobeProfile, profiles);
}

export async function createCircleWardrobeProfile(
  supabase: SupabaseClient,
  user: User,
  profile: OnboardingProfile,
): Promise<AccountStatus> {
  const membership = await findPrimaryMembership(supabase, user.id);
  if (!membership) {
    throw new Error("Finish onboarding before adding another profile.");
  }

  const circle = await findCircleOrThrow(supabase, membership.circle_id);
  try {
    await insertWardrobeProfile(supabase, {
      circleId: circle.id,
      userId: user.id,
      displayName: profile.displayName,
      genderPresentation: profile.genderPresentation,
      profileType: "personal",
    });
  } catch (error) {
    if (!isLegacyProfileTypeUniqueConstraintError(error)) {
      throw error;
    }

    await insertWardrobeProfile(supabase, {
      circleId: circle.id,
      userId: user.id,
      displayName: profile.displayName,
      genderPresentation: profile.genderPresentation,
      profileType: "shared",
    });
  }

  return getAccountStatusForUser(supabase, user);
}

function isLegacyProfileTypeUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("wardrobe_profiles_circle_id_owner_user_id_profile_type_key");
}

export async function updateCircleWardrobeProfile(
  supabase: SupabaseClient,
  user: User,
  profileId: string,
  profile: OnboardingProfile,
): Promise<AccountStatus> {
  const membership = await findPrimaryMembership(supabase, user.id);
  if (!membership) {
    throw new Error("Finish onboarding before editing a profile.");
  }

  const circle = await findCircleOrThrow(supabase, membership.circle_id);
  const existing = await findWardrobeProfileInCircle(supabase, circle.id, profileId);
  if (!existing) {
    throw new Error("That wardrobe profile is not available in your Circle.");
  }

  await updateWardrobeProfile(supabase, existing.id, {
    circleId: circle.id,
    userId: user.id,
    displayName: profile.displayName,
    genderPresentation: profile.genderPresentation,
    profileType: existing.profile_type,
  });

  return getAccountStatusForUser(supabase, user);
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

async function findPrimaryPersonalProfile(
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
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  return data as WardrobeProfileRow | null;
}

async function findCircleProfiles(supabase: SupabaseClient, circleId: string): Promise<WardrobeProfileRow[]> {
  const { data, error } = await supabase
    .from("wardrobe_profiles")
    .select("id,circle_id,display_name,gender_presentation,profile_type")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WardrobeProfileRow[];
}

async function findWardrobeProfileInCircle(
  supabase: SupabaseClient,
  circleId: string,
  profileId: string,
): Promise<WardrobeProfileRow | null> {
  const { data, error } = await supabase
    .from("wardrobe_profiles")
    .select("id,circle_id,display_name,gender_presentation,profile_type")
    .eq("id", profileId)
    .eq("circle_id", circleId)
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
  const existing = await findPrimaryPersonalProfile(supabase, input.circleId, input.userId);
  return existing
    ? updateWardrobeProfile(supabase, existing.id, {
        circleId: input.circleId,
        userId: input.userId,
        displayName: input.displayName,
        genderPresentation: input.genderPresentation,
        profileType: "personal",
      })
    : insertWardrobeProfile(supabase, {
        circleId: input.circleId,
        userId: input.userId,
        displayName: input.displayName,
        genderPresentation: input.genderPresentation,
        profileType: "personal",
      });
}

async function insertWardrobeProfile(
  supabase: SupabaseClient,
  input: {
    circleId: string;
    userId: string;
    displayName: string;
    genderPresentation: GenderPresentation;
    profileType: WardrobeProfileSummary["profileType"];
  },
): Promise<WardrobeProfileRow> {
  const { data, error } = await supabase
    .from("wardrobe_profiles")
    .insert({
      circle_id: input.circleId,
      owner_user_id: input.userId,
      display_name: input.displayName,
      gender_presentation: input.genderPresentation,
      profile_type: input.profileType,
    })
    .select("id,circle_id,display_name,gender_presentation,profile_type")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  return data as WardrobeProfileRow;
}

async function updateWardrobeProfile(
  supabase: SupabaseClient,
  profileId: string,
  input: {
    circleId: string;
    userId: string;
    displayName: string;
    genderPresentation: GenderPresentation;
    profileType: WardrobeProfileSummary["profileType"];
  },
): Promise<WardrobeProfileRow> {
  const values = {
    circle_id: input.circleId,
    owner_user_id: input.userId,
    display_name: input.displayName,
    gender_presentation: input.genderPresentation,
    profile_type: input.profileType,
  };

  const { data, error } = await supabase
    .from("wardrobe_profiles")
    .update(values)
    .eq("id", profileId)
    .select("id,circle_id,display_name,gender_presentation,profile_type")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  return data as WardrobeProfileRow;
}
