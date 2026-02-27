import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@signallab/sdk'],
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
