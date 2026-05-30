"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { fetchAccountStatus } from "@/src/features/account/accountApiClient";
import { getSupabaseBrowserClient } from "@/src/features/account/supabaseBrowserClient";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || isSubmitting) {
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Enter your email to get a code.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: true },
    });

    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    setEmail(cleanEmail);
    setPhase("code");
    setMessage("Check your email for the 6-digit code.");
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || isSubmitting) {
      return;
    }

    const cleanCode = code.trim();
    if (!cleanCode) {
      setError("Enter the code from your email.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: cleanCode,
      type: "email",
    });

    if (verifyError || !data.session?.access_token) {
      setIsSubmitting(false);
      setError(verifyError?.message ?? "Could not verify that code.");
      return;
    }

    try {
      const account = await fetchAccountStatus(data.session.access_token);
      router.push(account.onboardingComplete ? "/demo" : "/onboarding");
    } catch (accountError) {
      setError(accountError instanceof Error ? accountError.message : "Could not load your account.");
      setIsSubmitting(false);
    }
  }

  if (!supabase) {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Sign in</h1>
            <p className="subtle">Email code login is not configured yet.</p>
          </div>
        </div>
        <section className="card">
          <p className="subtle" style={{ margin: 0 }}>
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable OTP login.
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Build your closet</h1>
          <p className="subtle">Sign in with an email code. No password needed.</p>
        </div>
      </div>

      {phase === "email" ? (
        <form className="card" onSubmit={handleSendCode} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 7, fontWeight: 760 }}>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              style={{
                minHeight: 48,
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "0 12px",
                background: "var(--paper)",
              }}
            />
          </label>
          {error ? <p className="subtle" role="alert" style={{ color: "var(--wine)", margin: 0 }}>{error}</p> : null}
          <button type="submit" className="full-button" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send code"}
          </button>
        </form>
      ) : (
        <form className="card" onSubmit={handleVerifyCode} style={{ display: "grid", gap: 14 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800 }}>Enter code</p>
            <p className="subtle" style={{ margin: "4px 0 0" }}>
              We sent it to {email}.
            </p>
          </div>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            style={{
              minHeight: 54,
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "0 14px",
              background: "var(--paper)",
              fontSize: 24,
              fontWeight: 820,
              letterSpacing: 0,
            }}
          />
          {message ? <p className="subtle" role="status" style={{ margin: 0 }}>{message}</p> : null}
          {error ? <p className="subtle" role="alert" style={{ color: "var(--wine)", margin: 0 }}>{error}</p> : null}
          <button type="submit" className="full-button" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify code"}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={isSubmitting}
            onClick={() => {
              setCode("");
              setPhase("email");
              setError(null);
              setMessage(null);
            }}
          >
            Use another email
          </button>
        </form>
      )}

      <div style={{ marginTop: 14 }}>
        <Link className="button ghost" href="/demo" style={{ width: "100%" }}>
          Explore demo instead
        </Link>
      </div>
    </AppShell>
  );
}
