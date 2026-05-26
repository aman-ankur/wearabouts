export const REAL_HOUSEHOLD_ID = "demo-household";
export const REAL_PROFILE_ID = "profile-aankur";

export interface RealWardrobeConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  openaiApiKey: string;
  openaiMetadataModel: string;
  openaiImageModel: string;
}

export function getRealWardrobeConfig(): RealWardrobeConfig {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey || !openaiApiKey) {
    throw new Error("Real mode requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY.");
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    openaiApiKey,
    openaiMetadataModel: process.env.OPENAI_METADATA_MODEL ?? "gpt-5.4",
    openaiImageModel: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5",
  };
}
