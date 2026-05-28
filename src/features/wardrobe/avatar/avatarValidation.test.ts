import { describe, expect, it } from "vitest";
import { canCompleteAvatarProfile, evaluateBodyInput, evaluateFaceInput } from "./avatarValidation";

describe("avatarValidation", () => {
  it("passes a clear face input", () => {
    expect(evaluateFaceInput({ detectedFaceCount: 1, faceVisible: true, sharp: true, wellLit: true, occluded: false })).toEqual({
      status: "passed",
      reasons: [],
      detectedPersonCount: 1,
      faceVisible: true,
    });
  });

  it("fails a face input when no face is visible", () => {
    expect(evaluateFaceInput({ detectedFaceCount: 0, faceVisible: false, sharp: true, wellLit: true, occluded: false }).status).toBe("failed");
  });

  it("warns for low light or blur on otherwise usable face input", () => {
    const quality = evaluateFaceInput({ detectedFaceCount: 1, faceVisible: true, sharp: false, wellLit: false, occluded: false });
    expect(quality.status).toBe("warning");
    expect(quality.reasons.join(" ")).toContain("sharper");
  });

  it("passes a clear full-body input", () => {
    expect(
      evaluateBodyInput({
        detectedPersonCount: 1,
        fullBodyVisible: true,
        standingPose: true,
        wellLit: true,
        occluded: false,
        poseAngle: "front",
      }).status,
    ).toBe("passed");
  });

  it("fails a body input when full body is missing", () => {
    expect(
      evaluateBodyInput({
        detectedPersonCount: 1,
        fullBodyVisible: false,
        standingPose: true,
        wellLit: true,
        occluded: false,
        poseAngle: "front",
      }).status,
    ).toBe("failed");
  });

  it("fails a body input with multiple people", () => {
    expect(
      evaluateBodyInput({
        detectedPersonCount: 2,
        fullBodyVisible: true,
        standingPose: true,
        wellLit: true,
        occluded: false,
        poseAngle: "front",
      }).status,
    ).toBe("failed");
  });

  it("warns for an angled but usable body pose", () => {
    const quality = evaluateBodyInput({
      detectedPersonCount: 1,
      fullBodyVisible: true,
      standingPose: true,
      wellLit: true,
      occluded: false,
      poseAngle: "side",
    });
    expect(quality.status).toBe("warning");
  });

  it("allows completion for passed and warning inputs only", () => {
    expect(canCompleteAvatarProfile({ status: "passed", reasons: [] }, { status: "warning", reasons: ["Usable."] })).toBe(true);
    expect(canCompleteAvatarProfile({ status: "failed", reasons: ["No face."] }, { status: "passed", reasons: [] })).toBe(false);
  });
});
