import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

function markPrivate(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("CDN-Cache-Control", "private, no-store");
  response.headers.set("Vary", "Cookie");
  return response;
}

export async function updateSession(request: NextRequest) {
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const env = getPublicSupabaseEnv();
  if (!env) {
    const response = NextResponse.next({ request });
    return isAdminPath ? markPrivate(response) : response;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // No agregar lógica entre createServerClient y getClaims.
  try {
    await supabase.auth.getClaims();
  } catch {
    return isAdminPath ? markPrivate(supabaseResponse) : supabaseResponse;
  }

  return isAdminPath ? markPrivate(supabaseResponse) : supabaseResponse;
}
