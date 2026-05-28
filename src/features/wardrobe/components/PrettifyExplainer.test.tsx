import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PrettifyExplainer } from "./PrettifyExplainer";

describe("PrettifyExplainer", () => {
  it("uses Wardrobe Prep language in user-facing copy", () => {
    const html = renderToStaticMarkup(<PrettifyExplainer />);

    expect(html).toContain("Wardrobe Prep is on");
    expect(html).toContain("prepares clothing photos");
    expect(html).not.toContain("Auto-Prettify");
    expect(html).not.toContain("prettify");
  });
});
