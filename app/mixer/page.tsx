"use client";

import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Lock, Save, SlidersHorizontal, Sparkles, Unlock, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { ClosetAssetArtwork } from "@/src/features/wardrobe/components/ClosetAssetArtwork";
import { MixerBodyStage } from "@/src/features/wardrobe/components/MixerBodyStage";
import { getRefinementAlternatives, refineOutfitSelection } from "@/src/features/wardrobe/outfits/outfitRefinement";
import { getOutfitRecommendations } from "@/src/features/wardrobe/outfits/outfitRecommendationService";
import type { OutfitSuggestion } from "@/src/features/wardrobe/outfits/outfitTypes";
import { getSelectedItem, mixerSlots } from "@/src/features/wardrobe/selectors/mixerSelectors";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

const slotLabels: Record<OutfitSlot, string> = {
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  layer: "Layer",
  accessory: "Accessory",
};

const promptLabels = ["More casual", "Dinner-ready", "Better for travel", "Less black", "Keep these pants"];

function getSelectedItems(items: WardrobeItem[], suggestion: OutfitSuggestion): Partial<Record<OutfitSlot, WardrobeItem>> {
  return suggestion.selections.reduce<Partial<Record<OutfitSlot, WardrobeItem>>>((selected, selection) => {
    const item = getSelectedItem(items, selection);
    if (item) {
      selected[selection.slot] = item;
    }

    return selected;
  }, {});
}

function itemNames(items: WardrobeItem[], suggestion: OutfitSuggestion): string {
  return suggestion.selections
    .map((selection) => getSelectedItem(items, selection)?.name)
    .filter(Boolean)
    .join(" · ");
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

export default function MixerPage() {
  const { state, mixerState, saveCurrentOutfit } = useWardrobe();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>([]);
  const [similarityAnchorId, setSimilarityAnchorId] = useState<string | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [refiningSuggestion, setRefiningSuggestion] = useState<OutfitSuggestion | null>(null);
  const [activeSlot, setActiveSlot] = useState<OutfitSlot>("top");
  const readyItems = useMemo(() => state.closetItems.filter((item) => item.readyForMixer), [state.closetItems]);
  const suggestions = useMemo(
    () => {
      const recommended = getOutfitRecommendations({
        profileId: "profile-aankur",
        intent: "dinner",
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
    [dismissedSuggestionIds, mixerState.savedOutfits, similarityAnchorId, state.closetItems],
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
              : "Shoes, layers, and accessories are optional. Wearabouts can suggest starter looks once the core outfit pieces are in your closet."}
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
            <p className="subtle">{refiningSuggestion.confidenceLabel}</p>
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
                  <span className="pill">{alternative.score}</span>
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <p className="subtle" style={{ margin: 0 }}>
                    Aankur · {currentSuggestion.intent.replace("_", " ")}
                  </p>
                  <h2 style={{ fontSize: 22, lineHeight: 1.05, margin: "4px 0 0" }}>{currentSuggestion.title}</h2>
                </div>
                <span className="pill">{currentSuggestion.confidenceLabel}</span>
              </div>

              <MixerBodyStage selectedItems={getSelectedItems(state.closetItems, currentSuggestion)} />

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <strong style={{ fontSize: 13 }}>Score {currentSuggestion.score}</strong>
                  {currentSuggestion.warnings.length > 0 ? <span className="pill">{currentSuggestion.warnings[0]}</span> : null}
                </div>
                <p className="subtle" style={{ margin: 0 }}>
                  {currentSuggestion.rationale}
                </p>
                <p className="subtle" style={{ margin: 0 }}>
                  {itemNames(state.closetItems, currentSuggestion)}
                </p>
              </div>

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

      <BottomNav />
    </AppShell>
  );
}
