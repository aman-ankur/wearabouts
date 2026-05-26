import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GarmentCandidateChoice, UploadSourceImageReference } from "@/src/domain/wardrobe";
import {
  CandidateCropThumbnail,
  DetectedCandidatePhotoReference,
  getCandidateColor,
} from "./DetectedCandidatePhotoReference";

const sourceImage: UploadSourceImageReference = {
  id: "source-real-1",
  imageUrl: "https://signed.example/source.jpg",
  contentType: "image/jpeg",
  originalFilename: "outfit.jpg",
};

const candidate: GarmentCandidateChoice = {
  id: "candidate-1",
  uploadBatchId: "batch-real-1",
  proposedName: "Black crew-neck T-shirt",
  category: "tops",
  confidence: "high",
  visibilityState: "visible",
  boundingBox: { x: 0.25, y: 0.2, width: 0.5, height: 0.3 },
  selectionStatus: "primary",
  selectionReason: "Clear top",
  duplicateHint: false,
  status: "detected",
  detectedGarmentId: null,
};

describe("DetectedCandidatePhotoReference", () => {
  it("renders a compact clean uploaded photo preview without overlay markers", () => {
    const html = renderToStaticMarkup(
      <DetectedCandidatePhotoReference sourceImage={sourceImage} candidates={[candidate]} />,
    );

    expect(html).toContain('src="https://signed.example/source.jpg"');
    expect(html).toContain('alt="Uploaded photo outfit.jpg"');
    expect(html).toContain("object-position:50% 37%");
    expect(html).not.toContain("detected area");
    expect(html).not.toContain("width:50%");
    expect(html).not.toContain("height:30%");
  });

  it("summarizes detected pieces without repeating crop chips below the clean photo", () => {
    const html = renderToStaticMarkup(
      <DetectedCandidatePhotoReference sourceImage={sourceImage} candidates={[candidate]} />,
    );

    expect(html).toContain("1 piece found. Review selections below.");
    expect(html).not.toContain("Detected pieces");
  });

  it("renders crop thumbnails zoomed around the candidate center", () => {
    const html = renderToStaticMarkup(<CandidateCropThumbnail sourceImage={sourceImage} candidate={candidate} />);

    expect(html).toContain('src="https://signed.example/source.jpg"');
    expect(html).toContain("object-position:50% 35%");
    expect(html).toContain("transform:scale(2.5)");
  });

  it("cycles stable candidate colors", () => {
    expect(getCandidateColor(0)).toBe("#48614c");
    expect(getCandidateColor(6)).toBe("#48614c");
  });
});
