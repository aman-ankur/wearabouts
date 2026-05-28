"use client";

import React, { useEffect, useRef } from "react";
import { MoveHorizontal } from "lucide-react";
import type { WardrobeItem } from "@/src/domain/wardrobe";
import { ClosetAssetArtwork } from "./ClosetAssetArtwork";

export interface CenteredItemCandidate {
  id: string;
  left: number;
  width: number;
}

export function findClosestCenteredItemId(
  rowLeft: number,
  rowWidth: number,
  candidates: CenteredItemCandidate[],
): string | null {
  const rowCenter = rowLeft + rowWidth / 2;
  const closest = candidates.reduce<{ id: string; distance: number } | null>((best, candidate) => {
    const candidateCenter = candidate.left + candidate.width / 2;
    const distance = Math.abs(candidateCenter - rowCenter);

    if (!best || distance < best.distance) {
      return { id: candidate.id, distance };
    }

    return best;
  }, null);

  return closest?.id ?? null;
}

interface ManualMixerRowProps {
  label: string;
  emptyLabel: string;
  items: WardrobeItem[];
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
}

export function ManualMixerRow({ label, emptyLabel, items, selectedItemId, onSelect }: ManualMixerRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);
  const itemButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const scrollSelectTimeout = useRef<number | null>(null);

  useEffect(() => {
    selectedButtonRef.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [selectedItemId, items.length]);

  useEffect(() => {
    return () => {
      if (scrollSelectTimeout.current !== null) {
        window.clearTimeout(scrollSelectTimeout.current);
      }
    };
  }, []);

  function selectClosestCenteredItem() {
    const row = rowRef.current;

    if (!row) {
      return;
    }

    const rowRect = row.getBoundingClientRect();
    const candidates = items.flatMap((item) => {
      const button = itemButtonRefs.current.get(item.id);

      if (!button) {
        return [];
      }

      const rect = button.getBoundingClientRect();
      return [{ id: item.id, left: rect.left, width: rect.width }];
    });
    const closestItemId = findClosestCenteredItemId(rowRect.left, rowRect.width, candidates);

    if (closestItemId && closestItemId !== selectedItemId) {
      onSelect(closestItemId);
    }
  }

  function handleScroll() {
    if (scrollSelectTimeout.current !== null) {
      window.clearTimeout(scrollSelectTimeout.current);
    }

    scrollSelectTimeout.current = window.setTimeout(selectClosestCenteredItem, 90);
  }

  return (
    <section aria-label={`${label} manual mixer row`} style={{ display: "grid", gap: 7, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span
          style={{
            color: "var(--muted)",
            fontSize: 11,
            fontWeight: 820,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        {items.length > 1 ? (
          <span
            className="pill"
            style={{
              minHeight: 25,
              padding: "5px 9px",
              color: "var(--muted)",
              fontSize: 11,
              fontWeight: 760,
              whiteSpace: "nowrap",
            }}
          >
            <MoveHorizontal size={13} aria-hidden="true" />
            Swipe
          </span>
        ) : null}
      </div>
      {items.length === 0 ? (
        <div className="subtle" style={{ minHeight: 78, display: "grid", placeItems: "center" }}>
          {emptyLabel}
        </div>
      ) : (
        <div style={{ position: "relative", minWidth: 0 }}>
          {items.length > 1 ? (
            <>
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 8,
                  left: 0,
                  width: 34,
                  background: "linear-gradient(90deg, var(--white), rgba(255,255,255,0))",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 8,
                  width: 34,
                  background: "linear-gradient(270deg, var(--white), rgba(255,255,255,0))",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
            </>
          ) : null}
          <div
            ref={rowRef}
            onScroll={handleScroll}
            style={{
              display: "flex",
              overflowX: "auto",
              overscrollBehaviorX: "contain",
              scrollSnapType: "x mandatory",
              paddingBottom: 8,
              scrollbarWidth: "none",
              scrollPaddingInline: "21%",
            }}
          >
            <span aria-hidden="true" style={{ flex: "0 0 21%" }} />
            {items.map((item, index) => {
              const selected = item.id === selectedItemId;

              return (
                <button
                  key={item.id}
                  ref={(button) => {
                    if (selected) {
                      selectedButtonRef.current = button;
                    }

                    if (button) {
                      itemButtonRefs.current.set(item.id, button);
                    } else {
                      itemButtonRefs.current.delete(item.id);
                    }
                  }}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-pressed={selected}
                  data-manual-mixer-selected={selected ? "true" : undefined}
                  title={item.name}
                  style={{
                    flex: "0 0 58%",
                    minHeight: item.category === "footwear" ? 96 : 124,
                    marginRight: index === items.length - 1 ? 0 : 26,
                    scrollSnapAlign: "center",
                    border: 0,
                    borderRadius: 8,
                    background: "transparent",
                    padding: 0,
                    display: "grid",
                    placeItems: "center",
                    opacity: selected ? 1 : 0.86,
                  }}
                >
                  <span
                    style={{
                      width: "100%",
                      height: item.category === "footwear" ? 92 : 120,
                      display: "grid",
                      placeItems: "center",
                      filter: "drop-shadow(0 14px 16px rgba(20,20,20,.10))",
                    }}
                  >
                    <ClosetAssetArtwork asset={item.asset} />
                  </span>
                </button>
              );
            })}
            <span aria-hidden="true" style={{ flex: "0 0 21%" }} />
          </div>
        </div>
      )}
    </section>
  );
}
