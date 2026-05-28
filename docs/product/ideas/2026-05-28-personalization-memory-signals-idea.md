# Personalization And Memory Signals Idea

## Status

Parked for later product exploration. This is not the immediate next implementation phase.

## Product Thought

Now that Wearabouts can generate closet-backed outfit options through Mixer and Stylist, user actions can become lightweight personalization signals.

The app should eventually remember what the user saved, passed, refined, wore, skipped, repeated, and showed interest in, then use those signals to nudge future recommendations without making the recommendation engine opaque or AI-dependent.

## First Useful Signal Set

- `Save`: positive signal for the outfit, items, occasion, and weather context.
- `Pass` / `Not this`: negative signal for the exact combination in a similar context.
- `Refine`: preference signal for locked items, swapped items, and chosen alternatives.
- `Include ideas`: signal that the user is open to missing-piece suggestions for the current context.
- Missing-piece interest: signal that a not-in-closet item type may be worth recommending again.

## Technical Direction

Start deterministic and explainable:

- Store typed feedback events.
- Keep feedback profile-scoped.
- Use feedback as small score modifiers in the existing outfit engine.
- Prefer exact-combination and context-sensitive learning before broad item-level assumptions.
- Keep weather/activity correctness ahead of preference nudges.

## Out Of Scope For The First Slice

- Required AI personalization.
- Full outfit diary.
- Calendar/email inference.
- Shopping links.
- Global style-profile rewriting from one action.
- Server persistence unless it naturally fits the current saved-outfit path.

## Why Park It

Avatar preview is the more immediate product learning now. Personalization becomes more useful after the product has saved looks, avatar renders, and clearer user feedback around which visual outcomes feel worth keeping.
