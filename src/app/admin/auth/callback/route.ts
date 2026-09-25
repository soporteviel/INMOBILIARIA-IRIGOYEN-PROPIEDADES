import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeAdminPath } from "@/lib/auth/redirects";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const OTP_TYPES = new Set<EmailOtpType>(["invite", "recovery"]);

function privateRedirect(request: NextRequest, pathname: string) {
  const response = NextResponse.redirect(new URL(pathname, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Cookie");
  return response;
}

export async function GET(request: NextRequest) {
  const nextPath = safeAdminPath(request.nextUrl.searchParams.get("next")) ?? "/admin/nueva-contrasena";
  const env = getPublicSupabaseEnv();
  if (!env) {
    return privateRedirect(request, "/admin/login?error=config");
  }

  const response = privateRedirect(request, nextPath);
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        response.headers.set("Cache-Control", "private, no-store");
        response.headers.set("Vary", "Cookie");
      },
    },
  });

  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? privateRedirect(request, "/admin/auth/error") : response;
  }

  if (tokenHash && type && OTP_TYPES.has(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    return error ? privateRedirect(request, "/admin/auth/error") : response;
  }

  return privateRedirect(request, "/admin/auth/error");
}
