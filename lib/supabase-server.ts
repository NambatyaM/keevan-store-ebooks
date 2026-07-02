import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";

const pendingCookiesMap = new WeakMap<
  NextRequest,
  { name: string; value: string; options?: Record<string, unknown> }[]
>();

export function createServerSupabaseClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase public environment variables are missing.");

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookiesMap.set(request, cookiesToSet.map(({ name, value, options }) => ({ name, value, options })));
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
      }
    }
  });
}

export async function applyPendingCookies(request: NextRequest, response: Response): Promise<Response> {
  const toSet = pendingCookiesMap.get(request);
  if (!toSet || toSet.length === 0) return response;

  pendingCookiesMap.delete(request);

  for (const { name, value, options } of toSet) {
    const maxAge = (options?.maxAge as number) ?? 60 * 60 * 24 * 365;
    const path = (options?.path as string) ?? "/";
    const secure = options?.secure !== false;
    const sameSite = (options?.sameSite as string) ?? "lax";
    response.headers.append(
      "Set-Cookie",
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; SameSite=${sameSite}${secure ? "; Secure" : ""}${options?.httpOnly ? "; HttpOnly" : ""}`
    );
  }

  return response;
}
