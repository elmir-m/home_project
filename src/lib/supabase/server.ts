import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase klijent za server (server komponente, server actions, route handlers).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Poziv iz server komponente — middleware osvježava sesiju, pa je ok ignorisati.
          }
        },
      },
    },
  );
}
