import type { UploadBatch } from "@/src/domain/wardrobe";
import { demoRetryVariants, demoUploadBatch } from "@/src/features/wardrobe/fixtures/demoWardrobe";
import type { CreateDemoUploadInput, WardrobeIngestionProvider } from "./contracts";

function cloneBatch(batch: UploadBatch): UploadBatch {
  return {
    ...batch,
    detectedGarments: batch.detectedGarments.map((garment) => ({
      ...garment,
      asset: { ...garment.asset },
    })),
  };
}

export function createDemoWardrobeProvider(): WardrobeIngestionProvider {
  let currentBatch = cloneBatch(demoUploadBatch);

  return {
    async createUploadBatch(input: CreateDemoUploadInput): Promise<UploadBatch> {
      currentBatch = {
        ...cloneBatch(demoUploadBatch),
        sourceType: input.sourceType,
      };

      return cloneBatch(currentBatch);
    },

    async retryDetectedGarment(batchId: string, detectedGarmentId: string): Promise<UploadBatch> {
      if (batchId !== currentBatch.id) {
        return cloneBatch(currentBatch);
      }

      currentBatch = {
        ...currentBatch,
        detectedGarments: currentBatch.detectedGarments.map((garment) => {
          if (garment.id !== detectedGarmentId || !garment.retryVariantId) {
            return garment;
          }

          const retryVariant = demoRetryVariants[garment.retryVariantId];
          return retryVariant ? { ...retryVariant, asset: { ...retryVariant.asset } } : garment;
        }),
      };

      return cloneBatch(currentBatch);
    },
  };
}
