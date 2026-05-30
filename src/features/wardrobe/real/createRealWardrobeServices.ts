import { getRealWardrobeConfig } from "./realWardrobeConfig";
import type { RealWardrobeOwner } from "./realWardrobeConfig";
import { OpenAIPrettifyProvider } from "./openaiPrettifyProvider";
import { RealWardrobePipeline } from "./realWardrobePipeline";
import { SupabaseRealAssetStorage } from "./supabaseRealAssetStorage";
import { SupabaseRealWardrobeRepository } from "./supabaseRealWardrobeRepository";
import { createSupabaseServiceClient } from "./supabaseServerClient";

export function createRealWardrobeServices(owner: RealWardrobeOwner) {
  const config = getRealWardrobeConfig();
  const supabase = createSupabaseServiceClient();
  const repository = new SupabaseRealWardrobeRepository(supabase, owner);
  const storage = new SupabaseRealAssetStorage(supabase, owner);
  const ai = new OpenAIPrettifyProvider(
    config.openaiApiKey,
    config.openaiMetadataModel,
    config.openaiImageModel,
    config.openaiDetectionImage,
    config.openaiPrettifyImage,
    config.openaiPrettifyImageQuality,
  );
  const pipeline = new RealWardrobePipeline({ repository, storage, ai });

  return { repository, pipeline };
}
