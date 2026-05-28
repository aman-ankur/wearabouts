import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CandidateGenerationProgress } from "./CandidateGenerationProgress";

describe("CandidateGenerationProgress", () => {
  it("summarizes progressive candidate generation while selected items are still running", () => {
    const html = renderToStaticMarkup(
      <CandidateGenerationProgress
        isGenerating
        generatedCount={1}
        candidates={[
          { id: "candidate-1", status: "ready" },
          { id: "candidate-2", status: "prettifying" },
          { id: "candidate-3", status: "detected" },
        ]}
      />,
    );

    expect(html).toContain("1 item ready");
    expect(html).toContain("2 still preparing");
    expect(html).toContain("You can review finished items while the rest keep processing.");
  });
});
