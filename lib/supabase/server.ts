import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

export function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").split(/[\r\n]+/)[0].trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").split(/[\r\n]+/)[0].trim();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ditangani bila dipanggil dari Server Component murni
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Ditangani bila dipanggil dari Server Component murni
          }
        },
      },
    }
  );
}

// Service Role Client (HANYA UNTUK SERVER-SIDE / ROUTE HANDLER SENSITIF)
export function createAdminClient() {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
  }
  const serviceRoleKey = rawKey.split(/[\r\n]+/)[0].trim();
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").split(/[\r\n]+/)[0].trim();

  return createSupabaseClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
