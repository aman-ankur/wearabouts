"use client";

import { UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchAccountStatus,
  getActiveWardrobeProfileId,
  setActiveWardrobeProfileId,
  subscribeToActiveWardrobeProfileChange,
} from "@/src/features/account/accountApiClient";
import type { WardrobeProfileSummary } from "@/src/features/account/accountTypes";
import { getSupabaseBrowserClient } from "@/src/features/account/supabaseBrowserClient";
import { getRuntimeMode } from "@/src/features/runtime/runtimeMode";

export function ActiveProfileSwitcher() {
  const pathname = usePathname();
  const [profiles, setProfiles] = useState<WardrobeProfileSummary[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (getRuntimeMode() !== "real" && getRuntimeMode() !== "dev") {
      return;
    }

    let cancelled = false;
    async function loadProfiles() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const account = await fetchAccountStatus(token);
      if (cancelled || !account.profile) return;

      const availableProfiles = account.profiles.length ? account.profiles : [account.profile];
      const storedProfileId = getActiveWardrobeProfileId();
      const nextProfileId = availableProfiles.some((profile) => profile.id === storedProfileId)
        ? storedProfileId
        : account.profile.id;

      setProfiles(availableProfiles);
      setActiveProfileId(nextProfileId);
      if (nextProfileId !== storedProfileId) {
        setActiveWardrobeProfileId(nextProfileId);
      }
    }

    void loadProfiles().catch(() => undefined);
    const unsubscribe = subscribeToActiveWardrobeProfileChange(() => {
      void loadProfiles().catch(() => undefined);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (pathname === "/settings" || profiles.length < 2 || !activeProfileId) {
    return null;
  }

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];

  return (
    <section
      aria-label="Active Circle profile"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px 0",
      }}
    >
      <span className="pill" style={{ minHeight: 34, padding: "7px 10px", flex: "1 1 auto", justifyContent: "flex-start" }}>
        <UsersRound size={14} aria-hidden="true" />
        {profiles.length > 1 ? "Profile" : "Circle profile"}
      </span>
      {profiles.length > 1 ? (
        <select
          aria-label="Choose active wardrobe profile"
          value={activeProfile.id}
          onChange={(event) => {
            setActiveProfileId(event.target.value);
            setActiveWardrobeProfileId(event.target.value);
          }}
          style={{
            minWidth: 132,
            minHeight: 34,
            borderRadius: 999,
            border: "1px solid var(--line)",
            background: "var(--paper)",
            color: "var(--ink)",
            padding: "0 10px",
            fontWeight: 760,
          }}
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.displayName}
            </option>
          ))}
        </select>
      ) : (
        <span className="pill dark" style={{ minHeight: 34, padding: "7px 10px", flex: "0 0 auto" }}>
          {activeProfile.displayName}
        </span>
      )}
    </section>
  );
}
