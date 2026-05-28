"use client";

import Link from "next/link";
import { CloudSun, LocateFixed, MapPin, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AvatarRender } from "@/src/features/wardrobe/avatar/avatarTypes";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { AvatarRenderGallery } from "@/src/features/wardrobe/components/AvatarRenderGallery";
import { BottomNav } from "@/src/features/wardrobe/components/BottomNav";
import { StylistLookCard } from "@/src/features/wardrobe/components/StylistLookCard";
import { getVisibleStylistChips } from "@/src/features/wardrobe/stylist/stylistChipDisplay";
import { generateStylistChips } from "@/src/features/wardrobe/stylist/stylistChipService";
import { buildStylistLooks } from "@/src/features/wardrobe/stylist/stylistRecommendationService";
import { parseStylistRequest } from "@/src/features/wardrobe/stylist/stylistRequestParser";
import type { StylistLook } from "@/src/features/wardrobe/stylist/stylistTypes";
import { useStylistWeather } from "@/src/features/wardrobe/stylist/useStylistWeather";
import { useWardrobe } from "@/src/features/wardrobe/state/WardrobeContext";

function formatDayTime(date: Date): string {
  return new Intl.DateTimeFormat("en", { weekday: "long", hour: "numeric", minute: "2-digit" }).format(date);
}

function weatherLine(look: ReturnType<typeof useStylistWeather>): string {
  if (look.locationState === "locating") return "Checking local weather";
  if (look.weather.status === "ready") {
    return [
      look.weather.locationLabel,
      typeof look.weather.temperatureC === "number" ? `${look.weather.temperatureC} C` : null,
      typeof look.weather.rainChancePercent === "number" ? `rain ${look.weather.rainChancePercent}%` : look.weather.conditionLabel.toLowerCase(),
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (look.locationState === "denied") return "Location denied · enter city to add weather";
  if (look.locationState === "failed") return "Weather unavailable · using wardrobe and occasion";
  return "Weather optional";
}

export default function StylistPage() {
  const { state, saveCurrentOutfit } = useWardrobe();
  const [now] = useState(() => new Date());
  const stylistWeather = useStylistWeather(now);
  const [city, setCity] = useState("");
  const [selectedChipIds, setSelectedChipIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [looks, setLooks] = useState<StylistLook[]>([]);
  const [includeIdeas, setIncludeIdeas] = useState(false);
  const [savedLook, setSavedLook] = useState<{ look: StylistLook; outfitId: string } | null>(null);
  const [refineLook, setRefineLook] = useState<StylistLook | null>(null);
  const [chipsExpanded, setChipsExpanded] = useState(false);
  const [activeLookIndex, setActiveLookIndex] = useState(0);
  const [rejectedLookIds, setRejectedLookIds] = useState<string[]>([]);
  const [avatarRenders, setAvatarRenders] = useState<AvatarRender[]>([]);
  const readyItems = useMemo(() => state.closetItems.filter((item) => item.readyForMixer), [state.closetItems]);
  const chips = useMemo(
    () => generateStylistChips({ now, weather: stylistWeather.weather, closetItems: state.closetItems }),
    [now, state.closetItems, stylistWeather.weather],
  );
  const chipDisplay = getVisibleStylistChips(chips, chipsExpanded);
  const visibleChips = chipDisplay.chips;
  const hiddenChipCount = chipDisplay.hiddenChipCount;
  const visibleLooks = looks.filter((look) => !rejectedLookIds.includes(look.id));
  const activeLook = visibleLooks[Math.min(activeLookIndex, Math.max(visibleLooks.length - 1, 0))] ?? null;

  useEffect(() => {
    setActiveLookIndex((index) => Math.min(index, Math.max(visibleLooks.length - 1, 0)));
  }, [visibleLooks.length]);

  useEffect(() => {
    setSelectedChipIds((current) => {
      if (current.length > 0) return current;
      return chips.filter((chip) => chip.selectedByDefault).map((chip) => chip.id);
    });
  }, [chips]);

  useEffect(() => {
    void fetch("/api/wardrobe/avatar/renders")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Could not load avatar renders."))))
      .then((payload: { renders: AvatarRender[] }) => setAvatarRenders(payload.renders))
      .catch(() => undefined);
  }, []);

  function buildLooks(nextIncludeIdeas: boolean) {
    const request = parseStylistRequest({
      profileId: "profile-aankur",
      selectedChipIds,
      note,
      includeIdeas: nextIncludeIdeas,
      weather: stylistWeather.weather,
    });
    setLooks(buildStylistLooks(request, state.closetItems));
    setIncludeIdeas(nextIncludeIdeas);
    setSavedLook(null);
    setRefineLook(null);
    setRejectedLookIds([]);
    setActiveLookIndex(0);
  }

  function toggleChip(chipId: string) {
    setSelectedChipIds((ids) => (ids.includes(chipId) ? ids.filter((id) => id !== chipId) : [...ids, chipId]));
  }

  function submitCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void stylistWeather.lookupCity(city);
  }

  function saveLook(look: StylistLook) {
    const outfitId = saveCurrentOutfit(look.suggestion.title, look.suggestion.profileId, look.suggestion.selections, {
      source: "suggestion",
      intent: "stylist",
      rationale: `${look.weatherRationale} ${look.styleRationale}`,
    });
    setSavedLook({ look, outfitId });
    setRejectedLookIds((ids) => (ids.includes(look.id) ? ids : [...ids, look.id]));
    setActiveLookIndex((index) => Math.min(index, Math.max(visibleLooks.length - 2, 0)));
  }

  function rejectLook(look: StylistLook) {
    setRejectedLookIds((ids) => (ids.includes(look.id) ? ids : [...ids, look.id]));
    setSavedLook(null);
    setActiveLookIndex((index) => Math.min(index, Math.max(visibleLooks.length - 2, 0)));
  }

  async function deleteAvatarRender(renderId: string) {
    const response = await fetch(`/api/wardrobe/avatar/renders/${encodeURIComponent(renderId)}`, { method: "DELETE" });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { render: AvatarRender };
    setAvatarRenders((renders) => renders.map((render) => (render.id === payload.render.id ? payload.render : render)));
  }

  if (readyItems.length === 0) {
    return (
      <AppShell>
        <div className="appbar">
          <div>
            <h1 className="app-title">Stylist</h1>
            <p className="subtle">{formatDayTime(now)}</p>
          </div>
        </div>

        <section className="card" style={{ display: "grid", gap: 12 }}>
          <strong>Add clothes first</strong>
          <p className="subtle" style={{ margin: 0 }}>
            Add at least one top and one bottom to get closet-only Daily Stylist recommendations.
          </p>
          <Link className="button" href="/upload">
            Upload clothes
          </Link>
        </section>
        <BottomNav />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="appbar">
        <div style={{ minWidth: 0 }}>
          <h1 className="app-title">Stylist</h1>
          <p className="subtle">{formatDayTime(now)}</p>
        </div>
        <span className="pill dark" style={{ flex: "0 0 auto", background: "#242622", borderColor: "#242622" }}>
          <Sparkles size={14} aria-hidden="true" />
          Daily
        </span>
      </div>

      <div className="stack">
        {looks.length > 0 ? (
          <>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <span className="pill dark" style={{ background: "#242622", borderColor: "#242622" }}>
                  {includeIdeas ? "Closet looks + ideas" : "Closet-only"}
                </span>
                <span className="pill" style={{ flex: "0 0 auto" }}>
                  {activeLook ? `${Math.min(activeLookIndex + 1, visibleLooks.length)} of ${visibleLooks.length}` : "Reviewed"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 8 }}>
                {!includeIdeas ? (
                  <button type="button" className="button secondary" onClick={() => buildLooks(true)}>
                    Include ideas
                  </button>
                ) : (
                  <button type="button" className="button secondary" onClick={() => buildLooks(false)}>
                    Closet only
                  </button>
                )}
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setLooks([]);
                    setSavedLook(null);
                    setRefineLook(null);
                    setRejectedLookIds([]);
                  }}
                >
                  Edit request
                </button>
              </div>
            </div>

            {activeLook ? (
              <StylistLookCard look={activeLook} closetItems={state.closetItems} onSave={saveLook} onRefine={setRefineLook} onReject={rejectLook} />
            ) : (
              <section className="card" style={{ display: "grid", gap: 10 }}>
                <strong>You have reviewed every look.</strong>
                <p className="subtle" style={{ margin: 0 }}>
                  Bring them back or edit the request for a different angle.
                </p>
                <button type="button" className="button secondary" onClick={() => setRejectedLookIds([])}>
                  Show looks again
                </button>
              </section>
            )}
          </>
        ) : (
          <>
        <section className="card stylist-request-card">
          <div className="stylist-weather-row">
            <span className="stylist-weather-status">
              <CloudSun size={14} aria-hidden="true" />
              {weatherLine(stylistWeather)}
            </span>
            {stylistWeather.locationState === "unknown" ? (
              <div className="stylist-weather-actions">
                <button type="button" className="stylist-mini-button stylist-mini-button-primary" onClick={stylistWeather.requestBrowserLocation}>
                  <LocateFixed size={14} aria-hidden="true" />
                  Location
                </button>
                <button type="button" className="stylist-mini-button" onClick={stylistWeather.skipWeather}>
                  Skip
                </button>
              </div>
            ) : null}
          </div>
          <h2 style={{ fontSize: 30, lineHeight: 1.04, margin: 0 }}>What are you dressing for?</h2>
          {stylistWeather.locationState === "unknown" || stylistWeather.locationState === "denied" || stylistWeather.locationState === "failed" ? (
            <form onSubmit={submitCity} className="stylist-city-row">
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Enter city"
                aria-label="Enter city"
                className="stylist-city-input"
              />
              <button type="submit" className="stylist-mini-button" disabled={!city.trim()}>
                <MapPin size={14} aria-hidden="true" />
                City
              </button>
            </form>
          ) : null}
        </section>

        {stylistWeather.weather.status === "ready" ? (
          <section className="card" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
            <div>
              <strong>{stylistWeather.weather.conditionLabel}</strong>
              <p className="subtle" style={{ margin: "3px 0 0" }}>
                {stylistWeather.weather.locationLabel} · {stylistWeather.weather.temperatureC} C · rain{" "}
                {stylistWeather.weather.rainChancePercent ?? 0}%
              </p>
            </div>
            <span className="pill">Open-Meteo</span>
          </section>
        ) : null}

        <section className="card" style={{ display: "grid", gap: 12 }}>
          <div className="stylist-chip-grid">
            {visibleChips.map((chip) => {
              const selected = selectedChipIds.includes(chip.id);
              return (
                <button
                  key={chip.id}
                  type="button"
                  className={selected ? "pill dark" : "pill"}
                  onClick={() => toggleChip(chip.id)}
                  aria-pressed={selected}
                  title={chip.reason}
                  style={{
                    border: selected ? "1px solid #242622" : "1px solid var(--line)",
                    background: selected ? "#242622" : "linear-gradient(180deg, #fffefa, #f3eee7)",
                    color: selected ? "var(--white)" : "var(--ink)",
                    width: "100%",
                    minWidth: 0,
                    justifyContent: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
            {hiddenChipCount > 0 ? (
              <button type="button" className="pill" onClick={() => setChipsExpanded(true)}>
                More +{hiddenChipCount}
              </button>
            ) : chipsExpanded && chips.length > 9 ? (
              <button type="button" className="pill" onClick={() => setChipsExpanded(false)}>
                Less
              </button>
            ) : null}
          </div>
          <label
            className="stylist-chat-note"
            style={{
              color: "var(--ink)",
            }}
          >
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ask Wearabouts... sharp but comfortable, no black jeans tonight."
              aria-label="Message stylist"
              rows={2}
              style={{
                width: "100%",
                resize: "none",
                border: 0,
                padding: 0,
                outline: "none",
                background: "transparent",
                color: "var(--ink)",
                font: "inherit",
                fontSize: 15,
                lineHeight: 1.35,
              }}
            />
          </label>
          <button type="button" className="full-button" onClick={() => buildLooks(false)} style={{ background: "#242622" }}>
            Get outfits
          </button>
        </section>
          </>
        )}

        {looks.length === 0 && selectedChipIds.length > 0 ? (
          <p className="subtle" style={{ margin: 0 }}>
            First results will use your closet only. Missing-piece ideas appear after `Include ideas`.
          </p>
        ) : null}

        <AvatarRenderGallery renders={avatarRenders} onDelete={(renderId) => void deleteAvatarRender(renderId)} />

        {refineLook ? (
          <section className="card" style={{ display: "grid", gap: 10 }}>
            <strong>Refine handoff</strong>
            <p className="subtle" style={{ margin: 0 }}>
              Use Mixer locks and swaps to refine {refineLook.suggestion.title.toLowerCase()} without changing the saved closet-only rule.
            </p>
            <Link className="button secondary" href="/mixer">
              Open Mixer
            </Link>
          </section>
        ) : null}

        {savedLook ? (
          <section className="card" style={{ display: "grid", gap: 10, borderColor: "rgba(95,116,104,.42)" }}>
            <strong>Saved {savedLook.look.suggestion.title}</strong>
            <p className="subtle" style={{ margin: 0 }}>
              Recommendation source: Stylist · {savedLook.look.missingPieceIdeas.length > 0 ? "idea-assisted" : "closet-only"}
            </p>
            <Link className="button secondary" href={`/avatar?savedOutfitId=${encodeURIComponent(savedLook.outfitId)}`}>
              Render avatar preview
            </Link>
            <p className="subtle" style={{ margin: 0 }}>
              Generate one high-quality avatar render for this saved outfit only when you explicitly ask.
            </p>
          </section>
        ) : null}
      </div>

      <BottomNav />
    </AppShell>
  );
}
