import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { UploadPhotoInput } from "./UploadPhotoInput";

describe("UploadPhotoInput", () => {
  it("offers separate library and camera inputs before processing the selected photo", () => {
    const html = renderToStaticMarkup(<UploadPhotoInput selectedFileName={null} onFileChange={vi.fn()} />);

    expect(html).toContain("Choose from library");
    expect(html).toContain("Take photo");
    expect(html).toContain('capture="environment"');
    expect(html).toContain("JPG, PNG, or WebP under 10MB");
  });
});
