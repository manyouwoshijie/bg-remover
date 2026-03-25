import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Edge runtime optimization
  experimental: {
    // Allows building for Cloudflare Pages
  },
};

export default nextConfig;
