import { getRealWardrobeConfig } from "./realWardrobeConfig";
import { OpenAIPrettifyProvider } from "./openaiPrettifyProvider";
import { RealWardrobePipeline } from "./realWardrobePipeline";
import { SupabaseRealAssetStorage } from "./supabaseRealAssetStorage";
import { SupabaseRealWardrobeRepository } from "./supabaseRealWardrobeRepository";
import { createSupabaseServiceClient } from "./supabaseServerClient";

export function createRealWardrobeServices() {
  const config = getRealWardrobeConfig();
  const supabase = createSupabaseServiceClient();
  const repository = new SupabaseRealWardrobeRepository(supabase);
  const storage = new SupabaseRealAssetStorage(supabase);
  const ai = new OpenAIPrettifyProvider(
    config.openaiApiKey,
    config.openaiMetadataModel,
    config.openaiImageModel,
    config.openaiDetectionImage,
  );
  const pipeline = new RealWardrobePipeline({ repository, storage, ai });

  return { repository, pipeline };
}
