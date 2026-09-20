import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evalomics.vercel.app';
  return {
    rules: [
      { userAgent: '*', allow: ['/', '/demo', '/trust', '/privacy', '/terms', '/security', '/support'], disallow: ['/dashboard', '/onboarding', '/api/'] },
    ],
    sitemap: new URL('/sitemap.xml', base).toString(),
    host: base,
  };
}
