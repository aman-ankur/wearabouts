"use client";

import { Check, LogOut, Plus, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  createCircleProfile,
  fetchAccountStatus,
  getActiveWardrobeProfileId,
  setActiveWardrobeProfileId,
  updateCircleProfile,
} from "@/src/features/account/accountApiClient";
import type { AccountStatus, GenderPresentation } from "@/src/features/account/accountTypes";
import { getSupabaseBrowserClient } from "@/src/features/account/supabaseBrowserClient";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";

const genderOptions: Array<{ value: GenderPresentation; label: string }> = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Flexible" },
  { value: "prefer_not_to_say", label: "Skip" },
];

function getProfileInitial(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase() || "W";
}

function getGenderLabel(value: GenderPresentation) {
  return genderOptions.find((option) => option.value === value)?.label ?? "Style";
}

function getNewProfilePlaceholder(value: GenderPresentation) {
  if (value === "men") return "Male profile";
  if (value === "women") return "Female profile";
  if (value === "unisex") return "Flexible profile";
  return "Circle profile";
}

function inputStyle() {
  return {
    minHeight: 44,
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "0 12px",
    background: "var(--paper)",
    fontWeight: 680,
  } satisfies React.CSSProperties;
}

function GenderSegment({
  value,
  onChange,
}: {
  value: GenderPresentation;
  onChange: (value: GenderPresentation) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 7 }}>
      {genderOptions.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className="pill"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            style={{
              width: "100%",
              justifyContent: "center",
              border: `1px solid ${isActive ? "#282622" : "var(--line)"}`,
              minHeight: 38,
              padding: "6px 8px",
              fontSize: 12,
              background: isActive ? "#282622" : "var(--soft)",
              color: isActive ? "var(--white)" : "var(--ink)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [genderPresentation, setGenderPresentation] = useState<GenderPresentation>("men");
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileGenderPresentation, setNewProfileGenderPresentation] = useState<GenderPresentation>("women");
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? null;
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const nextAccount = await fetchAccountStatus(token);
        if (cancelled) return;
        if (!nextAccount.profile) {
          router.replace("/onboarding");
          return;
        }
        setAccessToken(token);
        setAccount(nextAccount);
        setDisplayName(nextAccount.profile.displayName);
        setGenderPresentation(nextAccount.profile.genderPresentation);
        const storedProfileId = getActiveWardrobeProfileId();
        const availableProfiles = nextAccount.profiles.length ? nextAccount.profiles : [nextAccount.profile];
        const availableProfileIds = new Set(availableProfiles.map((profile) => profile.id));
        const nextActiveProfileId = storedProfileId && availableProfileIds.has(storedProfileId) ? storedProfileId : nextAccount.profile.id;
        const nextActiveProfile = availableProfiles.find((profile) => profile.id === nextActiveProfileId) ?? nextAccount.profile;
        setActiveProfileId(nextActiveProfileId);
        setActiveWardrobeProfileId(nextActiveProfileId);
        setDisplayName(nextActiveProfile.displayName);
        setGenderPresentation(nextActiveProfile.genderPresentation);
        setIsLoading(false);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load profile.");
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !activeProfileId || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const nextAccount = await updateCircleProfile(accessToken, activeProfileId, { displayName, genderPresentation });
      const updatedProfile = nextAccount.profiles.find((profile) => profile.id === activeProfileId) ?? nextAccount.profile;
      setAccount(nextAccount);
      setActiveWardrobeProfileId(activeProfileId);
      if (updatedProfile) {
        setDisplayName(updatedProfile.displayName);
        setGenderPresentation(updatedProfile.genderPresentation);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || isCreatingProfile) return;

    setIsCreatingProfile(true);
    setError(null);
    try {
      const nextAccount = await createCircleProfile(accessToken, {
        displayName: newProfileName,
        genderPresentation: newProfileGenderPresentation,
      });
      const createdProfile = nextAccount.profiles[nextAccount.profiles.length - 1] ?? nextAccount.profile;
      setAccount(nextAccount);
      setNewProfileName("");
      if (createdProfile) {
        setActiveProfileId(createdProfile.id);
        setActiveWardrobeProfileId(createdProfile.id);
        setDisplayName(createdProfile.displayName);
        setGenderPresentation(createdProfile.genderPresentation);
        setIsAddProfileOpen(false);
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not add profile.");
    } finally {
      setIsCreatingProfile(false);
    }
  }

  function handleSelectProfile(profileId: string) {
    const profile = account?.profiles.find((item) => item.id === profileId) ?? (account?.profile?.id === profileId ? account.profile : null);
    setActiveProfileId(profileId);
    setActiveWardrobeProfileId(profileId);
    if (profile) {
      setDisplayName(profile.displayName);
      setGenderPresentation(profile.genderPresentation);
    }
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
    router.replace("/");
  }

  const profiles = account?.profiles.length ? account.profiles : account?.profile ? [account.profile] : [];
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? account?.profile ?? null;
  const activeProfileName = activeProfile?.displayName ?? "Profile";
  const activeStyleLabel = activeProfile ? getGenderLabel(activeProfile.genderPresentation) : "Style";
  const charcoal = "#282622";
  const charcoalSoft = "#f1eee8";
  const charcoalLine = "#d8d0c5";
  const charcoalMuted = "#6d665d";

  if (isLoading) {
    return (
      <AppShell>
        <p className="subtle" role="status" style={{ margin: 0 }}>
          Loading profile...
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="appbar" style={{ alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <h1 className="app-title" style={{ fontSize: 30 }}>Circle</h1>
          <p className="subtle" style={{ margin: "6px 0 0" }}>
            {profiles.length} {profiles.length === 1 ? "profile" : "profiles"} in {account?.circle?.name ?? "My Circle"}
          </p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setIsAddProfileOpen(true);
            window.requestAnimationFrame(() => {
              const element = document.getElementById("add-circle-profile");
              element?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
          }}
          style={{ width: 42, minWidth: 42, minHeight: 42, padding: 0, borderRadius: 999, color: charcoal }}
          aria-label="Add Circle profile"
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="stack">
        {activeProfile ? (
          <section
            className="card"
            style={{
              display: "grid",
              gap: 12,
              padding: 12,
              background: charcoalSoft,
              borderColor: charcoalLine,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 17 }}>Active now</h2>
              <span className="pill" style={{ minHeight: 28, background: "var(--paper)" }}>
                {activeStyleLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleSelectProfile(activeProfile.id)}
              aria-pressed="true"
              style={{
                width: "100%",
                minHeight: 66,
                border: `1px solid ${charcoalLine}`,
                borderRadius: 8,
                background: "rgba(255, 253, 250, 0.78)",
                color: "var(--ink)",
                padding: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: charcoal,
                    color: "var(--white)",
                    fontWeight: 850,
                    flex: "0 0 auto",
                  }}
                >
                  {getProfileInitial(activeProfile.displayName)}
                </span>
                <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                  <strong style={{ fontSize: 16, lineHeight: 1.1 }}>{activeProfile.displayName}</strong>
                  <small style={{ color: charcoalMuted, fontWeight: 650 }}>Wardrobe, avatar, and suggestions</small>
                </span>
              </span>
              <span className="pill" style={{ minHeight: 28, background: charcoal, color: "var(--white)" }}>
                Edit
              </span>
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  const element = document.getElementById("circle-members");
                  element?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                style={{ minHeight: 40, color: charcoal, fontSize: 13, fontWeight: 820 }}
              >
                Switch profile
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => router.push("/closet")}
                style={{ minHeight: 40, color: charcoal, fontSize: 13, fontWeight: 820 }}
              >
                View closet
              </button>
            </div>
          </section>
        ) : null}

        <section id="circle-members" className="card" style={{ display: "grid", gap: 10, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>Circle members</h2>
            <span className="pill" style={{ minHeight: 28 }}>
              {profiles.length}
            </span>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {profiles.map((profile) => {
              const isActive = activeProfileId === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleSelectProfile(profile.id)}
                  aria-pressed={isActive}
                  style={{
                    width: "100%",
                    minHeight: 62,
                    border: `1px solid ${isActive ? charcoalLine : "var(--line)"}`,
                    borderRadius: 8,
                    background: isActive ? charcoalSoft : "var(--paper)",
                    color: "var(--ink)",
                    padding: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        background: isActive ? charcoal : "var(--soft)",
                        color: isActive ? "var(--white)" : "var(--ink)",
                        fontWeight: 850,
                        flex: "0 0 auto",
                      }}
                    >
                      {getProfileInitial(profile.displayName)}
                    </span>
                    <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                      <strong style={{ fontSize: 15, lineHeight: 1.1 }}>{profile.displayName}</strong>
                      <small style={{ color: "var(--muted)", fontWeight: 650 }}>
                        {isActive ? "Active profile" : "Circle profile"}
                      </small>
                    </span>
                  </span>
                  <span
                    style={{
                      minHeight: 28,
                      borderRadius: 999,
                      padding: "6px 10px",
                      background: isActive ? charcoal : "var(--soft)",
                      color: isActive ? "var(--white)" : "var(--ink)",
                      fontSize: 12,
                      fontWeight: 780,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getGenderLabel(profile.genderPresentation)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <form
          className="card"
          onSubmit={handleSave}
          style={{
            display: "grid",
            gap: 13,
            padding: 12,
            background: "linear-gradient(180deg, var(--white), var(--paper))",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "var(--soft)",
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                }}
              >
                <UserRound size={17} />
              </span>
              <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: 17 }}>Edit {activeProfileName}</h2>
                <small className="subtle" style={{ fontWeight: 650 }}>
                  Keep this profile aligned with the right closet.
                </small>
              </span>
            </div>
            <span className="pill" style={{ minHeight: 28 }}>
              {getGenderLabel(genderPresentation)}
            </span>
          </div>

          <label style={{ display: "grid", gap: 6, fontWeight: 760, fontSize: 13 }}>
            Name
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" style={inputStyle()} />
          </label>

          <section style={{ display: "grid", gap: 7 }}>
            <span style={{ fontWeight: 760, fontSize: 13 }}>Style profile</span>
            <GenderSegment value={genderPresentation} onChange={setGenderPresentation} />
          </section>

          {error ? (
            <p className="subtle" role="alert" style={{ color: "var(--wine)", margin: 0 }}>
              {error}
            </p>
          ) : null}

          <button type="submit" className="full-button" disabled={isSaving} style={{ minHeight: 46, background: charcoal }}>
            <Check size={16} aria-hidden="true" />
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </form>

        <button
          type="button"
          className="card"
          onClick={() => setIsAddProfileOpen((isOpen) => !isOpen)}
          aria-expanded={isAddProfileOpen}
          aria-controls="add-circle-profile"
          style={{
            minHeight: 58,
            borderStyle: "dashed",
            background: "var(--paper)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            textAlign: "left",
            padding: 12,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: charcoalSoft,
                color: charcoal,
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              <Plus size={18} />
            </span>
            <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <strong style={{ fontSize: 15 }}>Add another profile</strong>
              <small className="subtle" style={{ fontWeight: 650 }}>
                Partner, family member, or second closet
              </small>
            </span>
          </span>
          <span className="pill" style={{ minHeight: 28 }}>
            Circle
          </span>
        </button>

        {isAddProfileOpen ? (
          <form
            id="add-circle-profile"
            className="card"
            onSubmit={handleCreateProfile}
            style={{ display: "grid", gap: 12, padding: 12, boxShadow: "0 -10px 22px rgba(35, 28, 20, 0.06)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 17 }}>New profile</h2>
              <button
                type="button"
                className="pill"
                onClick={() => setIsAddProfileOpen(false)}
                style={{ border: 0, minHeight: 28 }}
              >
                Close
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "end" }}>
              <label style={{ display: "grid", gap: 6, fontWeight: 760, fontSize: 13 }}>
                Name
                <input
                  value={newProfileName}
                  onChange={(event) => setNewProfileName(event.target.value)}
                  autoComplete="off"
                  placeholder={getNewProfilePlaceholder(newProfileGenderPresentation)}
                  style={inputStyle()}
                />
              </label>
              <button
                type="submit"
                className="button"
                disabled={isCreatingProfile}
                style={{ minWidth: 76, minHeight: 44, background: charcoal }}
              >
                {isCreatingProfile ? "Adding..." : "Add"}
              </button>
            </div>

            <section style={{ display: "grid", gap: 7 }}>
              <span style={{ fontWeight: 760, fontSize: 13 }}>Style profile</span>
              <GenderSegment value={newProfileGenderPresentation} onChange={setNewProfileGenderPresentation} />
            </section>
          </form>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSignOut()}
          style={{
            minHeight: 42,
            border: 0,
            background: "transparent",
            color: "var(--muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            justifySelf: "start",
            padding: "0 4px",
            fontWeight: 720,
            fontSize: 13,
          }}
        >
          <LogOut size={15} aria-hidden="true" />
          Sign out
        </button>
      </div>

      <BottomNav />
    </AppShell>
  );
}
