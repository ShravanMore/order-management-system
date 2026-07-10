import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have TypeScript definitions
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* Allow mobile and other devices on local network to access dev server */
  allowedDevOrigins: [
    '192.168.1.6',      // Your specific mobile IP
    '192.168.1.0/24',   // Allow entire local network subnet
  ],
  // Empty turbopack config to silence warning
  turbopack: {},
  // Output standalone for deployment
  output: 'standalone',
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in dev mode
})(nextConfig);
