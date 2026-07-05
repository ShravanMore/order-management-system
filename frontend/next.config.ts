import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Allow mobile and other devices on local network to access dev server */
  allowedDevOrigins: [
    '192.168.1.6',      // Your specific mobile IP
    '192.168.1.0/24',   // Allow entire local network subnet
  ],
};

export default nextConfig;
