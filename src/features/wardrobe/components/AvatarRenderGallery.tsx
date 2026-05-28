"use client";

import React, { useState } from "react";
import { Maximize2, X } from "lucide-react";
import type { AvatarRender } from "@/src/features/wardrobe/avatar/avatarTypes";

interface AvatarRenderGalleryProps {
  renders: AvatarRender[];
  onDelete?: (renderId: string) => void;
}

interface AvatarRenderPreviewDialogProps {
  render: AvatarRender;
  onClose: () => void;
  onDelete?: (renderId: string) => void;
}

export function AvatarRenderPreviewDialog({ render, onClose, onDelete }: AvatarRenderPreviewDialogProps) {
  if (!render.imageUrl) {
    return null;
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Avatar render preview" className="avatar-preview-overlay">
      <div className="avatar-preview-sheet">
        <div className="avatar-preview-bar">
          <div>
            <strong>Avatar render</strong>
            <p>{new Date(render.createdAtIso).toLocaleDateString()}</p>
          </div>
          <button type="button" className="button secondary avatar-preview-close" onClick={onClose}>
            <X size={16} aria-hidden="true" />
            Close
          </button>
        </div>
        <div className="avatar-preview-image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={render.imageUrl} alt="Full-size avatar render" className="avatar-preview-image" />
        </div>
        <div className="avatar-preview-actions">
          <span className={render.status === "deleted" ? "pill" : "pill dark"}>{render.status === "deleted" ? "Deleted" : "Saved"}</span>
          {render.status !== "deleted" && onDelete ? (
            <button
              type="button"
              className="button secondary avatar-preview-delete"
              onClick={() => {
                onDelete(render.id);
                onClose();
              }}
            >
              Delete render
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
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
        <AvatarRenderPreviewDialog render={activeRender} onClose={() => setActiveRender(null)} onDelete={onDelete} />
      ) : null}
    </>
  );
}
