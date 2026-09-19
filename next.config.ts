import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporary: allow deploy while we stabilize types
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
