# China Trip Planner Idea

## Status

Parked for later product exploration. This is not the immediate next implementation phase.

## User Scenario

The user is planning a two-week China trip in October and wants Wearabouts to create high-fashion, practical outfits for each day or activity. The trip likely includes humid city days, shopping and food walks, forest hikes around Avatar-mountain-style landscapes, a colder high-altitude stop such as Jiuzhaigou for two nights, and other mixed urban travel days.

## Product Promise

Wearabouts should act like a travel stylist that understands the trip context without forcing the user through a long planning form. It should infer the important activity, landscape, and climate needs from a rough note, ask only the few missing questions that materially change recommendations, and produce outfits that balance fashion, comfort, weather, terrain, and packing efficiency.

## Input Shape

The user could provide a rough brief such as:

```text
Two weeks in China in October. A few humid city days in Chongqing, shopping and food walks, forest hikes around Zhangjiajie/Avatar mountains, two colder nights near Jiuzhaigou, and some dinners. I want stylish outfits, not generic tourist clothes. I am open to buying a few missing pieces.
```

Wearabouts should turn that into trip contexts:

- Humid city walking and shopping.
- Rain-risk city evenings.
- Forest hike and scenic mountain days.
- Cold high-altitude park days.
- Transit days.
- Smart dinner or night-out looks.
- Photo-heavy landmark days.

## Output Shape

For each day or activity context, Wearabouts should suggest:

- A complete outfit from the user's wardrobe when possible.
- Weather and activity rationale.
- Style rationale.
- Repeat and laundry awareness.
- Packing impact.
- Swap controls with slot locks.
- Optional "missing piece" suggestions when the current wardrobe cannot produce the strongest look.

## Missing Piece Suggestions

Future versions can recommend items outside the user's wardrobe, but this should be treated as a deliberate second layer, not random shopping. Examples:

- A packable technical shell that unlocks humid-rain and mountain days.
- A waterproof city sneaker that works for both shopping streets and scenic trails.
- A lightweight merino or heat-tech base layer for cold altitude days.
- A sharp overshirt or cropped jacket that makes simple city outfits feel more current.

## Avatar Extension

After outfits are approved, the user can request avatar renders for selected looks. Avatar rendering should remain explicit, cached, and limited to chosen outfits rather than generated for every recommendation.

## Suggested Future Phase

Build this after the smaller daily/event stylist proves the core recommendation loop:

1. User asks what to wear now, tomorrow, or for an event.
2. Wearabouts recommends and refines looks from the wardrobe.
3. Wearabouts can identify a small number of useful missing pieces.
4. The same recommendation model expands into multi-day trip planning.
