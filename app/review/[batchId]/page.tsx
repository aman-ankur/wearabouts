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
        <Link className="button secondary" href="/upload">
          Close
        </Link>
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
