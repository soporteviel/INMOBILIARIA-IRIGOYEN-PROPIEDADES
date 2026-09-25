import type { NextConfig } from "next";

const privateAdminHeaders = [
  { key: "Cache-Control", value: "private, no-store" },
  { key: "CDN-Cache-Control", value: "private, no-store" },
  { key: "Vary", value: "Cookie" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/admin", headers: privateAdminHeaders },
      { source: "/admin/:path*", headers: privateAdminHeaders },
    ];
  },
};

export default nextConfig;
