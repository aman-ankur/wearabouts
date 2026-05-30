"use client";

import { LogOut, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { completeOnboarding, fetchAccountStatus } from "@/src/features/account/accountApiClient";
import type { AccountStatus, GenderPresentation } from "@/src/features/account/accountTypes";
import { getSupabaseBrowserClient } from "@/src/features/account/supabaseBrowserClient";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";

const genderOptions: Array<{ value: GenderPresentation; label: string }> = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex / flexible" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [genderPresentation, setGenderPresentation] = useState<GenderPresentation>("men");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
    if (!accessToken || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const nextAccount = await completeOnboarding(accessToken, { displayName, genderPresentation });
      setAccount(nextAccount);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save profile.");
    } finally {
      setIsSaving(false);
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
      <div className="appbar">
        <div>
          <h1 className="app-title">Profile</h1>
          <p className="subtle">{account?.circle?.name ?? "My Circle"}</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSave} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 7, fontWeight: 760 }}>
          Name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
            style={{
              minHeight: 48,
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "0 12px",
              background: "var(--paper)",
            }}
          />
        </label>

        <section style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 760 }}>Style profile</span>
          <div style={{ display: "grid", gap: 7 }}>
            {genderOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={genderPresentation === option.value ? "pill dark" : "pill"}
                onClick={() => setGenderPresentation(option.value)}
                aria-pressed={genderPresentation === option.value}
                style={{ width: "100%", justifyContent: "center", border: 0, minHeight: 42 }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <p className="subtle" role="alert" style={{ color: "var(--wine)", margin: 0 }}>
            {error}
          </p>
        ) : null}

        <button type="submit" className="full-button" disabled={isSaving}>
          <Save size={17} aria-hidden="true" />
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>

      <button type="button" className="button secondary" onClick={() => void handleSignOut()} style={{ minHeight: 48 }}>
        <LogOut size={17} aria-hidden="true" />
        Sign out
      </button>

      <BottomNav />
    </AppShell>
  );
}
