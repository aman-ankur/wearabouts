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
