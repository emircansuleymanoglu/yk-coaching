import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

// Next.js 16: Middleware artık "Proxy" olarak adlandırılıyor.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // statik dosyalar ve görseller dışındaki tüm rotalarda çalışır
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
