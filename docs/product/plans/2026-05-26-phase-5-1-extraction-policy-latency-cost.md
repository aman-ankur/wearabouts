# Wearabouts Phase 5.1 Extraction Policy, Latency, And Cost Fix

## Problem

Phase 5 proved that real outfit decomposition can work and can produce high-quality closet assets. The live run also exposed the wrong default behavior:

> Wearabouts treated "detect everything" as "generate everything."

That made the run slow and expensive. One outfit generated four assets:

- White graphic T-shirt
- Sage green cargo pants
- White running sneakers
- Dark smartwatch

The outputs were good, but the smartwatch cost and delayed the flow almost like a core garment. For MVP closet building, not every visible thing deserves immediate image generation.

## Root Cause

The pipeline currently has no extraction policy between detection and image generation.

Current behavior:

1. Detect visible candidates.
2. Treat every high/medium visible candidate as generation-eligible.
3. Generate candidates sequentially.
4. Keep the parent job open until all candidates finish.

This causes two issues:

- Cost grows linearly with every visible item, including low-value accessories.
- Latency is dictated by the slowest candidate, even when useful review cards already exist.

## Product Principle

Detection should be generous. Generation should be selective.

Wearabouts should detect everything useful for context, but only spend image generation on the pieces most likely to improve the closet and outfit planning experience.

## Default Generation Policy

Default generation should create the core outfit only:

- Always generate a clear top or outerwear.
- Always generate clear bottoms.
- Usually generate shoes, but only if prominent.
- Do not generate accessories by default.
- Do not generate low-confidence or occluded items by default.

Detected-but-not-generated items should be stored as candidates and can be generated later only when the user explicitly chooses them.

## Recommended UX

Use a simple upload setting called `What should Wearabouts prepare?`

Default option:

- `Core outfit`
- Copy: `Top, bottoms, and prominent shoes`

Secondary option:

- `One piece`
- Copy: `Pick a garment after detection`

Advanced/secondary later:

- `Everything visible`
- Copy: `Higher cost and slower`

This keeps the default elegant and cheap while allowing explicit control when the user wants a watch, bag, or single specific garment.

## Single-Piece Extraction

For "one piece", the best UX is to ask after detection, not before upload.

Why:

- Before upload, users may not know what the model can see cleanly.
- After detection, Wearabouts can show concrete choices such as:
  - Outer shirt
  - Inner T-shirt
  - Pants
  - Shoes
- The app can prevent bad choices by marking tiny/occluded items as not recommended.

Flow:

1. User uploads photo.
2. Wearabouts runs metadata detection only.
3. User sees detected candidates.
4. User picks one candidate to generate.
5. Wearabouts generates only that item.

This costs one metadata call plus one image generation call, and it is clearer than asking the user to guess upfront.

## Implementation Fix

Add a deterministic extraction policy after metadata detection and before image generation.

### Candidate Scoring

Score each candidate by:

- Category value:
  - outerwear: high
  - tops: high
  - bottoms: high
  - footwear: medium
  - accessories: low
- Confidence:
  - high > medium > low
- Visibility:
  - visible > needs_review > occluded
- Prominence:
  - larger bounding box area is better

### Default Policy

Select:

- Best visible top or outerwear.
- Best visible bottom.
- Best visible shoes only if prominent.

Prominent shoes rule:

- Footwear confidence is high or medium.
- Visibility is visible.
- Bounding-box area is above a minimum threshold.

Skip:

- Accessories by default.
- Low confidence candidates.
- Occluded candidates.
- Duplicate candidates in the same category unless user asks for more.

### Parent Job Behavior

The parent outfit job should become ready when selected default candidates finish.

Non-selected candidates remain stored as:

- `detected`
- `not_selected`
- `manual_only`

They should not block Review.

### Latency Strategy

Near-term:

- Generate selected default candidates only.
- Run selected candidates with concurrency 2.
- Skip validation for high-confidence core garments or validate only when output is medium confidence / needs review.

Later:

- Background candidate generation.
- Per-candidate progress.
- User-triggered `Generate this too`.
- Cache by source image hash and candidate crop metadata.

## Expected Impact

For a typical outfit photo:

Current:

- Metadata: 1 call
- Image generation: 4 calls
- Validation: 4 calls
- Time: 3+ minutes
- Cost: close to $1 in the live test

After Phase 5.1:

- Metadata: 1 call
- Image generation: 2-3 calls
- Validation: 0-2 calls depending on confidence
- Time: expected 45-90 seconds for core outfit
- Cost: materially lower, likely about half or less for common outfits

## Open Decisions

- Whether `Core outfit` should include prominent shoes by default or make shoes a toggle.
- Whether validation can be skipped for high-confidence generated items.
- Whether `One piece` should be exposed on the first upload screen or only as a post-detection option.

Recommendation:

- First screen: `Core outfit` default, `One piece` optional.
- If `One piece` is chosen, ask which piece after detection.
- Keep accessories manual-only for now.
