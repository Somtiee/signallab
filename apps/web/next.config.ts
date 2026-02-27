import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@signallab/sdk'],
  reactCompiler: true,
};

export default nextConfig;
