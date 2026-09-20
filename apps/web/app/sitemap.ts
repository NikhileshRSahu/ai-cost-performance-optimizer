import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evalomics.vercel.app';
  const routes = ['/', '/demo', '/trust', '/privacy', '/terms', '/security', '/support', '/subprocessors'];
  return routes.map((route) => ({
    url: new URL(route, base).toString(),
    lastModified: new Date('2026-09-20T00:00:00Z'),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.6,
  }));
}
