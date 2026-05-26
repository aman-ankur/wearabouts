import type { RuntimeMode } from "@/src/domain/runtime";

export const runtimeModeOverrideStorageKey = "wearabouts_runtime_mode_override";

function getConfiguredRuntimeMode(): RuntimeMode {
  const value = process.env.NEXT_PUBLIC_TRAVOGUE_MODE;

  if (value === "real") {
    return "real";
  }

  return "demo";
}

export function resolveRuntimeMode(configuredMode: RuntimeMode, overrideValue: string | null): RuntimeMode {
  if (overrideValue === "dev") {
    return "dev";
  }

  if (overrideValue === "demo" || overrideValue === "real") {
    return overrideValue;
  }

  return configuredMode;
}

export function getRuntimeMode(): RuntimeMode {
  const configuredMode = getConfiguredRuntimeMode();
  if (typeof window === "undefined") {
    return configuredMode;
  }

  return resolveRuntimeMode(configuredMode, window.localStorage.getItem(runtimeModeOverrideStorageKey));
}

export function setRuntimeModeOverride(mode: RuntimeMode | null): RuntimeMode {
  if (typeof window === "undefined") {
    return getConfiguredRuntimeMode();
  }

  if (mode) {
    window.localStorage.setItem(runtimeModeOverrideStorageKey, mode);
  } else {
    window.localStorage.removeItem(runtimeModeOverrideStorageKey);
  }

  return getRuntimeMode();
}

export function getRuntimeModeLabel(mode: RuntimeMode): string {
  if (mode === "dev") {
    return "Dev Mode";
  }

  return mode === "demo" ? "Demo Mode" : "Real Mode";
}
