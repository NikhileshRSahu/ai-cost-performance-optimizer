import type { NextConfig } from 'next';

type WebpackConfig = { resolve?: { extensionAlias?: Record<string,string[]> } };

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  webpack(config: WebpackConfig) {
    const resolve=config.resolve ?? {};
    resolve.extensionAlias={...resolve.extensionAlias,'.js':['.ts','.js']};
    config.resolve=resolve;
    return config;
  },
};
export default nextConfig;
