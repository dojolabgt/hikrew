import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  images: {
    // In dev, skip Next.js image optimization server (which blocks private IPs).
    // The browser loads the image directly. In production the API has a real hostname.
    unoptimized: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
