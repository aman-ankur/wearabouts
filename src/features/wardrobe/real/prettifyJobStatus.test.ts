import { describe, expect, it } from "vitest";
import { getPrettifyJobSteps, getTerminalPrettifyStatus } from "./prettifyJobStatus";

describe("prettifyJobStatus", () => {
  it("marks completed steps through the current job status", () => {
    expect(getPrettifyJobSteps("prettifying")).toEqual([
      { id: "queued", label: "Upload", state: "complete" },
      { id: "analyzing", label: "Analyze", state: "complete" },
      { id: "prettifying", label: "Prettify", state: "active" },
      { id: "validating", label: "Validate", state: "pending" },
      { id: "ready", label: "Review", state: "pending" },
    ]);
  });

  it("uses outfit-specific processing labels for outfit jobs", () => {
    expect(getPrettifyJobSteps("prettifying", "outfit_parent")).toEqual([
      { id: "queued", label: "Upload", state: "complete" },
      { id: "analyzing", label: "Detect garments", state: "complete" },
      { id: "prettifying", label: "Prettify garments", state: "active" },
      { id: "validating", label: "Validate assets", state: "pending" },
      { id: "ready", label: "Review", state: "pending" },
    ]);
  });

  it("maps failed jobs to a failed terminal prettify status", () => {
    expect(getTerminalPrettifyStatus("failed")).toBe("failed");
  });

  it("maps low-confidence ready jobs to needs review", () => {
    expect(getTerminalPrettifyStatus("ready", false)).toBe("needs_review");
  });
});
