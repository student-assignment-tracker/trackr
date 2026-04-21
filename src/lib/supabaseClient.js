import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.qnivudxhebzkuwqooczv;
const supabaseAnonKey = import.meta.env.sb_publishable_uzt4rPopPuM0cyxonbh_LA_JxxoofQF;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);
