import type { NextConfig } from 'next';

type WebpackConfig = { resolve?: { extensionAlias?: Record<string,string[]> } };

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "connect-src 'self' https://vitals.vercel-insights.com",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
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
  async rewrites() {
    return {
      beforeFiles: [{ source: '/', destination: '/evalomics-final.html' }],
      afterFiles: [],
      fallback: [],
    };
  },
  webpack(config: WebpackConfig) {
    const resolve=config.resolve ?? {};
    resolve.extensionAlias={...resolve.extensionAlias,'.js':['.ts','.js']};
    config.resolve=resolve;
    return config;
  },
};
export default nextConfig;
