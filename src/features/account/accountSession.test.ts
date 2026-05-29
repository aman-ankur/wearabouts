import { describe, expect, it } from "vitest";
import { getBearerTokenFromAuthorizationHeader } from "./accountSession";

describe("accountSession", () => {
  it("returns the bearer token from an authorization header", () => {
    expect(getBearerTokenFromAuthorizationHeader("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("trims extra whitespace around the bearer token", () => {
    expect(getBearerTokenFromAuthorizationHeader("Bearer   token-value   ")).toBe("token-value");
  });

  it("returns null for missing or non-bearer headers", () => {
    expect(getBearerTokenFromAuthorizationHeader(null)).toBeNull();
    expect(getBearerTokenFromAuthorizationHeader("Basic abc")).toBeNull();
    expect(getBearerTokenFromAuthorizationHeader("Bearer ")).toBeNull();
  });
});
