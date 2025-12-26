import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/login', '/signup', '/api/'],
        },
        sitemap: 'https://bigyann.com.np/sitemap.xml',
    };
}
