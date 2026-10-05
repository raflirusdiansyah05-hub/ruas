import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (err) {
    // Jika koneksi ke Supabase belum terhubung / konfigurasi dummy
    user = null;
  }

  const path = request.nextUrl.pathname;

  // Cek apakah Supabase URL adalah dummy offline
  const isDummyEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy-ruas");

  // Jika di mode peninjauan lokal offline (dummy env), izinkan akses langsung ke semua dashboard untuk inspeksi UI & alur
  if (isDummyEnv) {
    return response;
  }

  // Rute Publik yang tidak memerlukan login
  const isPublicRoute =
    path === "/" ||
    path.startsWith("/statistik") ||
    path.startsWith("/login") ||
    path.startsWith("/sign-up") ||
    path.startsWith("/verify-otp") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/set-password") || // Aktivasi petugas dari link
    path.startsWith("/privacy-policy") ||
    path.startsWith("/terms") ||
    path.startsWith("/api/auth/verify-nip");

  const createRedirectResponse = (targetUrl: URL | string) => {
    const redirectRes = NextResponse.redirect(targetUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectRes;
  };

  // Jika belum login dan mencoba mengakses rute terproteksi (khusus rute halaman UI, bukan API)
  if (!user && !isPublicRoute && !path.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", path);
    return createRedirectResponse(url);
  }

  // Jika sudah login, ambil role dari profiles
  if (user) {
    // Prioritaskan role dari JWT user_metadata untuk mencegah query database 'profiles' pada setiap navigasi internal
    let role = (user.user_metadata?.role as string) || null;

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();
      role = profile?.role || "pelapor";
    }

    // Role-based protection: hanya tendang jika role terdefinisi dan tidak cocok
    if (path.startsWith("/admin") && role !== "admin") {
      return createRedirectResponse(new URL("/", request.url));
    }

    if (path.startsWith("/petugas") && role !== "petugas") {
      return createRedirectResponse(new URL("/", request.url));
    }

    if (path.startsWith("/pelapor") && role !== "pelapor") {
      return createRedirectResponse(new URL("/", request.url));
    }
  }

  return response;
}
