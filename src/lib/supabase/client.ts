import { createBrowserClient } from "@supabase/ssr";

// Supabase klijent za browser (client komponente).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
