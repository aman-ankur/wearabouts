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
      {genderOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "pill dark" : "pill"}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          style={{
            width: "100%",
            justifyContent: "center",
            border: "1px solid var(--line)",
            minHeight: 38,
            padding: "6px 8px",
            fontSize: 12,
          }}
        >
          {option.label}
        </button>
      ))}
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
          <h1 className="app-title" style={{ fontSize: 30 }}>Profile</h1>
          <p className="subtle" style={{ margin: "6px 0 0" }}>{account?.circle?.name ?? "My Circle"}</p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            const element = document.getElementById("add-circle-profile");
            element?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          style={{ width: 42, minWidth: 42, minHeight: 42, padding: 0, borderRadius: 999 }}
          aria-label="Add Circle profile"
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="stack">
        <section className="card" style={{ display: "grid", gap: 10, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>Circle profiles</h2>
            <span className="pill" style={{ minHeight: 28 }}>
              {(account?.profiles.length ? account.profiles : account?.profile ? [account.profile] : []).length} total
            </span>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {(account?.profiles.length ? account.profiles : account?.profile ? [account.profile] : []).map((profile) => {
              const isActive = activeProfileId === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleSelectProfile(profile.id)}
                  aria-pressed={isActive}
                  style={{
                    width: "100%",
                    minHeight: 58,
                    border: `1px solid ${isActive ? "var(--ink)" : "var(--line)"}`,
                    borderRadius: 8,
                    background: isActive ? "var(--ink)" : "var(--paper)",
                    color: isActive ? "var(--white)" : "var(--ink)",
                    padding: 8,
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
                        background: isActive ? "var(--white)" : "var(--ink)",
                        color: isActive ? "var(--ink)" : "var(--white)",
                        fontWeight: 850,
                        flex: "0 0 auto",
                      }}
                    >
                      {getProfileInitial(profile.displayName)}
                    </span>
                    <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                      <strong style={{ fontSize: 15, lineHeight: 1.1 }}>{profile.displayName}</strong>
                      <small style={{ color: isActive ? "rgba(255,255,255,.7)" : "var(--muted)", fontWeight: 650 }}>
                        {isActive ? "Active" : "Circle profile"}
                      </small>
                    </span>
                  </span>
                  <span
                    style={{
                      minHeight: 28,
                      borderRadius: 999,
                      padding: "6px 10px",
                      background: isActive ? "rgba(255,255,255,.13)" : "var(--soft)",
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

        <form className="card" onSubmit={handleSave} style={{ display: "grid", gap: 13, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: "var(--soft)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <UserRound size={17} />
            </span>
            <h2 style={{ margin: 0, fontSize: 17 }}>Edit profile</h2>
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

          <button type="submit" className="full-button" disabled={isSaving} style={{ minHeight: 46 }}>
            <Check size={16} aria-hidden="true" />
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </form>

        <form id="add-circle-profile" className="card" onSubmit={handleCreateProfile} style={{ display: "grid", gap: 13, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>Add profile</h2>
            <span className="pill" style={{ minHeight: 28 }}>
              Circle
            </span>
          </div>

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

          <section style={{ display: "grid", gap: 7 }}>
            <span style={{ fontWeight: 760, fontSize: 13 }}>Style profile</span>
            <GenderSegment value={newProfileGenderPresentation} onChange={setNewProfileGenderPresentation} />
          </section>

          <button type="submit" className="full-button" disabled={isCreatingProfile} style={{ minHeight: 46 }}>
            {isCreatingProfile ? (
              "Adding..."
            ) : (
              <>
                <Plus size={16} aria-hidden="true" />
                Add profile
              </>
            )}
          </button>
        </form>
      </div>

      <button type="button" className="button secondary" onClick={() => void handleSignOut()} style={{ minHeight: 48 }}>
        <LogOut size={17} aria-hidden="true" />
        Sign out
      </button>

      <BottomNav />
    </AppShell>
  );
}
