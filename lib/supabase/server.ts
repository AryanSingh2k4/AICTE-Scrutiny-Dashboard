import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jowtilmwhyasyxuflwli.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvd3RpbG13aHlhc3l4dWZsd2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTM3NzQsImV4cCI6MjEwODY2OTc3NH0.5IwyT716WKc-xtgemDp294AgF1nbMk-jDDPpxigcK7A";

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
