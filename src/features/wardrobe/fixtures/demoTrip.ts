import type { DemoTrip } from "@/src/domain/wardrobe";

export const demoTrip: DemoTrip = {
  id: "trip-goa-demo",
  destination: "Goa",
  dateRangeLabel: "Fri-Sun, 3 days",
  profileId: "profile-aankur",
  styleMode: "balanced",
  baggageMode: "carry_on",
  note: "Beach time, one dinner, and a light carry-on.",
  days: [
    { id: "trip-day-1", label: "Day 1", dateLabel: "Fri", activity: "Arrival walk" },
    { id: "trip-day-2", label: "Day 2", dateLabel: "Sat", activity: "Beach and cafe" },
    { id: "trip-day-3", label: "Day 3", dateLabel: "Sun", activity: "Dinner and return" },
  ],
};
