import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AvatarSetupFlow } from "./AvatarSetupFlow";

describe("AvatarSetupFlow", () => {
  it("starts on face step when no face input exists", () => {
    const html = renderToStaticMarkup(<AvatarSetupFlow step="face" onSaveInput={() => {}} onComplete={() => {}} />);

    expect(html).toContain("Face Pic");
    expect(html).toContain("Clear close-up");
  });

  it("shows body guidance after face input is accepted", () => {
    const html = renderToStaticMarkup(
      <AvatarSetupFlow
        step="body"
        facePreviewUrl="face-url"
        faceQuality={{ status: "passed", reasons: [] }}
        onSaveInput={() => {}}
        onComplete={() => {}}
      />,
    );

    expect(html).toContain("Body Pic");
    expect(html).toContain("Head-to-toe full body");
  });

  it("shows review, warnings, and disables finish until minimum quality passes", () => {
    const html = renderToStaticMarkup(
      <AvatarSetupFlow
        step="review"
        facePreviewUrl="face-url"
        bodyPreviewUrl="body-url"
        faceQuality={{ status: "warning", reasons: ["A sharper face photo will improve likeness."] }}
        bodyQuality={{ status: "failed", reasons: ["Use a head-to-toe body photo with head and shoes visible."] }}
        onSaveInput={() => {}}
        onComplete={() => {}}
      />,
    );

    expect(html).toContain("Review Your Avatar");
    expect(html).toContain("A sharper face photo will improve likeness.");
    expect(html).toContain("Use a head-to-toe body photo");
    expect(html).toContain("disabled");
  });
});
