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

## Updated UX Direction

The implemented MVP direction is scan-first:

- Upload asks what Wearabouts should prepare, with smart extraction behavior.
- The default real outfit flow runs metadata detection only.
- Review shows detected candidates so the user can choose the pieces they actually want.
- Review shows the uploaded source photo above the candidate checklist, with numbered bounding boxes and matching crop thumbnails in each row.
- `Skip items already in Closet` is on by default.
- Likely existing pieces are still selectable so the user can force generation when the duplicate hint is wrong.
- Shoes and accessories are optional by default and do not get generated unless selected.

This is better for repeated-outfit photos: if the same jeans appear in ten photos with ten different shirts, the user can pick only the new shirt instead of paying for duplicate pants every time.

## Earlier UX Option

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

## Live Benchmark Notes

After applying the Phase 5.1 schema migration and testing real upload:

- Scan-only picker readiness was about 15-17 seconds with the original metadata image profile.
- Selected image generations run with concurrency 2, so two generated pieces completed in about 54 seconds total rather than sequentially.
- A forced high-confidence visible core item now skips the extra validation call even when it had a duplicate hint.

Detection image benchmark over three real photos:

- Original detection profile: `1600px PNG`, average scan time about 17.16 seconds, average total tokens about 2,975, average normalized image size about 3.85 MB.
- Faster detection profile: `1024px JPEG`, average scan time about 7.63 seconds, average total tokens about 1,605, average normalized image size about 127 KB.
- Candidate counts matched across all three benchmark photos.

Implemented default:

- `OPENAI_DETECTION_IMAGE_MAX_DIMENSION=1024`
- `OPENAI_DETECTION_IMAGE_FORMAT=jpeg`
- `OPENAI_DETECTION_IMAGE_QUALITY=82`

This optimization applies only to metadata detection. Final generated closet assets still use the selected crop and image-generation path.

## Open Decisions

- Whether `Core outfit` should include prominent shoes by default or make shoes a toggle.
- Whether `768px JPEG` is accurate enough for detection after a larger photo benchmark.
- Whether a smaller/faster metadata model is good enough. In a 3-photo sample, `gpt-4.1-mini` was slightly faster on the fast image profile but missed one smartwatch candidate.
- Whether detection schema can drop long `reason` / `cropPrompt` fields and generate crop guidance only after selection.

Recommendation:

- First screen/default path: scan first, then let the user pick from detected pieces.
- Keep duplicate skipping on by default but allow forced generation.
- Keep accessories manual-only for now.
