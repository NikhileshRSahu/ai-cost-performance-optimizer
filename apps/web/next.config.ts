import type { NextConfig } from 'next';

type WebpackConfig = { resolve?: { extensionAlias?: Record<string,string[]> } };

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  webpack(config: WebpackConfig) {
    const resolve=config.resolve ?? {};
    resolve.extensionAlias={...resolve.extensionAlias,'.js':['.ts','.js']};
    config.resolve=resolve;
    return config;
  },
};
export default nextConfig;
