/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized Docker builds
  output: "standalone",

  // Optimize images (if using next/image)
  images: {
    unoptimized: process.env.NODE_ENV === "production",
  },

  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["wagmi", "viem", "@tanstack/react-query"],
  },

  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_RPC_URL:
      process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
  },

  // Empty turbopack config to silence warning (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
