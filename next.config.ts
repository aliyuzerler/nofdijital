import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // PGlite WASM ve auth SDK'sı bundle edilemez; runtime'da native require edilir.
  serverExternalPackages: ["@electric-sql/pglite", "better-auth", "postgres"],
};

export default nextConfig;
