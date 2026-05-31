"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Lock,
  RefreshCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { ClosetAssetArtwork } from "@/src/features/wardrobe/components/ClosetAssetArtwork";
import { ManualMixerRow } from "@/src/features/wardrobe/components/ManualMixerRow";
import { MixerBodyStage } from "@/src/features/wardrobe/components/MixerBodyStage";
import { MixerSuggestionHeader } from "@/src/features/wardrobe/components/MixerSuggestionHeader";
import { MixerSuggestionDetails } from "@/src/features/wardrobe/components/MixerSuggestionDetails";
import {
  defaultMixerIntent,
  getStoredOutfitIntent,
  mixerIntentStorageKey,
  outfitIntentOptions,
} from "@/src/features/wardrobe/outfits/outfitIntentDisplay";
import { getRefinementAlternatives, refineOutfitSelection } from "@/src/features/wardrobe/outfits/outfitRefinement";
import { getOutfitRecommendations } from "@/src/features/wardrobe/outfits/outfitRecommendationService";
import { isOnePieceWardrobeItem } from "@/src/features/wardrobe/outfits/outfitSlots";
import type { OutfitIntent, OutfitSuggestion } from "@/src/features/wardrobe/outfits/outfitTypes";
import { getSelectedItem, mixerSlots } from "@/src/features/wardrobe/selectors/mixerSelectors";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

const slotLabels: Record<OutfitSlot, string> = {
  onePiece: "One-piece",
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  layer: "Layer",
  accessory: "Accessory",
};

const promptLabels = ["More casual", "Dinner-ready", "Better for travel", "Less black", "Keep these pants"];

type MixerMode = "smart" | "canvas";
type ManualSlot = "onePiece" | "top" | "bottom" | "shoes";

const manualSlots: Array<{ slot: ManualSlot; label: string; emptyLabel: string }> = [
  { slot: "onePiece", label: "One-piece", emptyLabel: "No dresses, jumpsuits, or one-piece swimwear yet" },
  { slot: "top", label: "Tops + layers", emptyLabel: "No tops or layers yet" },
  { slot: "bottom", label: "Bottoms", emptyLabel: "No bottoms yet" },
  { slot: "shoes", label: "Shoes", emptyLabel: "No shoes yet" },
];

function getSelectedItems(items: WardrobeItem[], suggestion: OutfitSuggestion): Partial<Record<OutfitSlot, WardrobeItem>> {
  return suggestion.selections.reduce<Partial<Record<OutfitSlot, WardrobeItem>>>((selected, selection) => {
    const item = getSelectedItem(items, selection);
    if (item) {
      selected[selection.slot] = item;
    }

    return selected;
  }, {});
}

function selectedIds(suggestion: OutfitSuggestion): Set<string> {
  return new Set(
    suggestion.selections
      .map((selection) => selection.wardrobeItemId)
      .filter((wardrobeItemId): wardrobeItemId is string => Boolean(wardrobeItemId)),
  );
}

function similarityScore(anchor: OutfitSuggestion, suggestion: OutfitSuggestion): number {
  const anchorIds = selectedIds(anchor);
  const suggestionIds = selectedIds(suggestion);
  return Array.from(suggestionIds).reduce((score, itemId) => score + (anchorIds.has(itemId) ? 1 : 0), 0);
}

function getManualSlotForItem(item: WardrobeItem): OutfitSlot | null {
  if (isOnePieceWardrobeItem(item)) {
    return "onePiece";
  }

  if (item.category === "tops" || item.category === "outerwear") {
    return "top";
  }

  if (item.category === "bottoms") {
    return "bottom";
  }

  if (item.category === "footwear") {
    return "shoes";
  }

  return null;
}

function getManualItemsBySlot(items: WardrobeItem[]): Record<ManualSlot, WardrobeItem[]> {
  return items.reduce<Record<ManualSlot, WardrobeItem[]>>(
    (grouped, item) => {
      const slot = getManualSlotForItem(item);
      if (slot === "onePiece" || slot === "top" || slot === "bottom" || slot === "shoes") {
        grouped[slot].push(item);
      }

      return grouped;
    },
    { onePiece: [], top: [], bottom: [], shoes: [] },
  );
}

function getInitialManualSelections(itemsBySlot: Record<ManualSlot, WardrobeItem[]>) {
  const onePiece = itemsBySlot.onePiece[0]?.id ?? null;
  return {
    onePiece,
    top: onePiece ? null : itemsBySlot.top[0]?.id ?? null,
    bottom: onePiece ? null : itemsBySlot.bottom[0]?.id ?? null,
    shoes: itemsBySlot.shoes[0]?.id ?? null,
  };
}

function getManualSelectedItems(
  items: WardrobeItem[],
  selections: Record<ManualSlot, string | null>,
): Partial<Record<OutfitSlot, WardrobeItem>> {
  return manualSlots.reduce<Partial<Record<OutfitSlot, WardrobeItem>>>((selected, { slot }) => {
    const item = items.find((closetItem) => closetItem.id === selections[slot]);
    if (item) {
      selected[slot] = item;
    }

    return selected;
  }, {});
}

export default function MixerPage() {
  const router = useRouter();
  const { state, mixerState, saveCurrentOutfit } = useWardrobe();
  const [mixerMode, setMixerMode] = useState<MixerMode>("smart");
  const [selectedIntent, setSelectedIntent] = useState<OutfitIntent>(defaultMixerIntent);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>([]);
  const [similarityAnchorId, setSimilarityAnchorId] = useState<string | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [refiningSuggestion, setRefiningSuggestion] = useState<OutfitSuggestion | null>(null);
  const [activeSlot, setActiveSlot] = useState<OutfitSlot>("top");
  const [manualSelections, setManualSelections] = useState<Record<ManualSlot, string | null>>({
    onePiece: null,
    top: null,
    bottom: null,
    shoes: null,
  });
  const [manualSavedOutfitId, setManualSavedOutfitId] = useState<string | null>(null);
  const readyItems = useMemo(() => state.closetItems.filter((item) => item.readyForMixer), [state.closetItems]);
  const activeProfileId = useMemo(
    () => readyItems[0]?.ownerProfileId ?? state.closetItems[0]?.ownerProfileId ?? "profile-aankur",
    [readyItems, state.closetItems],
  );
  const manualItemsBySlot = useMemo(() => getManualItemsBySlot(readyItems), [readyItems]);
  const manualSelectedItems = useMemo(
    () => getManualSelectedItems(readyItems, manualSelections),
    [manualSelections, readyItems],
  );
  const suggestions = useMemo(
    () => {
      const recommended = getOutfitRecommendations({
        profileId: activeProfileId,
        intent: selectedIntent,
        closetItems: state.closetItems,
        savedOutfits: mixerState.savedOutfits,
        feedbackSignals: [],
        maxSuggestions: 5,
      }).filter((suggestion) => !dismissedSuggestionIds.includes(suggestion.id));
      const anchor = similarityAnchorId
        ? recommended.find((suggestion) => suggestion.id === similarityAnchorId)
        : null;

      if (!anchor) {
        return recommended;
      }

      return [...recommended].sort((first, second) => {
        if (first.id === anchor.id) return -1;
        if (second.id === anchor.id) return 1;
        return similarityScore(anchor, second) - similarityScore(anchor, first) || second.score - first.score;
      });
    },
    [activeProfileId, dismissedSuggestionIds, mixerState.savedOutfits, selectedIntent, similarityAnchorId, state.closetItems],
  );
  const currentSuggestion = suggestions[Math.min(activeSuggestionIndex, Math.max(suggestions.length - 1, 0))] ?? null;
  const activeSuggestion = refiningSuggestion ?? currentSuggestion;
  const selectedItems = activeSuggestion ? getSelectedItems(state.closetItems, activeSuggestion) : {};
  const hasReviewedAllSuggestions = dismissedSuggestionIds.length > 0 && suggestions.length === 0;
  const alternatives = refiningSuggestion
    ? getRefinementAlternatives({ suggestion: refiningSuggestion, activeSlot, closetItems: state.closetItems })
    : [];

  useEffect(() => {
    setActiveSuggestionIndex((index) => Math.min(index, Math.max(suggestions.length - 1, 0)));
  }, [suggestions.length]);

  useEffect(() => {
    setSelectedIntent(getStoredOutfitIntent(window.localStorage.getItem(mixerIntentStorageKey)));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(mixerIntentStorageKey, selectedIntent);
  }, [selectedIntent]);

  useEffect(() => {
    setManualSelections((current) => {
      const initial = getInitialManualSelections(manualItemsBySlot);
      const onePiece =
        current.onePiece && manualItemsBySlot.onePiece.some((item) => item.id === current.onePiece)
          ? current.onePiece
          : initial.onePiece;
      return {
        onePiece,
        top:
          !onePiece && current.top && manualItemsBySlot.top.some((item) => item.id === current.top)
            ? current.top
            : initial.top,
        bottom:
          !onePiece && current.bottom && manualItemsBySlot.bottom.some((item) => item.id === current.bottom)
            ? current.bottom
            : initial.bottom,
        shoes:
          current.shoes && manualItemsBySlot.shoes.some((item) => item.id === current.shoes) ? current.shoes : initial.shoes,
      };
    });
  }, [manualItemsBySlot]);

  function saveSuggestion(suggestion: OutfitSuggestion, source: "suggestion" | "refined") {
    saveCurrentOutfit(suggestion.title, suggestion.profileId, suggestion.selections, {
      source,
      intent: suggestion.intent,
      rationale: suggestion.rationale,
    });
    setSaveMessage(`Saved ${suggestion.title}`);
  }

  function toggleRefineLock(slot: OutfitSlot) {
    setRefiningSuggestion((suggestion) =>
      suggestion
        ? {
            ...suggestion,
            selections: suggestion.selections.map((selection) =>
              selection.slot === slot ? { ...selection, locked: !selection.locked } : selection,
            ),
          }
        : suggestion,
    );
  }

  function showPreviousSuggestion() {
    setActiveSuggestionIndex((index) => Math.max(index - 1, 0));
  }

  function showNextSuggestion() {
    setActiveSuggestionIndex((index) => Math.min(index + 1, suggestions.length - 1));
  }

  function dismissSuggestion(suggestion: OutfitSuggestion) {
    setDismissedSuggestionIds((ids) => [...ids, suggestion.id]);
    setSaveMessage("Removed this look");
    setActiveSuggestionIndex((index) => Math.min(index, Math.max(suggestions.length - 2, 0)));
  }

  function showMoreLikeSuggestion(suggestion: OutfitSuggestion) {
    setSimilarityAnchorId(suggestion.id);
    setActiveSuggestionIndex(Math.min(1, suggestions.length - 1));
    setSaveMessage("Showing closest matches");
  }

  function chooseMixerIntent(intent: OutfitIntent) {
    setSelectedIntent(intent);
    setDismissedSuggestionIds([]);
    setSimilarityAnchorId(null);
    setActiveSuggestionIndex(0);
    setRefiningSuggestion(null);
    setSaveMessage(null);
  }

  function shuffleSmartMixer() {
    setSimilarityAnchorId(null);
    if (suggestions.length < 2) {
      setSaveMessage("Add more pieces for more mixes");
      return;
    }

    setActiveSuggestionIndex((index) => (index + 1) % suggestions.length);
    setSaveMessage("Shuffled");
  }

  function saveManualLook() {
    const selections = manualSlots
      .map(({ slot }) => ({
        slot,
        wardrobeItemId: manualSelections[slot],
        locked: false,
      }))
      .filter((selection) => Boolean(selection.wardrobeItemId));

    if (selections.length === 0) {
      setSaveMessage("Pick at least one item");
      return null;
    }

    const nameParts = selections
      .map((selection) => readyItems.find((item) => item.id === selection.wardrobeItemId)?.name)
      .filter(Boolean);
    const outfitId = saveCurrentOutfit(nameParts.slice(0, 2).join(" + ") || "Canvas mix", activeProfileId, selections, {
      source: "manual",
      intent: "canvas_mix",
      rationale: "Built manually on the transparent mixer canvas.",
    });
    setManualSavedOutfitId(outfitId);
    setSaveMessage("Saved canvas mix");
    return outfitId;
  }

  function createAvatarFromManualLook() {
    const outfitId = manualSavedOutfitId ?? saveManualLook();

    if (!outfitId) {
      return;
    }

    router.push(`/avatar?savedOutfitId=${encodeURIComponent(outfitId)}`);
  }

  if (readyItems.length === 0) {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Smart Mixer</h1>
            <p className="subtle">Outfit suggestions</p>
          </div>
        </div>

        <section className="card" style={{ display: "grid", gap: 12 }}>
          <strong>No mixer-ready items yet</strong>
          <p className="subtle" style={{ margin: 0 }}>
            Add the demo batch to your wardrobe to start mixing outfits. Demo state resets when the page is reloaded.
          </p>
          <Link className="button" href="/upload">
            Add demo items
          </Link>
        </section>
        <BottomNav />
      </AppShell>
    );
  }

  if (!activeSuggestion) {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Smart Mixer</h1>
            <p className="subtle">{mixerState.savedOutfits.length} saved looks</p>
          </div>
        </div>

        <section className="card" style={{ display: "grid", gap: 12 }}>
          <strong>
            {hasReviewedAllSuggestions ? "You have reviewed every suggested look." : "Add at least one top and one bottom to start mixing."}
          </strong>
          <p className="subtle" style={{ margin: 0 }}>
            {hasReviewedAllSuggestions
              ? "Bring the suggestions back to keep browsing, or add more closet items for fresh combinations."
              : "A dress or one-piece can start a look by itself. Otherwise, add one top and one bottom; shoes, layers, and accessories are optional."}
          </p>
          {hasReviewedAllSuggestions ? (
            <button
              type="button"
              className="button"
              onClick={() => {
                setDismissedSuggestionIds([]);
                setSimilarityAnchorId(null);
                setActiveSuggestionIndex(0);
              }}
            >
              Show looks again
            </button>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 8 }}>
              <Link className="button" href="/upload">
                Upload
              </Link>
              <Link className="button secondary" href="/closet">
                Closet
              </Link>
            </div>
          )}
        </section>
        <BottomNav />
      </AppShell>
    );
  }

  if (refiningSuggestion) {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Refine Look</h1>
            <p className="subtle">Tune the pieces before saving.</p>
          </div>
          <button type="button" className="button secondary" onClick={() => setRefiningSuggestion(null)}>
            <ArrowLeft size={17} aria-hidden="true" />
            Back
          </button>
        </div>

        <div className="stack">
          {saveMessage ? (
            <div className="pill dark" role="status" style={{ justifySelf: "start" }}>
              {saveMessage}
            </div>
          ) : null}
          <MixerBodyStage selectedItems={selectedItems} />

          <section className="card" style={{ display: "grid", gap: 12 }}>
            <div>
              <strong>{refiningSuggestion.title}</strong>
              <p className="subtle" style={{ margin: "4px 0 0" }}>
                {refiningSuggestion.rationale}
              </p>
            </div>

            <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
              {mixerSlots.map((slot) => {
                const selection = refiningSuggestion.selections.find((item) => item.slot === slot);
                const isActive = activeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    className={isActive ? "pill dark" : "pill"}
                    onClick={() => {
                      if (isActive) {
                        toggleRefineLock(slot);
                        return;
                      }

                      setActiveSlot(slot);
                    }}
                    aria-pressed={isActive}
                    style={{ border: 0, whiteSpace: "nowrap" }}
                    title={`${selection?.locked ? "Unlock" : "Select"} ${slotLabels[slot]}`}
                  >
                    {selection?.locked ? <Lock size={13} aria-hidden="true" /> : <Unlock size={13} aria-hidden="true" />}
                    {slotLabels[slot]}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
              {promptLabels.map((prompt) => (
                <button key={prompt} type="button" className="pill" style={{ border: 0, whiteSpace: "nowrap" }}>
                  {prompt}
                </button>
              ))}
            </div>
          </section>

          <section className="card" style={{ display: "grid", gap: 10 }}>
            <strong>{slotLabels[activeSlot]} alternatives</strong>
            {alternatives.length === 0 ? (
              <p className="subtle" style={{ margin: 0 }}>
                No unlocked alternatives for this slot yet.
              </p>
            ) : (
              alternatives.map((alternative) => (
                <button
                  key={alternative.item.id}
                  type="button"
                  onClick={() => setRefiningSuggestion(refineOutfitSelection(refiningSuggestion, activeSlot, alternative.item.id))}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    background: "var(--white)",
                    padding: 10,
                    display: "grid",
                    gridTemplateColumns: "74px 1fr auto",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      height: 74,
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                      borderRadius: 8,
                      background: "#f7f4ef",
                    }}
                  >
                    <span style={{ transform: "scale(.55)", display: "grid", placeItems: "center" }}>
                      <ClosetAssetArtwork asset={alternative.item.asset} />
                    </span>
                  </span>
                  <span>
                    <strong style={{ fontSize: 13 }}>{alternative.item.name}</strong>
                    <span className="subtle" style={{ display: "block", marginTop: 2 }}>
                      {alternative.reason}
                    </span>
                  </span>
                  <span className="pill">Swap</span>
                </button>
              ))
            )}
          </section>

          <button type="button" className="full-button" onClick={() => saveSuggestion(refiningSuggestion, "refined")}>
            Save refined look
          </button>
        </div>

        <BottomNav />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="appbar">
        <div style={{ minWidth: 0 }}>
          <h1 className="app-title">Smart Mixer</h1>
          <p className="subtle">{mixerState.savedOutfits.length} saved looks</p>
        </div>
        <span className="pill dark" style={{ flex: "0 0 auto" }}>
          <Sparkles size={14} aria-hidden="true" />
          {suggestions.length} looks
        </span>
      </div>

      <section style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <strong style={{ fontSize: 15 }}>What are we mixing for?</strong>
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
          {outfitIntentOptions.map((option) => {
            const selected = selectedIntent === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className={selected ? "pill dark" : "pill"}
                aria-pressed={selected}
                onClick={() => chooseMixerIntent(option.id)}
                style={{ border: 0, whiteSpace: "nowrap" }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <div
        role="tablist"
        aria-label="Mixer mode"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 6,
          padding: 4,
          border: "1px solid var(--line)",
          borderRadius: 999,
          background: "var(--soft)",
          marginBottom: 12,
        }}
      >
        {(["smart", "canvas"] as MixerMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={mixerMode === mode}
            onClick={() => setMixerMode(mode)}
            style={{
              minHeight: 38,
              border: 0,
              borderRadius: 999,
              background: mixerMode === mode ? "var(--ink)" : "transparent",
              color: mixerMode === mode ? "var(--white)" : "var(--muted)",
              fontSize: 13,
              fontWeight: 820,
            }}
          >
            {mode === "smart" ? "Suggestions" : "Canvas"}
          </button>
        ))}
      </div>

      {mixerMode === "canvas" ? (
        <div className="stack">
          {saveMessage ? (
            <div className="pill dark" role="status" style={{ justifySelf: "start" }}>
              {saveMessage}
            </div>
          ) : null}

          <section
            aria-label="Manual transparent mixer preview"
            style={{
              display: "grid",
              gap: 10,
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: 12,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <div>
                <strong style={{ fontSize: 15 }}>Canvas preview</strong>
                <p className="subtle" style={{ margin: "3px 0 0" }}>
                  Your selected pieces line up here.
                </p>
              </div>
              <span className="pill">No AI</span>
            </div>

            <MixerBodyStage selectedItems={manualSelectedItems} minHeight={390} showLabels={false} layout="compact" />
          </section>

          <section
            aria-label="Manual transparent mixer swipe controls"
            style={{
              display: "grid",
              gap: 12,
              background: "var(--white)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: 12,
              overflow: "hidden",
            }}
          >
            <div>
              <strong style={{ fontSize: 15 }}>Swipe pieces</strong>
              <p className="subtle" style={{ margin: "3px 0 0" }}>
                Slide each row sideways. The centered piece becomes the one in preview.
              </p>
            </div>

            <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
              {manualSlots.map(({ slot, label, emptyLabel }) => (
                <ManualMixerRow
                  key={slot}
                  label={label}
                  emptyLabel={emptyLabel}
                  items={manualItemsBySlot[slot]}
                  selectedItemId={manualSelections[slot]}
                  onSelect={(itemId) => {
                    setManualSelections((selections) => {
                      if (slot === "onePiece") {
                        return { ...selections, onePiece: itemId, top: null, bottom: null };
                      }

                      if ((slot === "top" || slot === "bottom") && itemId) {
                        return { ...selections, [slot]: itemId, onePiece: null };
                      }

                      return { ...selections, [slot]: itemId };
                    });
                    setManualSavedOutfitId(null);
                  }}
                />
              ))}
            </div>
          </section>

          <div style={{ display: "grid", gap: 8 }}>
            <button type="button" className="button" onClick={createAvatarFromManualLook}>
              <Sparkles size={16} aria-hidden="true" />
              Create avatar
            </button>
          </div>
        </div>
      ) : (
      <div className="stack">
        {saveMessage ? (
          <div className="pill dark" role="status" style={{ justifySelf: "start" }}>
            {saveMessage}
          </div>
        ) : null}

        {currentSuggestion ? (
          <>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span className="subtle">
                  Look {activeSuggestionIndex + 1} of {suggestions.length}
                </span>
                <span className="subtle">{similarityAnchorId ? "Closest matches" : "Suggestions"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
                {suggestions.map((suggestion, index) => (
                  <span
                    key={suggestion.id}
                    aria-hidden="true"
                    style={{
                      width: index === activeSuggestionIndex ? 18 : 6,
                      height: 6,
                      borderRadius: 999,
                      background: index === activeSuggestionIndex ? "var(--ink)" : "var(--line)",
                      transition: "width .18s ease",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 8 }}>
                <button
                  type="button"
                  className="button secondary"
                  disabled={activeSuggestionIndex === 0}
                  onClick={showPreviousSuggestion}
                  aria-label="Previous look"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Previous
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={activeSuggestionIndex >= suggestions.length - 1}
                  onClick={showNextSuggestion}
                  aria-label="Next look"
                >
                  Next
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
              <button type="button" className="button ghost" onClick={shuffleSmartMixer}>
                <RefreshCcw size={16} aria-hidden="true" />
                Shuffle
              </button>
            </div>
            <article
              key={currentSuggestion.id}
              className="card"
              style={{
                display: "grid",
                gap: 12,
                background: "linear-gradient(180deg, #fffefa 0%, #f1ebe2 100%)",
              }}
            >
              <MixerSuggestionHeader suggestion={currentSuggestion} />

              <MixerBodyStage selectedItems={getSelectedItems(state.closetItems, currentSuggestion)} showLabels={false} />

              <MixerSuggestionDetails suggestion={currentSuggestion} closetItems={state.closetItems} />

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 8 }}>
                <button type="button" className="button" onClick={() => saveSuggestion(currentSuggestion, "suggestion")}>
                  <Save size={16} aria-hidden="true" />
                  Save look
                </button>
                <button type="button" className="button secondary" onClick={() => setRefiningSuggestion(currentSuggestion)}>
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  Refine
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => dismissSuggestion(currentSuggestion)}
                  style={{ minWidth: 0, padding: "0 10px" }}
                >
                  <X size={16} aria-hidden="true" />
                  Not this
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => showMoreLikeSuggestion(currentSuggestion)}
                  style={{ minWidth: 0, padding: "0 10px" }}
                >
                  <Heart size={16} aria-hidden="true" />
                  More like this
                </button>
              </div>
            </article>
          </>
        ) : null}
      </div>
      )}

      <BottomNav />
    </AppShell>
  );
}
