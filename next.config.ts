import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Treat pdf-parse as a server-only external package so it isn't
  // bundled by the App Router edge bundler (it requires Node.js APIs).
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
