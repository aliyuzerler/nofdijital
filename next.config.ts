import type { NextConfig } from "next";

/** Güvenlik başlıkları (Faz 7-Ön). CSP report-only — dev uyumluluğu için kısıtlı değil. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // Blog kaldırıldı (14.11.2026) → eski /blog adresleri Basında Biz'e yönlenir.
  async redirects() {
    return [
      { source: "/blog", destination: "/basinda-biz", permanent: true },
      { source: "/blog/:path*", destination: "/basinda-biz", permanent: true },
    ];
  },
  // PGlite WASM ve auth SDK'sı bundle edilemez; runtime'da native require edilir.
  serverExternalPackages: ["@electric-sql/pglite", "better-auth", "postgres"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
