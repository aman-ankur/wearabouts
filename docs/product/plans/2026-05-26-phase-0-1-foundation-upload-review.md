# Travogue Phase 0-1 Implementation Plan

> **For agentic coding workers:** Implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Keep each task small, run the listed verification command before moving on, and commit working checkpoints.

**Goal:** Build the first working app slice: Next.js foundation plus demo-mode upload, Auto-Prettify explanation, detected item review, and closet save flow.

**Architecture:** Use Next.js App Router with React and TypeScript. Keep Phase 0-1 entirely demo-mode and client-side, but define provider interfaces and domain types that real AI and Supabase providers can adopt in future phases. Use fixture data and a reducer-backed wardrobe context so the user can move through the ingestion flow without network calls or AI spend.

**Tech Stack:** Next.js, React, TypeScript, CSS modules/global CSS, Vitest for pure domain/provider tests, lucide-react for icons.

---

## Source Context

Read these files before starting:

- `docs/product/PROJECT_CONTEXT.md`
- `docs/product/specs/2026-05-26-travogue-mvp-design.md`
- `docs/product/mockups/travogue-product-flows.html`

## Phase Scope

### Phase 0: Foundation

Build:

- Next.js React TypeScript app.
- Mobile-first layout shell.
- Basic visual system inspired by the HTML mockups.
- Runtime mode flag: `demo` or `real`.
- Domain types.
- Provider contracts.
- Demo fixture data.
- Pure reducer for wardrobe ingestion state.

Verify:

- App runs locally.
- TypeScript compiles.
- Unit tests pass.
- Demo mode is visible in development.
- No real AI or Supabase calls exist.

### Phase 1: Demo Upload And Review Flow

Build:

- Home screen.
- Upload screen.
- Auto-Prettify explainer screen/section.
- Demo upload provider.
- Detected Items Review screen.
- Add, Retry, Delete, Add All interactions.
- Closet screen showing approved demo items.
- Local in-memory persistence through React context.

Verify:

- User can navigate from home to upload to review to closet.
- Review cards show detected garment data.
- Add moves an item to the closet.
- Delete removes a detected item from review.
- Retry swaps to an alternate prettified asset/name from fixture data.
- Add All approves all remaining detected items.
- No real AI calls exist.

## File Structure

Create these files:

```text
package.json
next.config.ts
tsconfig.json
vitest.config.ts
eslint.config.mjs
app/globals.css
app/layout.tsx
app/page.tsx
app/upload/page.tsx
app/review/[batchId]/page.tsx
app/closet/page.tsx
src/domain/wardrobe.ts
src/domain/runtime.ts
src/features/runtime/runtimeMode.ts
src/features/wardrobe/fixtures/demoWardrobe.ts
src/features/wardrobe/providers/contracts.ts
src/features/wardrobe/providers/demoWardrobeProvider.ts
src/features/wardrobe/state/wardrobeReducer.ts
src/features/wardrobe/state/WardrobeContext.tsx
src/features/wardrobe/components/AppShell.tsx
src/features/wardrobe/components/BottomNav.tsx
src/features/wardrobe/components/GarmentArtwork.tsx
src/features/wardrobe/components/PrettifyExplainer.tsx
src/features/wardrobe/components/UploadChoiceCard.tsx
src/features/wardrobe/components/DetectedGarmentCard.tsx
src/features/wardrobe/components/ClosetGrid.tsx
src/features/wardrobe/state/wardrobeReducer.test.ts
src/features/wardrobe/providers/demoWardrobeProvider.test.ts
```

Do not create Supabase files in Phase 0-1. Real storage begins in a later phase.

## Domain Types

Use this model in `src/domain/wardrobe.ts`:

```ts
export type RuntimeMode = "demo" | "real";

export type WardrobeProfileId = "profile-aankur" | "profile-wife" | "profile-shared";

export type GarmentCategory =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "footwear"
  | "accessories"
  | "combo";

export type UploadSourceType = "outfit_photo" | "item_photo" | "batch_upload";

export type ConfidenceLevel = "high" | "medium" | "low";

export type PrettifyStatus = "not_started" | "processing" | "ready" | "needs_review" | "failed";

export interface WardrobeProfile {
  id: WardrobeProfileId;
  displayName: string;
  shortLabel: string;
}

export interface ClosetAsset {
  id: string;
  kind: "original" | "detected_crop" | "prettified" | "thumbnail";
  label: string;
  visualToken: "jacket-brown" | "sweater-cream" | "crew-wine" | "shirt-striped" | "trouser-charcoal" | "shoe-brown";
}

export interface DetectedGarment {
  id: string;
  uploadBatchId: string;
  proposedName: string;
  brand: string;
  category: GarmentCategory;
  ownerProfileId: WardrobeProfileId;
  sourceType: UploadSourceType;
  confidence: ConfidenceLevel;
  prettifyStatus: PrettifyStatus;
  isLayered: boolean;
  readyForMixer: boolean;
  asset: ClosetAsset;
  retryVariantId?: string;
}

export interface WardrobeItem {
  id: string;
  sourceDetectedGarmentId: string;
  name: string;
  brand: string;
  category: GarmentCategory;
  ownerProfileId: WardrobeProfileId;
  asset: ClosetAsset;
  addedAtIso: string;
  readyForMixer: boolean;
}

export interface UploadBatch {
  id: string;
  sourceType: UploadSourceType;
  title: string;
  createdAtIso: string;
  detectedGarments: DetectedGarment[];
}
```

Use `src/domain/runtime.ts` only to re-export runtime-related types:

```ts
export type { RuntimeMode } from "./wardrobe";
```

## Provider Contract

Use this contract in `src/features/wardrobe/providers/contracts.ts`:

```ts
import type { UploadBatch, UploadSourceType } from "@/src/domain/wardrobe";

export interface CreateDemoUploadInput {
  sourceType: UploadSourceType;
}

export interface WardrobeIngestionProvider {
  createUploadBatch(input: CreateDemoUploadInput): Promise<UploadBatch>;
  retryDetectedGarment(batchId: string, detectedGarmentId: string): Promise<UploadBatch>;
}
```

## Tasks

### Task 1: Scaffold The Next.js App

**Files:**

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `eslint.config.mjs`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "travogue",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint app src --max-warnings=0"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@eslint/eslintrc": "^3.2.0",
    "eslint": "^9.16.0",
    "eslint-config-next": "^15.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected:

- `node_modules/` exists.
- `package-lock.json` exists.
- No dependency resolution error.

- [ ] **Step 3: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
```

- [ ] **Step 6: Create `eslint.config.mjs`**

```js
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [...compat.extends("next/core-web-vitals", "next/typescript")];
```

- [ ] **Step 7: Create minimal app files**

Create `app/globals.css`:

```css
:root {
  --bg: #f6f3ee;
  --paper: #fffefa;
  --ink: #111111;
  --muted: #706b64;
  --line: #e6ded4;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input {
  font: inherit;
}
```

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travogue",
  description: "Travel-first wardrobe planner",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Travogue</h1>
      <p>Pack looks, not doubts.</p>
    </main>
  );
}
```

- [ ] **Step 8: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript exits successfully.

- [ ] **Step 9: Commit**

Run:

```bash
git add package.json package-lock.json next.config.ts tsconfig.json vitest.config.ts eslint.config.mjs app
git commit -m "Scaffold Travogue Next app"
```

### Task 2: Add Domain Types And Runtime Mode

**Files:**

- Create: `src/domain/wardrobe.ts`
- Create: `src/domain/runtime.ts`
- Create: `src/features/runtime/runtimeMode.ts`

- [ ] **Step 1: Create `src/domain/wardrobe.ts`**

Use the exact TypeScript from the "Domain Types" section of this plan.

- [ ] **Step 2: Create `src/domain/runtime.ts`**

```ts
export type { RuntimeMode } from "./wardrobe";
```

- [ ] **Step 3: Create `src/features/runtime/runtimeMode.ts`**

```ts
import type { RuntimeMode } from "@/src/domain/runtime";

export function getRuntimeMode(): RuntimeMode {
  const value = process.env.NEXT_PUBLIC_TRAVOGUE_MODE;

  if (value === "real") {
    return "real";
  }

  return "demo";
}

export function getRuntimeModeLabel(mode: RuntimeMode): string {
  return mode === "demo" ? "Demo Mode" : "Real Mode";
}
```

- [ ] **Step 4: Add runtime smoke test by editing `app/page.tsx`**

```tsx
import { getRuntimeMode, getRuntimeModeLabel } from "@/src/features/runtime/runtimeMode";

export default function HomePage() {
  const mode = getRuntimeMode();

  return (
    <main>
      <h1>Travogue</h1>
      <p>Pack looks, not doubts.</p>
      <p>{getRuntimeModeLabel(mode)}</p>
    </main>
  );
}
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript exits successfully.

- [ ] **Step 6: Commit**

Run:

```bash
git add app/page.tsx src/domain src/features/runtime
git commit -m "Add Travogue domain types and runtime mode"
```

### Task 3: Add Demo Fixtures And Provider

**Files:**

- Create: `src/features/wardrobe/fixtures/demoWardrobe.ts`
- Create: `src/features/wardrobe/providers/contracts.ts`
- Create: `src/features/wardrobe/providers/demoWardrobeProvider.ts`
- Create: `src/features/wardrobe/providers/demoWardrobeProvider.test.ts`

- [ ] **Step 1: Create provider contract**

Create `src/features/wardrobe/providers/contracts.ts` using the exact TypeScript from the "Provider Contract" section of this plan.

- [ ] **Step 2: Create `src/features/wardrobe/fixtures/demoWardrobe.ts`**

```ts
import type { DetectedGarment, UploadBatch, WardrobeProfile } from "@/src/domain/wardrobe";

export const demoProfiles: WardrobeProfile[] = [
  { id: "profile-aankur", displayName: "Aankur", shortLabel: "A" },
  { id: "profile-wife", displayName: "Wife", shortLabel: "W" },
  { id: "profile-shared", displayName: "Shared", shortLabel: "S" },
];

export const demoDetectedGarments: DetectedGarment[] = [
  {
    id: "detected-brown-jacket",
    uploadBatchId: "batch-demo-upload",
    proposedName: "Brown Hooded Zip Jacket",
    brand: "",
    category: "outerwear",
    ownerProfileId: "profile-aankur",
    sourceType: "outfit_photo",
    confidence: "high",
    prettifyStatus: "ready",
    isLayered: false,
    readyForMixer: true,
    asset: {
      id: "asset-brown-jacket",
      kind: "prettified",
      label: "Brown jacket prettified asset",
      visualToken: "jacket-brown",
    },
    retryVariantId: "detected-brown-jacket-retry",
  },
  {
    id: "detected-cream-sweater",
    uploadBatchId: "batch-demo-upload",
    proposedName: "Lightweight Knit Crewneck Sweater",
    brand: "",
    category: "tops",
    ownerProfileId: "profile-aankur",
    sourceType: "item_photo",
    confidence: "high",
    prettifyStatus: "ready",
    isLayered: false,
    readyForMixer: true,
    asset: {
      id: "asset-cream-sweater",
      kind: "prettified",
      label: "Cream sweater prettified asset",
      visualToken: "sweater-cream",
    },
    retryVariantId: "detected-cream-sweater-retry",
  },
  {
    id: "detected-wine-crew",
    uploadBatchId: "batch-demo-upload",
    proposedName: "Maroon Long Sleeve Crew Neck",
    brand: "",
    category: "tops",
    ownerProfileId: "profile-aankur",
    sourceType: "item_photo",
    confidence: "medium",
    prettifyStatus: "needs_review",
    isLayered: false,
    readyForMixer: true,
    asset: {
      id: "asset-wine-crew",
      kind: "prettified",
      label: "Maroon crew neck prettified asset",
      visualToken: "crew-wine",
    },
    retryVariantId: "detected-wine-crew-retry",
  },
];

export const demoRetryVariants: Record<string, DetectedGarment> = {
  "detected-brown-jacket-retry": {
    ...demoDetectedGarments[0],
    id: "detected-brown-jacket",
    proposedName: "Tan Technical Hooded Jacket",
    confidence: "high",
    prettifyStatus: "ready",
  },
  "detected-cream-sweater-retry": {
    ...demoDetectedGarments[1],
    id: "detected-cream-sweater",
    proposedName: "Cream Ribbed Knit Sweater",
    confidence: "high",
    prettifyStatus: "ready",
  },
  "detected-wine-crew-retry": {
    ...demoDetectedGarments[2],
    id: "detected-wine-crew",
    proposedName: "Burgundy Crew Neck Sweatshirt",
    confidence: "high",
    prettifyStatus: "ready",
  },
};

export const demoUploadBatch: UploadBatch = {
  id: "batch-demo-upload",
  sourceType: "batch_upload",
  title: "Demo Auto-Prettify Batch",
  createdAtIso: "2026-05-26T00:00:00.000Z",
  detectedGarments: demoDetectedGarments,
};
```

- [ ] **Step 3: Create `src/features/wardrobe/providers/demoWardrobeProvider.ts`**

```ts
import type { UploadBatch } from "@/src/domain/wardrobe";
import { demoRetryVariants, demoUploadBatch } from "@/src/features/wardrobe/fixtures/demoWardrobe";
import type { CreateDemoUploadInput, WardrobeIngestionProvider } from "./contracts";

function cloneBatch(batch: UploadBatch): UploadBatch {
  return {
    ...batch,
    detectedGarments: batch.detectedGarments.map((garment) => ({
      ...garment,
      asset: { ...garment.asset },
    })),
  };
}

export function createDemoWardrobeProvider(): WardrobeIngestionProvider {
  let currentBatch = cloneBatch(demoUploadBatch);

  return {
    async createUploadBatch(input: CreateDemoUploadInput): Promise<UploadBatch> {
      currentBatch = {
        ...cloneBatch(demoUploadBatch),
        sourceType: input.sourceType,
      };

      return cloneBatch(currentBatch);
    },

    async retryDetectedGarment(batchId: string, detectedGarmentId: string): Promise<UploadBatch> {
      if (batchId !== currentBatch.id) {
        return cloneBatch(currentBatch);
      }

      currentBatch = {
        ...currentBatch,
        detectedGarments: currentBatch.detectedGarments.map((garment) => {
          if (garment.id !== detectedGarmentId || !garment.retryVariantId) {
            return garment;
          }

          const retryVariant = demoRetryVariants[garment.retryVariantId];
          return retryVariant ? { ...retryVariant, asset: { ...retryVariant.asset } } : garment;
        }),
      };

      return cloneBatch(currentBatch);
    },
  };
}
```

- [ ] **Step 4: Create provider tests**

Create `src/features/wardrobe/providers/demoWardrobeProvider.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createDemoWardrobeProvider } from "./demoWardrobeProvider";

describe("createDemoWardrobeProvider", () => {
  it("creates a demo upload batch with detected garments", async () => {
    const provider = createDemoWardrobeProvider();

    const batch = await provider.createUploadBatch({ sourceType: "batch_upload" });

    expect(batch.id).toBe("batch-demo-upload");
    expect(batch.detectedGarments).toHaveLength(3);
    expect(batch.detectedGarments[0]?.proposedName).toBe("Brown Hooded Zip Jacket");
  });

  it("returns a retry variant for a detected garment", async () => {
    const provider = createDemoWardrobeProvider();
    const batch = await provider.createUploadBatch({ sourceType: "batch_upload" });

    const retried = await provider.retryDetectedGarment(batch.id, "detected-brown-jacket");

    expect(retried.detectedGarments[0]?.proposedName).toBe("Tan Technical Hooded Jacket");
  });
});
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test
```

Expected: both provider tests pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/features/wardrobe/fixtures src/features/wardrobe/providers
git commit -m "Add demo wardrobe ingestion provider"
```

### Task 4: Add Wardrobe Reducer And Context

**Files:**

- Create: `src/features/wardrobe/state/wardrobeReducer.ts`
- Create: `src/features/wardrobe/state/wardrobeReducer.test.ts`
- Create: `src/features/wardrobe/state/WardrobeContext.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create reducer**

Create `src/features/wardrobe/state/wardrobeReducer.ts`:

```ts
import type { DetectedGarment, UploadBatch, WardrobeItem } from "@/src/domain/wardrobe";

export interface WardrobeState {
  activeBatch: UploadBatch | null;
  closetItems: WardrobeItem[];
}

export type WardrobeAction =
  | { type: "batchCreated"; batch: UploadBatch }
  | { type: "batchUpdated"; batch: UploadBatch }
  | { type: "garmentAdded"; garmentId: string; addedAtIso: string }
  | { type: "garmentDeleted"; garmentId: string }
  | { type: "allGarmentsAdded"; addedAtIso: string };

export const initialWardrobeState: WardrobeState = {
  activeBatch: null,
  closetItems: [],
};

function toWardrobeItem(garment: DetectedGarment, addedAtIso: string): WardrobeItem {
  return {
    id: `wardrobe-${garment.id}`,
    sourceDetectedGarmentId: garment.id,
    name: garment.proposedName,
    brand: garment.brand,
    category: garment.category,
    ownerProfileId: garment.ownerProfileId,
    asset: garment.asset,
    addedAtIso,
    readyForMixer: garment.readyForMixer,
  };
}

function removeDetectedGarment(batch: UploadBatch, garmentId: string): UploadBatch {
  return {
    ...batch,
    detectedGarments: batch.detectedGarments.filter((garment) => garment.id !== garmentId),
  };
}

function closetContainsGarment(state: WardrobeState, garmentId: string): boolean {
  return state.closetItems.some((item) => item.sourceDetectedGarmentId === garmentId);
}

export function wardrobeReducer(state: WardrobeState, action: WardrobeAction): WardrobeState {
  switch (action.type) {
    case "batchCreated":
      return { ...state, activeBatch: action.batch };

    case "batchUpdated":
      return { ...state, activeBatch: action.batch };

    case "garmentDeleted":
      return state.activeBatch
        ? { ...state, activeBatch: removeDetectedGarment(state.activeBatch, action.garmentId) }
        : state;

    case "garmentAdded": {
      if (!state.activeBatch || closetContainsGarment(state, action.garmentId)) {
        return state;
      }

      const garment = state.activeBatch.detectedGarments.find((item) => item.id === action.garmentId);
      if (!garment) {
        return state;
      }

      return {
        activeBatch: removeDetectedGarment(state.activeBatch, action.garmentId),
        closetItems: [...state.closetItems, toWardrobeItem(garment, action.addedAtIso)],
      };
    }

    case "allGarmentsAdded": {
      if (!state.activeBatch) {
        return state;
      }

      const newItems = state.activeBatch.detectedGarments
        .filter((garment) => !closetContainsGarment(state, garment.id))
        .map((garment) => toWardrobeItem(garment, action.addedAtIso));

      return {
        activeBatch: { ...state.activeBatch, detectedGarments: [] },
        closetItems: [...state.closetItems, ...newItems],
      };
    }
  }
}
```

- [ ] **Step 2: Create reducer tests**

Create `src/features/wardrobe/state/wardrobeReducer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { demoUploadBatch } from "@/src/features/wardrobe/fixtures/demoWardrobe";
import { initialWardrobeState, wardrobeReducer } from "./wardrobeReducer";

describe("wardrobeReducer", () => {
  it("stores an active upload batch", () => {
    const state = wardrobeReducer(initialWardrobeState, {
      type: "batchCreated",
      batch: demoUploadBatch,
    });

    expect(state.activeBatch?.id).toBe("batch-demo-upload");
    expect(state.activeBatch?.detectedGarments).toHaveLength(3);
  });

  it("adds one detected garment to the closet and removes it from review", () => {
    const withBatch = wardrobeReducer(initialWardrobeState, {
      type: "batchCreated",
      batch: demoUploadBatch,
    });

    const state = wardrobeReducer(withBatch, {
      type: "garmentAdded",
      garmentId: "detected-brown-jacket",
      addedAtIso: "2026-05-26T01:00:00.000Z",
    });

    expect(state.closetItems).toHaveLength(1);
    expect(state.closetItems[0]?.name).toBe("Brown Hooded Zip Jacket");
    expect(state.activeBatch?.detectedGarments.some((garment) => garment.id === "detected-brown-jacket")).toBe(false);
  });

  it("deletes one detected garment from review without adding it to closet", () => {
    const withBatch = wardrobeReducer(initialWardrobeState, {
      type: "batchCreated",
      batch: demoUploadBatch,
    });

    const state = wardrobeReducer(withBatch, {
      type: "garmentDeleted",
      garmentId: "detected-wine-crew",
    });

    expect(state.closetItems).toHaveLength(0);
    expect(state.activeBatch?.detectedGarments).toHaveLength(2);
  });

  it("adds all remaining detected garments to the closet", () => {
    const withBatch = wardrobeReducer(initialWardrobeState, {
      type: "batchCreated",
      batch: demoUploadBatch,
    });

    const state = wardrobeReducer(withBatch, {
      type: "allGarmentsAdded",
      addedAtIso: "2026-05-26T01:00:00.000Z",
    });

    expect(state.closetItems).toHaveLength(3);
    expect(state.activeBatch?.detectedGarments).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Create wardrobe context**

Create `src/features/wardrobe/state/WardrobeContext.tsx`:

```tsx
"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { createDemoWardrobeProvider } from "@/src/features/wardrobe/providers/demoWardrobeProvider";
import type { UploadSourceType } from "@/src/domain/wardrobe";
import { initialWardrobeState, wardrobeReducer, type WardrobeState } from "./wardrobeReducer";

interface WardrobeContextValue {
  state: WardrobeState;
  createDemoBatch: (sourceType: UploadSourceType) => Promise<string>;
  retryGarment: (garmentId: string) => Promise<void>;
  addGarment: (garmentId: string) => void;
  deleteGarment: (garmentId: string) => void;
  addAllGarments: () => void;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wardrobeReducer, initialWardrobeState);
  const provider = useMemo(() => createDemoWardrobeProvider(), []);

  const value: WardrobeContextValue = {
    state,
    async createDemoBatch(sourceType) {
      const batch = await provider.createUploadBatch({ sourceType });
      dispatch({ type: "batchCreated", batch });
      return batch.id;
    },
    async retryGarment(garmentId) {
      if (!state.activeBatch) {
        return;
      }
      const batch = await provider.retryDetectedGarment(state.activeBatch.id, garmentId);
      dispatch({ type: "batchUpdated", batch });
    },
    addGarment(garmentId) {
      dispatch({ type: "garmentAdded", garmentId, addedAtIso: new Date().toISOString() });
    },
    deleteGarment(garmentId) {
      dispatch({ type: "garmentDeleted", garmentId });
    },
    addAllGarments() {
      dispatch({ type: "allGarmentsAdded", addedAtIso: new Date().toISOString() });
    },
  };

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const value = useContext(WardrobeContext);

  if (!value) {
    throw new Error("useWardrobe must be used inside WardrobeProvider");
  }

  return value;
}
```

- [ ] **Step 4: Wrap app in provider**

Modify `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WardrobeProvider } from "@/src/features/wardrobe/state/WardrobeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travogue",
  description: "Travel-first wardrobe planner",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WardrobeProvider>{children}</WardrobeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npm run test
npm run typecheck
```

Expected:

- Provider tests pass.
- Reducer tests pass.
- TypeScript exits successfully.

- [ ] **Step 6: Commit**

Run:

```bash
git add app/layout.tsx src/features/wardrobe/state
git commit -m "Add wardrobe ingestion state"
```

### Task 5: Add Visual Components

**Files:**

- Modify: `app/globals.css`
- Create: `src/features/wardrobe/components/AppShell.tsx`
- Create: `src/features/wardrobe/components/BottomNav.tsx`
- Create: `src/features/wardrobe/components/GarmentArtwork.tsx`
- Create: `src/features/wardrobe/components/PrettifyExplainer.tsx`
- Create: `src/features/wardrobe/components/UploadChoiceCard.tsx`
- Create: `src/features/wardrobe/components/DetectedGarmentCard.tsx`
- Create: `src/features/wardrobe/components/ClosetGrid.tsx`

- [ ] **Step 1: Replace `app/globals.css`**

```css
:root {
  --bg: #f6f3ee;
  --paper: #fffefa;
  --ink: #111111;
  --muted: #716b64;
  --line: #e6ded4;
  --soft: #efe9df;
  --dark: #111111;
  --dark-2: #2b2b2b;
  --white: #ffffff;
  --blue: #315a7d;
  --clay: #a46946;
  --wine: #7d2637;
  --cream: #efe6d3;
  --shadow: 0 18px 45px rgba(20, 20, 20, 0.12);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.page-shell {
  min-height: 100vh;
  display: grid;
  place-items: start center;
  padding: 18px 12px;
}

.phone-frame {
  width: min(100%, 430px);
  min-height: calc(100vh - 36px);
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 28px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.phone-screen {
  min-height: calc(100vh - 38px);
  padding: 18px 16px 78px;
  position: relative;
}

.appbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.app-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.08;
}

.subtle {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}

.button {
  min-height: 46px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  background: var(--ink);
  color: var(--white);
  font-weight: 760;
}

.button.secondary {
  background: var(--white);
  color: var(--ink);
  border: 1px solid var(--line);
}

.button.ghost {
  background: var(--soft);
  color: var(--ink);
}

.full-button {
  width: 100%;
  min-height: 54px;
  border: 0;
  border-radius: 999px;
  background: var(--ink);
  color: var(--white);
  font-weight: 760;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 31px;
  border-radius: 999px;
  background: var(--soft);
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 720;
}

.pill.dark {
  background: var(--ink);
  color: var(--white);
}

.stack {
  display: grid;
  gap: 12px;
}

.card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--white);
  padding: 14px;
}

.bottom-actions {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: grid;
  gap: 8px;
}
```

- [ ] **Step 2: Create `AppShell.tsx`**

```tsx
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="page-shell">
      <section className="phone-frame">
        <div className="phone-screen">{children}</div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Create `BottomNav.tsx`**

```tsx
import Link from "next/link";
import { Home, Plus, Shirt, Sparkles } from "lucide-react";

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 58,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        alignItems: "center",
        borderTop: "1px solid var(--line)",
        background: "rgba(255,255,255,.94)",
      }}
    >
      <Link href="/" style={{ display: "grid", justifyItems: "center", gap: 3, fontSize: 11 }}>
        <Home size={18} />
        Home
      </Link>
      <Link href="/closet" style={{ display: "grid", justifyItems: "center", gap: 3, fontSize: 11 }}>
        <Shirt size={18} />
        Closet
      </Link>
      <Link href="/upload" style={{ display: "grid", justifyItems: "center", gap: 3, fontSize: 11 }}>
        <Plus size={18} />
        Add
      </Link>
      <Link href="/review/batch-demo-upload" style={{ display: "grid", justifyItems: "center", gap: 3, fontSize: 11 }}>
        <Sparkles size={18} />
        Review
      </Link>
    </nav>
  );
}
```

- [ ] **Step 4: Create `GarmentArtwork.tsx`**

```tsx
import type { ClosetAsset } from "@/src/domain/wardrobe";

interface GarmentArtworkProps {
  token: ClosetAsset["visualToken"];
}

const colorByToken: Record<ClosetAsset["visualToken"], string> = {
  "jacket-brown": "var(--clay)",
  "sweater-cream": "var(--cream)",
  "crew-wine": "var(--wine)",
  "shirt-striped": "repeating-linear-gradient(90deg, #d9d5cb 0, #d9d5cb 5px, #6f7777 5px, #6f7777 7px, #f4f1e9 7px, #f4f1e9 12px)",
  "trouser-charcoal": "#252932",
  "shoe-brown": "#3a2118",
};

export function GarmentArtwork({ token }: GarmentArtworkProps) {
  if (token === "trouser-charcoal") {
    return (
      <div aria-label="Trouser artwork" style={{ width: 62, height: 86, position: "relative" }}>
        <span style={{ position: "absolute", left: 6, top: 0, width: 24, height: 86, borderRadius: "2px 2px 8px 8px", background: colorByToken[token] }} />
        <span style={{ position: "absolute", right: 6, top: 0, width: 24, height: 86, borderRadius: "2px 2px 8px 8px", background: colorByToken[token] }} />
      </div>
    );
  }

  if (token === "shoe-brown") {
    return <div aria-label="Shoe artwork" style={{ width: 70, height: 26, borderRadius: "18px 24px 9px 9px", background: colorByToken[token] }} />;
  }

  return (
    <div aria-label="Garment artwork" style={{ width: 104, height: 132, position: "relative", filter: "drop-shadow(0 8px 10px rgba(0,0,0,.12))" }}>
      <span style={{ position: "absolute", left: 27, top: 26, width: 50, height: 82, borderRadius: "9px 9px 6px 6px", background: colorByToken[token] }} />
      <span style={{ position: "absolute", left: 11, top: 35, width: 24, height: 72, borderRadius: 10, transform: "rotate(10deg)", background: colorByToken[token] }} />
      <span style={{ position: "absolute", right: 11, top: 35, width: 24, height: 72, borderRadius: 10, transform: "rotate(-10deg)", background: colorByToken[token] }} />
      <span style={{ position: "absolute", left: 41, top: 22, width: 22, height: 18, borderRadius: "0 0 16px 16px", background: "var(--paper)" }} />
    </div>
  );
}
```

- [ ] **Step 5: Create `PrettifyExplainer.tsx`**

```tsx
import { Sparkles } from "lucide-react";
import { GarmentArtwork } from "./GarmentArtwork";

export function PrettifyExplainer() {
  return (
    <section className="card" style={{ background: "var(--dark)", color: "var(--white)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 38px 1fr", gap: 10, alignItems: "center" }}>
        <div style={{ minHeight: 150, borderRadius: 8, display: "grid", placeItems: "center", background: "#3b3b3b" }}>
          <GarmentArtwork token="shirt-striped" />
        </div>
        <div style={{ textAlign: "center", fontSize: 28 }}>→</div>
        <div style={{ minHeight: 150, borderRadius: 8, display: "grid", placeItems: "center", background: "#f7f7f4" }}>
          <GarmentArtwork token="shirt-striped" />
        </div>
      </div>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
        <Sparkles size={18} />
        Auto-Prettify is on
      </h2>
      <p style={{ margin: 0, color: "#c7c7c7", fontSize: 13, lineHeight: 1.45 }}>
        Travogue turns messy clothing photos into clean, standardized closet assets for review, mixing, and trip planning.
      </p>
    </section>
  );
}
```

- [ ] **Step 6: Create `UploadChoiceCard.tsx`**

```tsx
import type { UploadSourceType } from "@/src/domain/wardrobe";

interface UploadChoiceCardProps {
  title: string;
  description: string;
  sourceType: UploadSourceType;
  onChoose: (sourceType: UploadSourceType) => void;
}

export function UploadChoiceCard({ title, description, sourceType, onChoose }: UploadChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onChoose(sourceType)}
      className="card"
      style={{ width: "100%", textAlign: "left", minHeight: 110, background: "var(--paper)" }}
    >
      <strong>{title}</strong>
      <p className="subtle" style={{ marginBottom: 0 }}>{description}</p>
    </button>
  );
}
```

- [ ] **Step 7: Create `DetectedGarmentCard.tsx`**

```tsx
import { Check, RotateCcw, Trash2 } from "lucide-react";
import type { DetectedGarment } from "@/src/domain/wardrobe";
import { GarmentArtwork } from "./GarmentArtwork";

interface DetectedGarmentCardProps {
  garment: DetectedGarment;
  onAdd: (garmentId: string) => void;
  onDelete: (garmentId: string) => void;
  onRetry: (garmentId: string) => void;
}

export function DetectedGarmentCard({ garment, onAdd, onDelete, onRetry }: DetectedGarmentCardProps) {
  return (
    <article className="card" style={{ display: "grid", gridTemplateColumns: "96px minmax(0,1fr)", gap: 12, background: "#4a4a4a", color: "white" }}>
      <div style={{ minHeight: 112, borderRadius: 8, background: "#626262", display: "grid", placeItems: "center" }}>
        <GarmentArtwork token={garment.asset.visualToken} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{garment.proposedName}</strong>
          <button type="button" onClick={() => onDelete(garment.id)} aria-label={`Delete ${garment.proposedName}`} style={{ border: 0, background: "transparent", color: "white" }}>
            <Trash2 size={17} />
          </button>
        </div>
        <div style={{ height: 34, display: "flex", alignItems: "center", color: "#cfcfcf", borderBottom: "1px solid rgba(255,255,255,.18)", fontSize: 13 }}>
          {garment.brand || "Add brand"}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
          <span className="pill">{garment.category}</span>
          <span className="pill">{garment.confidence} confidence</span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="button ghost" onClick={() => onRetry(garment.id)} style={{ minHeight: 36 }}>
            <RotateCcw size={15} /> Retry
          </button>
          <button type="button" className="button secondary" onClick={() => onAdd(garment.id)} style={{ minHeight: 36 }}>
            <Check size={15} /> Add
          </button>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 8: Create `ClosetGrid.tsx`**

```tsx
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { GarmentArtwork } from "./GarmentArtwork";

export function ClosetGrid({ items }: { items: WardrobeItem[] }) {
  if (items.length === 0) {
    return (
      <section className="card">
        <strong>No closet items yet</strong>
        <p className="subtle" style={{ marginBottom: 0 }}>Add detected garments from the review flow to start your closet.</p>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
      {items.map((item) => (
        <article key={item.id} className="card" style={{ minHeight: 170, display: "grid", gap: 8 }}>
          <div style={{ minHeight: 112, display: "grid", placeItems: "center", background: "#f7f4ef", borderRadius: 8 }}>
            <GarmentArtwork token={item.asset.visualToken} />
          </div>
          <strong style={{ fontSize: 13 }}>{item.name}</strong>
          <span className="subtle">{item.category}</span>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 9: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript exits successfully.

- [ ] **Step 10: Commit**

Run:

```bash
git add app/globals.css src/features/wardrobe/components
git commit -m "Add wardrobe demo UI components"
```

### Task 6: Build Home And Upload Screens

**Files:**

- Modify: `app/page.tsx`
- Create: `app/upload/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import Link from "next/link";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { getRuntimeMode, getRuntimeModeLabel } from "@/src/features/runtime/runtimeMode";

export default function HomePage() {
  const mode = getRuntimeMode();

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Travogue</h1>
          <p className="subtle">{getRuntimeModeLabel(mode)}</p>
        </div>
        <span className="pill dark">MVP</span>
      </div>

      <section className="card" style={{ minHeight: 240, display: "grid", alignContent: "center", gap: 12, background: "#f2ece2" }}>
        <span className="pill">Travel closet</span>
        <h2 style={{ fontSize: 42, lineHeight: 0.95, margin: 0 }}>Pack looks, not doubts.</h2>
        <p className="subtle" style={{ margin: 0 }}>Upload real clothes, prettify them into closet assets, and build trip-ready outfits.</p>
      </section>

      <div className="stack" style={{ marginTop: 14 }}>
        <Link className="full-button" href="/upload" style={{ display: "grid", placeItems: "center" }}>
          Add clothes
        </Link>
        <Link className="button secondary" href="/closet" style={{ display: "grid", placeItems: "center" }}>
          View closet
        </Link>
      </div>

      <BottomNav />
    </AppShell>
  );
}
```

- [ ] **Step 2: Create `app/upload/page.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import type { UploadSourceType } from "@/src/domain/wardrobe";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { PrettifyExplainer } from "@/src/features/wardrobe/components/PrettifyExplainer";
import { UploadChoiceCard } from "@/src/features/wardrobe/components/UploadChoiceCard";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function UploadPage() {
  const router = useRouter();
  const { createDemoBatch } = useWardrobe();

  async function handleChoose(sourceType: UploadSourceType) {
    const batchId = await createDemoBatch(sourceType);
    router.push(`/review/${batchId}`);
  }

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Add To Closet</h1>
          <p className="subtle">Choose a demo upload type. Auto-Prettify runs before review.</p>
        </div>
      </div>

      <div className="stack">
        <UploadChoiceCard
          title="Outfit photo"
          description="Detect visible garments from a photo of you wearing them."
          sourceType="outfit_photo"
          onChoose={handleChoose}
        />
        <UploadChoiceCard
          title="Item photo"
          description="Best for a single garment on a hanger, bed, or wall."
          sourceType="item_photo"
          onChoose={handleChoose}
        />
        <UploadChoiceCard
          title="Batch upload"
          description="Review several detected wardrobe items together."
          sourceType="batch_upload"
          onChoose={handleChoose}
        />
        <PrettifyExplainer />
      </div>

      <BottomNav />
    </AppShell>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript exits successfully.

- [ ] **Step 4: Commit**

Run:

```bash
git add app/page.tsx app/upload/page.tsx
git commit -m "Build home and demo upload screens"
```

### Task 7: Build Review And Closet Screens

**Files:**

- Create: `app/review/[batchId]/page.tsx`
- Create: `app/closet/page.tsx`

- [ ] **Step 1: Create review page**

Create `app/review/[batchId]/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { DetectedGarmentCard } from "@/src/features/wardrobe/components/DetectedGarmentCard";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function ReviewPage() {
  const router = useRouter();
  const { state, addGarment, deleteGarment, retryGarment, addAllGarments } = useWardrobe();
  const garments = state.activeBatch?.detectedGarments ?? [];

  function handleAddAll() {
    addAllGarments();
    router.push("/closet");
  }

  return (
    <AppShell>
      <div className="appbar">
        <Link className="button secondary" href="/upload">Close</Link>
        <button type="button" className="button secondary" onClick={handleAddAll} disabled={garments.length === 0}>
          Add All
        </button>
      </div>

      <div className="stack">
        {garments.length === 0 ? (
          <section className="card">
            <h1 className="app-title">Nothing left to review</h1>
            <p className="subtle">Approved items are now in your closet.</p>
            <Link className="full-button" href="/closet" style={{ display: "grid", placeItems: "center", marginTop: 16 }}>
              Go to closet
            </Link>
          </section>
        ) : (
          garments.map((garment) => (
            <DetectedGarmentCard
              key={garment.id}
              garment={garment}
              onAdd={addGarment}
              onDelete={deleteGarment}
              onRetry={(garmentId) => {
                void retryGarment(garmentId);
              }}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Create closet page**

Create `app/closet/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { ClosetGrid } from "@/src/features/wardrobe/components/ClosetGrid";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

export default function ClosetPage() {
  const { state } = useWardrobe();

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Closet</h1>
          <p className="subtle">{state.closetItems.length} approved items</p>
        </div>
        <Link className="button secondary" href="/upload">Add</Link>
      </div>

      <div style={{ display: "flex", gap: 8, overflow: "hidden", marginBottom: 14 }}>
        <span className="pill dark">All</span>
        <span className="pill">Tops</span>
        <span className="pill">Bottoms</span>
        <span className="pill">Shoes</span>
      </div>

      <ClosetGrid items={state.closetItems} />
      <BottomNav />
    </AppShell>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript exits successfully.

- [ ] **Step 4: Commit**

Run:

```bash
git add app/review app/closet
git commit -m "Build review and closet demo flow"
```

### Task 8: Verify Phase 0-1 End To End

**Files:**

- Verify all app files.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm run test
npm run typecheck
npm run build
```

Expected:

- All tests pass.
- TypeScript exits successfully.
- Next production build completes.

- [ ] **Step 2: Run the dev server**

Run:

```bash
npm run dev
```

Expected:

- Dev server starts.
- Local URL is printed, usually `http://localhost:3000`.

- [ ] **Step 3: Manual browser verification**

Open the local URL and verify this exact flow:

1. Home page shows `Travogue`, `Pack looks, not doubts`, and `Demo Mode`.
2. Tap `Add clothes`.
3. Upload page shows three upload choices and Auto-Prettify explainer.
4. Tap `Batch upload`.
5. Review page shows three detected garment cards.
6. Tap `Retry` on the brown jacket.
7. Brown jacket name changes to `Tan Technical Hooded Jacket`.
8. Tap `Add` on one item.
9. That item disappears from review.
10. Tap `Add All`.
11. Closet page shows approved items.
12. Bottom navigation links work.

- [ ] **Step 4: Confirm no real AI or Supabase calls**

Run:

```bash
rg -n "openai|anthropic|gemini|supabase|fetch\\(|axios|apiKey|SECRET" app src
rg -n "process\\.env" app src
```

Expected:

- The first command returns no matches.
- The second command only returns the `NEXT_PUBLIC_TRAVOGUE_MODE` read in `src/features/runtime/runtimeMode.ts`.

- [ ] **Step 5: Commit verification cleanup if files changed**

If no files changed, do not commit.

If formatting or generated config files changed, run:

```bash
git status --short
git add <changed-files>
git commit -m "Verify phase 0-1 demo flow"
```

## Phase 0-1 Acceptance Criteria

- `npm run test` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- Home, upload, review, and closet routes exist.
- Demo mode label is visible.
- Upload choices create a demo batch.
- Review page shows detected garments.
- Add, Retry, Delete, and Add All work.
- Closet shows approved items.
- No real AI, Supabase, or network provider integration exists.

## Next Plan After This

After Phase 0-1 is complete, write a separate plan for Phase 2 only:

- Closet Mixer demo.
- Body photo setup prompt.
- Swipable tops/bottoms/shoes.
- Lock item behavior.
- Save outfit behavior.

Do not start real Auto-Prettify provider work until the demo Closet Mixer feels useful.
