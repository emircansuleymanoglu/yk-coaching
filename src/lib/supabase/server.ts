import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Sunucu (server component / server action / route handler) tarafında
 * kullanılacak Supabase istemcisi. Next 16'da `cookies()` async'tir.
 */
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
            // Server Component içinden çağrıldığında `set` engellenebilir;
            // oturum yenileme proxy.ts üzerinden yapıldığı için sorun değil.
          }
        },
      },
    },
  );
}

/**
 * Service-role anahtarıyla yetkili istemci — yalnızca güvenli sunucu
 * işlemlerinde (örn. koçun yeni danışan hesabı oluşturması) kullanılır.
 * RLS'i bypass eder, asla client'a sızdırılmamalıdır.
 */
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
