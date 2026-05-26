import type { DemoTrip, TripLook } from "@/src/domain/wardrobe";

export interface TripState {
  activeTrip: DemoTrip | null;
  tripLooks: TripLook[];
}

export type TripAction =
  | { type: "tripStarted"; trip: DemoTrip; looks: TripLook[] }
  | { type: "tripLookApproved"; lookId: string }
  | { type: "tripLookSwapped"; lookId: string; look: TripLook };

export const initialTripState: TripState = {
  activeTrip: null,
  tripLooks: [],
};

export function tripReducer(state: TripState, action: TripAction): TripState {
  switch (action.type) {
    case "tripStarted":
      return { activeTrip: action.trip, tripLooks: action.looks };

    case "tripLookApproved":
      return {
        ...state,
        tripLooks: state.tripLooks.map((look) =>
          look.id === action.lookId ? { ...look, status: "approved" } : look,
        ),
      };

    case "tripLookSwapped":
      return {
        ...state,
        tripLooks: state.tripLooks.map((look) =>
          look.id === action.lookId ? { ...action.look, status: "suggested" } : look,
        ),
      };
  }
}
