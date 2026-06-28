import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Her istekte Supabase oturum çerezini tazeler ve oturumu olmayan
 * kullanıcıları korumalı rotalardan /login'e yönlendirir.
 * Next 16'da bu mantık `proxy.ts` (eski adıyla middleware) içinden çağrılır.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase henüz yapılandırılmadıysa korumayı atla (örn. ilk kurulum).
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/davet");
  const isPublic = path === "/" || isAuthRoute;

  // Giriş yapmamış kullanıcı korumalı sayfada → login
  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Giriş yapmış kullanıcı login sayfasında → panele
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/panel";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
