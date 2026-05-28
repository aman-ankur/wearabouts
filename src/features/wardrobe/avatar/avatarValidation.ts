import type { AvatarInputQualityCheck } from "./avatarTypes";

export interface AvatarFaceValidationFacts {
  detectedFaceCount: number;
  faceVisible: boolean;
  sharp: boolean;
  wellLit: boolean;
  occluded: boolean;
}

export interface AvatarBodyValidationFacts {
  detectedPersonCount: number;
  fullBodyVisible: boolean;
  standingPose: boolean;
  wellLit: boolean;
  occluded: boolean;
  poseAngle: "front" | "three-quarter" | "side";
}

function hasPassingStatus(quality: AvatarInputQualityCheck): boolean {
  return quality.status === "passed" || quality.status === "warning";
}

export function evaluateFaceInput(facts: AvatarFaceValidationFacts): AvatarInputQualityCheck {
  const failures: string[] = [];
  const warnings: string[] = [];

  if (facts.detectedFaceCount !== 1 || !facts.faceVisible) {
    failures.push("Use a photo with one clearly visible face.");
  }

  if (facts.occluded) {
    failures.push("Avoid sunglasses, masks, or heavy obstruction.");
  }

  if (!facts.sharp) {
    warnings.push("A sharper face photo will improve likeness.");
  }

  if (!facts.wellLit) {
    warnings.push("Better lighting will improve likeness.");
  }

  return {
    status: failures.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    reasons: failures.length > 0 ? failures : warnings,
    detectedPersonCount: facts.detectedFaceCount,
    faceVisible: facts.faceVisible,
  };
}

export function evaluateBodyInput(facts: AvatarBodyValidationFacts): AvatarInputQualityCheck {
  const failures: string[] = [];
  const warnings: string[] = [];

  if (facts.detectedPersonCount !== 1) {
    failures.push("Use a body photo with exactly one person.");
  }

  if (!facts.fullBodyVisible) {
    failures.push("Use a head-to-toe body photo with head and shoes visible.");
  }

  if (!facts.standingPose) {
    failures.push("Use a standing pose rather than seated or crouched.");
  }

  if (facts.occluded) {
    failures.push("Avoid bags, coats, or objects blocking body shape.");
  }

  if (!facts.wellLit) {
    warnings.push("Better lighting will improve body proportion matching.");
  }

  if (facts.poseAngle === "side") {
    warnings.push("A front or slight three-quarter pose will work better.");
  }

  return {
    status: failures.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    reasons: failures.length > 0 ? failures : warnings,
    detectedPersonCount: facts.detectedPersonCount,
    fullBodyVisible: facts.fullBodyVisible,
  };
}

export function canCompleteAvatarProfile(face: AvatarInputQualityCheck, body: AvatarInputQualityCheck): boolean {
  return hasPassingStatus(face) && hasPassingStatus(body);
}
