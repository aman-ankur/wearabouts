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
  it("renders the uploaded photo with numbered detection overlays", () => {
    const html = renderToStaticMarkup(
      <DetectedCandidatePhotoReference sourceImage={sourceImage} candidates={[candidate]} />,
    );

    expect(html).toContain('src="https://signed.example/source.jpg"');
    expect(html).toContain('alt="Uploaded photo outfit.jpg"');
    expect(html).toContain("Black crew-neck T-shirt detected area");
    expect(html).toContain("left:25%");
    expect(html).toContain("top:20%");
    expect(html).toContain("width:50%");
    expect(html).toContain("height:30%");
  });

  it("renders crop thumbnails focused on the candidate center", () => {
    const html = renderToStaticMarkup(<CandidateCropThumbnail sourceImage={sourceImage} candidate={candidate} />);

    expect(html).toContain('src="https://signed.example/source.jpg"');
    expect(html).toContain("object-position:50% 35%");
  });

  it("cycles stable candidate colors", () => {
    expect(getCandidateColor(0)).toBe("#48614c");
    expect(getCandidateColor(6)).toBe("#48614c");
  });
});
