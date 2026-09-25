const ALLOWED_ADMIN_PATHS = new Set(["/admin", "/admin/nueva-contrasena"]);

export function safeAdminPath(input: string | null | undefined) {
  if (!input || !input.startsWith("/") || input.startsWith("//") || input.includes("\\")) {
    return null;
  }

  try {
    const url = new URL(input, "http://internal.local");
    if (url.origin !== "http://internal.local" || url.username || url.password) {
      return null;
    }
    if (!ALLOWED_ADMIN_PATHS.has(url.pathname)) {
      return null;
    }
    return url.pathname;
  } catch {
    return null;
  }
}
