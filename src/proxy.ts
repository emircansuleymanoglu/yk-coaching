import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

// Next.js 16: Middleware artık "Proxy" olarak adlandırılıyor.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // API rotaları (cron, webhook'lar), statik dosyalar ve görseller hariç tüm rotalarda çalışır
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
