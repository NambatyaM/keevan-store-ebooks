import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const ROLE_PATHS: Record<string, string[]> = {
  admin: ["/admin"],
  creator: ["/creator"],
  buyer: ["/buyer"],
};

const DASHBOARD_ROUTES: Record<string, string> = {
  admin: "/admin/dashboard",
  creator: "/creator/dashboard",
  buyer: "/buyer/dashboard",
};

function createSupabaseClient(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("[Middleware] SUPABASE_SERVICE_ROLE_KEY is missing — role checks disabled, protected routes will redirect to login");
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getUserRole(request: NextRequest, response: NextResponse): Promise<string | null> {
  try {
    const supabase = createSupabaseClient(request, response);
    if (!supabase) {
      console.warn("[Middleware] Supabase client creation failed — role lookup skipped");
      return null;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const adminClient = createAdminClient();
    if (!adminClient) return null;

    const { data: user } = await adminClient
      .from("users")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    return user?.role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  if (hostname === "www.keevanstore.in") {
    const url = new URL(request.url);
    url.hostname = "keevanstore.in";
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const role = await getUserRole(request, response);

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedPrefixes = ROLE_PATHS[role];
  if (!allowedPrefixes || !allowedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const target = DASHBOARD_ROUTES[role] ?? "/login";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/creator/:path*", "/admin/:path*", "/buyer/:path*"],
};
