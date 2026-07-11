import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have TypeScript definitions
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  /* Allow mobile and other devices on local network to access dev server */
  allowedDevOrigins: [
    '192.168.1.6',      // Your specific mobile IP
    '192.168.1.0/24',   // Allow entire local network subnet
  ],
  // Empty turbopack config to silence warning
  turbopack: {},
};

const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !isProd, // Only enable PWA in production
  runtimeCaching: [], // Use default caching strategies
  buildExcludes: [/middleware-manifest\.json$/],
};

export default withPWA(pwaConfig)(nextConfig);
