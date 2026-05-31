"use client";

import Link from "next/link";
import { CalendarDays, Plus, Shirt, Shuffle, Sparkles } from "lucide-react";
import { useMemo } from "react";
import type { OutfitSlot, WardrobeItem } from "@/src/domain/wardrobe";
import { getRuntimeMode, getRuntimeModeLabel } from "@/src/features/runtime/runtimeMode";
import { defaultMensStarterLooks, defaultMensWardrobeItems } from "@/src/features/wardrobe/fixtures/defaultMensWardrobe";
import { getOutfitRecommendations } from "@/src/features/wardrobe/outfits/outfitRecommendationService";
import type { OutfitIntent, OutfitSuggestion } from "@/src/features/wardrobe/outfits/outfitTypes";
import { getSelectedItem } from "@/src/features/wardrobe/selectors/mixerSelectors";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";
import { AppShell } from "./AppShell";
import { BottomNav } from "./BottomNav";
import { MixerBodyStage } from "./MixerBodyStage";

interface HomeFeedCard {
  id: string;
  title: string;
  occasion: string;
  note: string;
  tag: string;
  selectedItems: Partial<Record<OutfitSlot, WardrobeItem>>;
  example: boolean;
}

const intentLabels: Record<OutfitIntent, string> = {
  casual: "Easy day",
  dinner: "Dinner",
  travel_day: "Travel day",
  work: "Office work",
  warm_weather: "Warm weather",
  rain_ready: "Rain ready",
};

const exampleCards: HomeFeedCard[] = defaultMensStarterLooks.map((look) => createExampleCard(look));

function createExampleCard(input: {
  id: string;
  title: string;
  occasion: string;
  note: string;
  slots: Partial<Record<OutfitSlot, string>>;
}): HomeFeedCard {
  return {
    id: input.id,
    title: input.title,
    occasion: input.occasion,
    note: input.note,
    tag: "Men's starter feed",
    example: true,
    selectedItems: Object.entries(input.slots).reduce<Partial<Record<OutfitSlot, WardrobeItem>>>(
      (selectedItems, [slot, itemId]) => {
        const item = defaultMensWardrobeItems.find((wardrobeItem) => wardrobeItem.id === itemId);
        if (item) {
          selectedItems[slot as OutfitSlot] = item;
        }

        return selectedItems;
      },
      {},
    ),
  };
}

function getSelectedItems(items: WardrobeItem[], suggestion: OutfitSuggestion): Partial<Record<OutfitSlot, WardrobeItem>> {
  return suggestion.selections.reduce<Partial<Record<OutfitSlot, WardrobeItem>>>((selected, selection) => {
    const item = getSelectedItem(items, selection);
    if (item) {
      selected[selection.slot] = item;
    }

    return selected;
  }, {});
}

function toHomeFeedCard(items: WardrobeItem[], suggestion: OutfitSuggestion): HomeFeedCard {
  return {
    id: suggestion.id,
    title: intentLabels[suggestion.intent],
    occasion: suggestion.confidenceLabel,
    note: suggestion.rationale,
    tag: "From your wardrobe",
    example: false,
    selectedItems: getSelectedItems(items, suggestion),
  };
}

function getHomeFeedCards(items: WardrobeItem[], savedOutfits: OutfitSuggestionContextSavedOutfits, profileId: string): HomeFeedCard[] {
  const readyItems = items.filter((item) => item.readyForMixer);
  if (readyItems.length === 0) {
    return exampleCards;
  }

  const intents: OutfitIntent[] = ["work", "casual", "dinner"];
  const cards = intents
    .flatMap((intent) =>
      getOutfitRecommendations({
        profileId,
        intent,
        closetItems: items,
        savedOutfits,
        feedbackSignals: [],
        maxSuggestions: 1,
      }),
    )
    .map((suggestion) => toHomeFeedCard(items, suggestion));

  return cards.length > 0 ? cards : exampleCards;
}

type OutfitSuggestionContextSavedOutfits = Parameters<typeof getOutfitRecommendations>[0]["savedOutfits"];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getWeekDays() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 3);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: date.toISOString(),
      weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
      day: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
    };
  });
}

function HomeFeedCardView({ card }: { card: HomeFeedCard }) {
  return (
    <article
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        background: "var(--white)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "14px 14px 0" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.1 }}>{card.title}</h2>
          <p className="subtle" style={{ margin: "4px 0 0" }}>
            {card.note}
          </p>
        </div>
        <span className="subtle" style={{ flex: "0 0 auto", fontSize: 12, fontWeight: 760 }}>
          {card.occasion}
        </span>
      </div>

      <MixerBodyStage selectedItems={card.selectedItems} minHeight={318} background="#f8f8f7" />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "0 14px 14px",
        }}
      >
        <span className="pill">{card.tag}</span>
        <Link className="button secondary" href={card.example ? "/upload" : "/mixer"} style={{ minHeight: 36, padding: "8px 12px" }}>
          {card.example ? "Add my items" : "Open mixer"}
        </Link>
      </div>
    </article>
  );
}

export function WearaboutsHome() {
  const mode = getRuntimeMode();
  const { state, mixerState } = useWardrobe();
  const weekDays = useMemo(() => getWeekDays(), []);
  const feedCards = useMemo(
    () => {
      const readyItems = state.closetItems.filter((item) => item.readyForMixer);
      const activeProfileId = readyItems[0]?.ownerProfileId ?? state.closetItems[0]?.ownerProfileId ?? "profile-aankur";
      return getHomeFeedCards(state.closetItems, mixerState.savedOutfits, activeProfileId);
    },
    [mixerState.savedOutfits, state.closetItems],
  );
  const hasClosetData = state.closetItems.some((item) => item.readyForMixer);

  return (
    <AppShell>
      <div className="appbar" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="app-title" style={{ fontSize: 25 }}>
            Wearabouts
          </h1>
          <p className="subtle">{getRuntimeModeLabel(mode)}</p>
        </div>
        <Link className="button secondary" href="/stylist" style={{ minHeight: 40, padding: "8px 12px" }}>
          <Sparkles size={16} aria-hidden="true" />
          Stylist
        </Link>
      </div>

      <section aria-label="This week" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
        {weekDays.map((day) => (
          <div
            key={day.key}
            style={{
              minHeight: 54,
              display: "grid",
              justifyItems: "center",
              alignContent: "center",
              gap: 2,
              color: day.isToday ? "var(--ink)" : "var(--muted)",
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 760, textTransform: "uppercase" }}>{day.weekday}</span>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                background: day.isToday ? "var(--ink)" : "transparent",
                color: day.isToday ? "var(--white)" : "inherit",
                fontSize: 13,
                fontWeight: 820,
              }}
            >
              {day.day}
            </span>
          </div>
        ))}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 8, marginTop: 14 }}>
        <Link className="button ghost" href="/mixer">
          <Shuffle size={16} aria-hidden="true" />
          Mix
        </Link>
        <Link className="button ghost" href="/upload">
          <Plus size={16} aria-hidden="true" />
          Capture
        </Link>
      </div>

      <section style={{ display: "grid", gap: 6, marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 23, lineHeight: 1.05 }}>{getGreeting()}, You</h2>
            <p className="subtle" style={{ margin: "5px 0 0" }}>
              {hasClosetData ? "Fresh combinations from your wardrobe." : "A preview of what your closet feed becomes."}
            </p>
          </div>
          <span className="pill" style={{ flex: "0 0 auto" }}>
            <CalendarDays size={14} aria-hidden="true" />
            Today
          </span>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 10,
          margin: "22px 0 14px",
        }}
      >
        <span style={{ height: 1, background: "var(--line)" }} />
        <span className="subtle" style={{ fontWeight: 760 }}>
          Today&apos;s ideas
        </span>
        <span style={{ height: 1, background: "var(--line)" }} />
      </div>

      <div className="stack">
        {!hasClosetData ? (
          <section
            className="card"
            style={{
              display: "grid",
              gap: 10,
              background: "var(--white)",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="pill dark">
                <Shirt size={14} aria-hidden="true" />
                Men&apos;s starter
              </span>
              <p className="subtle" style={{ margin: 0 }}>
                No AI is used here.
              </p>
            </div>
            <p className="subtle" style={{ margin: 0 }}>
              These men&apos;s starter looks show the daily feed while your real wardrobe is still empty. Add your own items
              and the suggestions switch to your closet.
            </p>
          </section>
        ) : null}

        {feedCards.map((card) => (
          <HomeFeedCardView key={card.id} card={card} />
        ))}
      </div>

      <BottomNav />
    </AppShell>
  );
}
