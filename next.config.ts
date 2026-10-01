import type { NextConfig } from "next";

const privateAdminHeaders = [
  { key: "Cache-Control", value: "private, no-store" },
  { key: "CDN-Cache-Control", value: "private, no-store" },
  { key: "Vary", value: "Cookie" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  images: {
    // El optimizador no conserva una foto pausada más que este lapso.
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      { source: "/admin", headers: privateAdminHeaders },
      { source: "/admin/:path*", headers: privateAdminHeaders },
    ];
  },
};

export default nextConfig;
