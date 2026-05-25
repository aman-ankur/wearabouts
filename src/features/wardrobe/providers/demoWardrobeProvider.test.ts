import { describe, expect, it } from "vitest";
import { createDemoWardrobeProvider } from "./demoWardrobeProvider";

describe("createDemoWardrobeProvider", () => {
  it("creates a demo upload batch with detected garments", async () => {
    const provider = createDemoWardrobeProvider();

    const batch = await provider.createUploadBatch({ sourceType: "batch_upload" });

    expect(batch.id).toBe("batch-demo-upload");
    expect(batch.detectedGarments).toHaveLength(3);
    expect(batch.detectedGarments[0]?.proposedName).toBe("Brown Hooded Zip Jacket");
  });

  it("returns a retry variant for a detected garment", async () => {
    const provider = createDemoWardrobeProvider();
    const batch = await provider.createUploadBatch({ sourceType: "batch_upload" });

    const retried = await provider.retryDetectedGarment(batch.id, "detected-brown-jacket");

    expect(retried.detectedGarments[0]?.proposedName).toBe("Tan Technical Hooded Jacket");
  });
});
