import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Suppress irrelevant node.js api warnings in edge runtime
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
