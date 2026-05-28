"use client";

import React, { useState } from "react";
import { Maximize2, X } from "lucide-react";
import type { AvatarRender } from "@/src/features/wardrobe/avatar/avatarTypes";

interface AvatarRenderGalleryProps {
  renders: AvatarRender[];
  onDelete?: (renderId: string) => void;
}

export function AvatarRenderGallery({ renders, onDelete }: AvatarRenderGalleryProps) {
  const [activeRender, setActiveRender] = useState<AvatarRender | null>(null);

  if (renders.length === 0) {
    return null;
  }

  return (
    <>
      <section className="card" style={{ display: "grid", gap: 12 }}>
        <div>
          <strong>Avatar renders</strong>
          <p className="subtle" style={{ margin: "4px 0 0" }}>
            Saved real renders stay here. Deleted renders are kept for later review.
          </p>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {renders.map((render) => (
            <article
              key={render.id}
              style={{
                display: "grid",
                gridTemplateColumns: "82px minmax(0, 1fr)",
                gap: 10,
                alignItems: "center",
                borderTop: "1px solid var(--line)",
                paddingTop: 10,
                opacity: render.status === "deleted" ? 0.62 : 1,
              }}
            >
              <button
                type="button"
                onClick={() => (render.imageUrl ? setActiveRender(render) : undefined)}
                disabled={!render.imageUrl}
                aria-label="Open avatar render"
                style={{
                  height: 112,
                  border: 0,
                  padding: 0,
                  background: "#eeeeec",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  cursor: render.imageUrl ? "zoom-in" : "default",
                  position: "relative",
                }}
              >
                {render.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={render.imageUrl} alt="Saved avatar render" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span
                      style={{
                        position: "absolute",
                        right: 6,
                        bottom: 6,
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(255,255,255,.86)",
                        color: "var(--ink)",
                      }}
                    >
                      <Maximize2 size={14} aria-hidden="true" />
                    </span>
                  </>
                ) : (
                  <span className="subtle">No image</span>
                )}
              </button>
              <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className={render.status === "deleted" ? "pill" : "pill dark"}>{render.status === "deleted" ? "Deleted" : "Saved"}</span>
                  <span className="pill">{new Date(render.createdAtIso).toLocaleDateString()}</span>
                </div>
                <p className="subtle" style={{ margin: 0 }}>
                  {render.request.quality} · {render.request.poseId.replace("studio-", "studio ")}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {render.imageUrl ? (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setActiveRender(render)}
                      style={{ minHeight: 34, padding: "7px 11px", width: "auto" }}
                    >
                      Open
                    </button>
                  ) : null}
                  {render.status !== "deleted" && onDelete ? (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => onDelete(render.id)}
                      style={{ minHeight: 34, padding: "7px 11px", width: "auto" }}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {activeRender?.imageUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Avatar render preview"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            gridTemplateRows: "auto minmax(0, 1fr)",
            gap: 12,
            padding: 14,
            background: "rgba(18,18,16,.88)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", color: "var(--white)" }}>
            <div>
              <strong>Avatar render</strong>
              <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,.72)", fontSize: 13 }}>
                {new Date(activeRender.createdAtIso).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              className="button secondary"
              onClick={() => setActiveRender(null)}
              style={{ width: "auto", minHeight: 36, padding: "8px 12px", background: "rgba(255,255,255,.94)" }}
            >
              <X size={16} aria-hidden="true" />
              Close
            </button>
          </div>
          <div style={{ minHeight: 0, display: "grid", placeItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeRender.imageUrl}
              alt="Full-size avatar render"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", background: "#eeeeec" }}
            />
          </div>
          {activeRender.status !== "deleted" && onDelete ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    onDelete(activeRender.id);
                    setActiveRender(null);
                  }}
                  style={{ width: "auto", minHeight: 38, padding: "8px 14px", background: "rgba(255,255,255,.94)" }}
                >
                  Delete
                </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
