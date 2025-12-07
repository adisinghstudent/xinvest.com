import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['wagmi', '@rainbow-me/rainbowkit'],
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.alias = {
      ...config.resolve.alias,
      'porto': false,
      '@metamask/sdk': false,
      '@safe-global/safe-apps-sdk': false,
    };
    return config;
  },
};

export default nextConfig;
