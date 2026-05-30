"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { completeOnboarding, fetchAccountStatus } from "@/src/features/account/accountApiClient";
import type { GenderPresentation } from "@/src/features/account/accountTypes";
import { getSupabaseBrowserClient } from "@/src/features/account/supabaseBrowserClient";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";

const genderOptions: Array<{ value: GenderPresentation; label: string }> = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex / flexible" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [genderPresentation, setGenderPresentation] = useState<GenderPresentation>("men");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
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
        const account = await fetchAccountStatus(token);
        if (cancelled) {
          return;
        }

        if (account.onboardingComplete) {
          router.replace("/demo");
          return;
        }

        setAccessToken(token);
        setIsLoading(false);
      } catch (accountError) {
        if (!cancelled) {
          setError(accountError instanceof Error ? accountError.message : "Could not load your account.");
          setAccessToken(token);
          setIsLoading(false);
        }
      }
    }

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await completeOnboarding(accessToken, { displayName, genderPresentation });
      setIsComplete(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not finish setup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!supabase) {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Profile setup</h1>
            <p className="subtle">Email code login is not configured yet.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <p className="subtle" role="status" style={{ margin: 0 }}>
          Loading your setup...
        </p>
      </AppShell>
    );
  }

  if (isComplete) {
    return (
      <AppShell>
        <div style={{ minHeight: "100%", display: "grid", alignContent: "center", gap: 14 }}>
          <div>
            <h1 className="app-title" style={{ fontSize: 30 }}>Your profile is ready</h1>
            <p className="subtle">Start with your own clothes, or explore the starter closet first.</p>
          </div>
          <Link className="full-button" href="/upload" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            Add first item
          </Link>
          <Link className="button secondary" href="/demo" style={{ minHeight: 54 }}>
            Explore starter closet
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Your profile</h1>
          <p className="subtle">Just enough to personalize the starter experience.</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 7, fontWeight: 760 }}>
          Name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
            placeholder="Aankur"
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

        {error ? <p className="subtle" role="alert" style={{ color: "var(--wine)", margin: 0 }}>{error}</p> : null}

        <button type="submit" className="full-button" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Continue"}
        </button>
      </form>
    </AppShell>
  );
}
