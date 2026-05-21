import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Treat pdf-parse as a server-only external package so it isn't
  // bundled by the App Router edge bundler (it requires Node.js APIs).
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
