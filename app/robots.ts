import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/users', '/pengaturan', '/stok', '/riwayat', '/api/'],
      },
    ],
    sitemap: 'https://kopikala.my.id/sitemap.xml',
  };
}
