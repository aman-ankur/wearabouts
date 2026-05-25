import type { UploadBatch, UploadSourceType } from "@/src/domain/wardrobe";

export interface CreateDemoUploadInput {
  sourceType: UploadSourceType;
}

export interface WardrobeIngestionProvider {
  createUploadBatch(input: CreateDemoUploadInput): Promise<UploadBatch>;
  retryDetectedGarment(batchId: string, detectedGarmentId: string): Promise<UploadBatch>;
}
