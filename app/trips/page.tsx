"use client";

import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { PackingList } from "@/src/features/wardrobe/components/PackingList";
import { TripLookCard } from "@/src/features/wardrobe/components/TripLookCard";
import { getPackingListItems } from "@/src/features/wardrobe/selectors/tripSelectors";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function TripsPage() {
  const { state, tripState, startDemoTrip, approveTripLook, swapTripLook } = useWardrobe();
  const readyItems = useMemo(() => state.closetItems.filter((item) => item.readyForMixer), [state.closetItems]);
  const packingItems = useMemo(() => getPackingListItems(tripState.tripLooks), [tripState.tripLooks]);
  const approvedCount = tripState.tripLooks.filter((look) => look.status === "approved").length;

  if (readyItems.length === 0) {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Trips</h1>
            <p className="subtle">Carry-on outfit planning</p>
          </div>
        </div>

        <section className="card" style={{ display: "grid", gap: 12 }}>
          <strong>Closet items needed</strong>
          <p className="subtle" style={{ margin: 0 }}>
            Add the demo wardrobe first, then build trip looks from those closet items.
          </p>
          <Link className="button" href="/upload">
            Add demo items
          </Link>
        </section>
        <BottomNav />
      </AppShell>
    );
  }

  if (!tripState.activeTrip) {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Trips</h1>
            <p className="subtle">{readyItems.length} mixer-ready items</p>
          </div>
        </div>

        <section
          style={{
            minHeight: 430,
            display: "grid",
            alignContent: "center",
            gap: 14,
            padding: "24px 4px",
          }}
        >
          <div className="pill" style={{ justifySelf: "start" }}>
            <CalendarDays size={14} aria-hidden="true" />
            Goa · Fri-Sun
          </div>
          <h2 style={{ fontSize: 28, lineHeight: 1.04, margin: 0 }}>Plan three looks from your closet.</h2>
          <p className="subtle" style={{ margin: 0, maxWidth: 320 }}>
            Demo mode creates a small carry-on plan using saved Closet Mixer looks first, then closet items.
          </p>
          <button type="button" className="button" onClick={startDemoTrip}>
            <Sparkles size={17} aria-hidden="true" />
            Build trip looks
          </button>
        </section>

        <BottomNav />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">{tripState.activeTrip.destination}</h1>
          <p className="subtle">
            {tripState.activeTrip.dateRangeLabel} · {approvedCount}/{tripState.tripLooks.length} approved
          </p>
        </div>
        <span className="pill">Carry-on</span>
      </div>

      <div className="stack">
        <section
          style={{
            borderRadius: 8,
            background: "var(--ink)",
            color: "var(--white)",
            padding: 14,
            display: "grid",
            gap: 4,
          }}
        >
          <strong style={{ fontSize: 14 }}>{tripState.activeTrip.note}</strong>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.72)" }}>Balanced style · Demo planner</span>
        </section>

        {tripState.tripLooks.map((look) => {
          const day = tripState.activeTrip?.days.find((item) => item.id === look.tripDayId);

          return day ? (
            <TripLookCard
              key={look.id}
              day={day}
              look={look}
              closetItems={state.closetItems}
              onApprove={approveTripLook}
              onSwap={swapTripLook}
            />
          ) : null;
        })}

        <PackingList items={packingItems} closetItems={state.closetItems} />
      </div>

      <BottomNav />
    </AppShell>
  );
}
