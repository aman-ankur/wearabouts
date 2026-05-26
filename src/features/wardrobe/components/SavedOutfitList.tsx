import type { SavedOutfit } from "@/src/domain/wardrobe";

interface SavedOutfitListProps {
  outfits: SavedOutfit[];
}

const profileLabels: Record<SavedOutfit["profileId"], string> = {
  "profile-aankur": "Aankur",
  "profile-wife": "Wife",
  "profile-shared": "Shared",
};

export function SavedOutfitList({ outfits }: SavedOutfitListProps) {
  if (outfits.length === 0) {
    return (
      <section className="card">
        <strong>Saved looks</strong>
        <p className="subtle" style={{ marginBottom: 0 }}>
          No saved looks yet.
        </p>
      </section>
    );
  }

  return (
    <section className="card" style={{ display: "grid", gap: 12 }}>
      <strong>Saved looks</strong>
      {outfits.map((outfit) => {
        const selectedItemCount = outfit.selections.filter((selection) => selection.wardrobeItemId).length;

        return (
          <article
            key={outfit.id}
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: 10,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <strong style={{ fontSize: 13 }}>{outfit.name}</strong>
              <p className="subtle" style={{ margin: "3px 0 0" }}>
                {profileLabels[outfit.profileId]}
              </p>
            </div>
            <span className="pill">{selectedItemCount} items</span>
          </article>
        );
      })}
    </section>
  );
}
