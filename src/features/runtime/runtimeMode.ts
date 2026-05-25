import type { RuntimeMode } from "@/src/domain/runtime";

export function getRuntimeMode(): RuntimeMode {
  const value = process.env.NEXT_PUBLIC_TRAVOGUE_MODE;

  if (value === "real") {
    return "real";
  }

  return "demo";
}

export function getRuntimeModeLabel(mode: RuntimeMode): string {
  return mode === "demo" ? "Demo Mode" : "Real Mode";
}
