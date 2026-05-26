# Processing Magic Screen Implementation Plan

**Goal:** Replace the static processing checklist with a lively hybrid magic/activity screen and auto-advance to Review when processing finishes.

**Approach:** Keep the real job-state model intact. Render the existing steps as animated floating milestones, add decorative activity snippets and CSS motion, then redirect to Review shortly after `ready`.

## Tasks

- [x] Add a focused test for processing step metadata needed by the animated UI.
- [x] Update `app/processing/[jobId]/page.tsx` with:
  - automatic navigation to `/review/{batchId}?jobId={jobId}` after `ready`
  - a central animated magic stage
  - text-only floating activity labels
  - clean timeline milestones based on `getPrettifyJobSteps`
  - a calmer failed state with Retry
- [x] Add CSS in `app/globals.css` for the processing stage, orbiting clothes, scanning beam, text-only activity labels, and reduced-motion fallback.
- [x] Simplify the real upload prepare-mode area:
  - replace stacked option cards with a compact segmented picker
  - rename `New tops` to `Topwear`
  - use neutral copy for upper/lower pieces
  - replace the duplicate-skip checkbox with a modern button toggle
- [x] Simplify review source-photo context:
  - remove numbered overlays from the uploaded photo
  - make the source photo a shorter context preview by default
  - show detected pieces as compact crop-thumbnail chips
- [x] Run `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
