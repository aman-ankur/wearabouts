import { describe, expect, it } from "vitest";
import type { DemoTrip, TripLook } from "@/src/domain/wardrobe";
import { initialTripState, tripReducer } from "./tripReducer";

const trip: DemoTrip = {
  id: "trip-goa-demo",
  destination: "Goa",
  dateRangeLabel: "3 days",
  profileId: "profile-aankur",
  styleMode: "balanced",
  baggageMode: "carry_on",
  note: "Beach time, one dinner, do not overpack.",
  days: [
    { id: "trip-day-1", label: "Day 1", dateLabel: "Fri", activity: "Arrival and walk" },
    { id: "trip-day-2", label: "Day 2", dateLabel: "Sat", activity: "Beach and cafe" },
  ],
};

const looks: TripLook[] = [
  {
    id: "look-1",
    tripDayId: "trip-day-1",
    title: "Arrival walk",
    note: "Easy layers.",
    status: "suggested",
    selections: [{ slot: "top", wardrobeItemId: "wardrobe-top-1", locked: false }],
  },
  {
    id: "look-2",
    tripDayId: "trip-day-2",
    title: "Beach day",
    note: "Light pieces.",
    status: "suggested",
    selections: [{ slot: "top", wardrobeItemId: "wardrobe-top-2", locked: false }],
  },
];

describe("tripReducer", () => {
  it("starts a demo trip with generated looks", () => {
    const state = tripReducer(initialTripState, { type: "tripStarted", trip, looks });

    expect(state.activeTrip?.id).toBe("trip-goa-demo");
    expect(state.tripLooks).toEqual(looks);
  });

  it("approves one suggested look", () => {
    const started = tripReducer(initialTripState, { type: "tripStarted", trip, looks });
    const state = tripReducer(started, { type: "tripLookApproved", lookId: "look-2" });

    expect(state.tripLooks[0]?.status).toBe("suggested");
    expect(state.tripLooks[1]?.status).toBe("approved");
  });

  it("swaps one look and leaves it suggested for review", () => {
    const started = tripReducer(initialTripState, { type: "tripStarted", trip, looks });
    const replacement: TripLook = {
      ...looks[0],
      title: "Cafe walk",
      status: "approved",
      selections: [{ slot: "top", wardrobeItemId: "wardrobe-top-3", locked: false }],
    };

    const state = tripReducer(started, { type: "tripLookSwapped", lookId: "look-1", look: replacement });

    expect(state.tripLooks[0]).toEqual({ ...replacement, status: "suggested" });
    expect(state.tripLooks[1]).toEqual(looks[1]);
  });
});
