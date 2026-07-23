import { createClient } from "@supabase/supabase-js";

// Admin klijent sa service_role ključem — ZAOBILAZI RLS.
// Koristi ISKLJUČIVO u server kodu bez korisničke sesije (npr. cron), NIKAD na klijentu.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
