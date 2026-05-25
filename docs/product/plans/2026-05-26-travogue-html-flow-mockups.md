# Travogue HTML Flow Mockups Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Keep each task small, verify after each task, and commit working checkpoints.

**Goal:** Build a self-contained HTML mockup pack that shows Travogue's main user stories from onboarding through wardrobe upload, Auto-Prettify, Closet Mixer, trip planning, packing, avatar rendering, and wear memory.

**Architecture:** Create one static HTML file with embedded CSS and JavaScript-free mock screens. The file uses repeated mobile phone frames and flow sections so the product can be reviewed visually without running an app server.

**Tech Stack:** HTML, CSS, static local file.

---

## File Structure

- Create: `docs/product/mockups/travogue-product-flows.html`
  - Self-contained visual prototype with all screens, flows, and user stories.
  - Uses embedded CSS for a clean modern mobile-web aesthetic inspired by the category, without copying any brand-specific layout.
- Modify: none.

## Tasks

### Task 1: Create Static Mockup Skeleton

**Files:**
- Create: `docs/product/mockups/travogue-product-flows.html`

- [ ] **Step 1: Add document shell**

Create a valid HTML5 document with:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Travogue Product Flows</title>
</head>
<body>
  <main></main>
</body>
</html>
```

- [ ] **Step 2: Add global CSS**

Add embedded styles for:

- off-white page background
- dark text
- compact mobile-first typography
- phone frames
- cards
- rounded buttons
- item tiles
- bottom navigation
- responsive desktop grid

- [ ] **Step 3: Add overview section**

Include a top-level product summary and a flow index listing these stories:

- First run and profile setup
- Avatar setup
- Upload and Auto-Prettify
- Detected item review
- Closet
- Closet Mixer
- Trip setup
- Trip Looks
- Packing List
- Avatar render
- Wear memory
- Demo mode

### Task 2: Add Onboarding And Avatar Screens

**Files:**
- Modify: `docs/product/mockups/travogue-product-flows.html`

- [ ] **Step 1: Add onboarding screen**

Show a first-run phone screen with:

- product name
- value proposition
- two profile chips
- primary action

- [ ] **Step 2: Add avatar setup screens**

Show:

- create avatar intro
- face photo guidance
- body photo guidance
- review face/body images

Use neutral boxes and generated-looking placeholders created with CSS gradients and labels.

### Task 3: Add Wardrobe Upload And Auto-Prettify Screens

**Files:**
- Modify: `docs/product/mockups/travogue-product-flows.html`

- [ ] **Step 1: Add upload batch screen**

Show upload options for:

- outfit photo
- item photo
- batch upload

- [ ] **Step 2: Add Auto-Prettify education screen**

Show before/after item normalization with a rough shirt becoming a clean studio asset.

- [ ] **Step 3: Add Detected Items Review screen**

Show review cards with:

- prettified garment thumbnail
- proposed name
- brand field
- category
- owner profile
- retry/add/delete actions
- Add All button

### Task 4: Add Closet And Mixer Screens

**Files:**
- Modify: `docs/product/mockups/travogue-product-flows.html`

- [ ] **Step 1: Add closet grid**

Show category filters and clean standardized garment tiles.

- [ ] **Step 2: Add Closet Mixer screen**

Show:

- real-body center panel
- top carousel
- bottom carousel
- shoe/accessory tray
- lock controls
- save outfit action

### Task 5: Add Trip Planning Screens

**Files:**
- Modify: `docs/product/mockups/travogue-product-flows.html`

- [ ] **Step 1: Add trip setup screen**

Show fields for destination, dates, travelers, activities, luggage mode, style mode, and conversational note.

- [ ] **Step 2: Add trip looks screen**

Show day-by-day outfit cards with weather/activity rationale and swap controls.

- [ ] **Step 3: Add packing list screen**

Show clothing and essentials generated from approved looks.

### Task 6: Add Avatar Render, Wear Memory, And Demo Mode

**Files:**
- Modify: `docs/product/mockups/travogue-product-flows.html`

- [ ] **Step 1: Add avatar render screen**

Show a selected outfit rendered on a high-quality avatar preview, with regenerate and save controls.

- [ ] **Step 2: Add wear memory screen**

Show worn/skipped/changed logging and an outfit diary upload.

- [ ] **Step 3: Add demo mode screen**

Show the same flows running with fixture data and no AI spend.

### Task 7: Review And Commit

**Files:**
- Verify: `docs/product/mockups/travogue-product-flows.html`

- [ ] **Step 1: Check file exists**

Run: `test -f docs/product/mockups/travogue-product-flows.html`

Expected: command exits successfully.

- [ ] **Step 2: Check key flows exist**

Run: `rg -n "Auto-Prettify|Closet Mixer|Trip Looks|Packing List|Avatar Render|Demo Mode" docs/product/mockups/travogue-product-flows.html`

Expected: each label appears at least once.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/product/plans/2026-05-26-travogue-html-flow-mockups.md docs/product/mockups/travogue-product-flows.html
git commit -m "Add Travogue product flow mockups"
```
