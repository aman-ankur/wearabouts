import { describe, expect, it } from "vitest";
import { resolveRuntimeMode } from "./runtimeMode";

describe("resolveRuntimeMode", () => {
  it("uses the configured real mode when no browser override is set", () => {
    expect(resolveRuntimeMode("real", null)).toBe("real");
  });

  it("uses dev mode when the browser override requests cached development mode", () => {
    expect(resolveRuntimeMode("real", "dev")).toBe("dev");
  });

  it("ignores unsupported browser override values", () => {
    expect(resolveRuntimeMode("real", "staging")).toBe("real");
  });
});
