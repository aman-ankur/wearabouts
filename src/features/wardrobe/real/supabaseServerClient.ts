import { createClient } from "@supabase/supabase-js";
import { getRealWardrobeConfig } from "./realWardrobeConfig";

export function createSupabaseServiceClient() {
  const config = getRealWardrobeConfig();

  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
