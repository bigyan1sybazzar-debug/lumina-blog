// services/sitemapGenerator.ts (FULL CODE)

import { getPublishedPostSlugs } from './db'; 
// NOTE: This assumes 'getPublishedPostSlugs' is exported from services/db.ts

const BASE_URL = "https://bigyann.com.np"; 

export const generateSitemapXml = async (): Promise<string> => {
    
    // 1. Fetch Dynamic Posts Data
    const posts = await getPublishedPostSlugs();

    // 2. Define Static URLs
    const staticUrls = [
        { url: BASE_URL, priority: '1.0', changefreq: 'daily' },
        { url: `${BASE_URL}/About`, priority: '0.8', changefreq: 'monthly' },
        { url: `${BASE_URL}/Contact`, priority: '0.8', changefreq: 'monthly' },
        { url: `${BASE_URL}/Articles`, priority: '0.8', changefreq: 'weekly' },
        // Add other static pages based on your /pages directory
    ];
    
    const staticUrlsXml = staticUrls.map(url => `
        <url>
            <loc>${url.url}</loc>
            <lastmod>${new Date().toISOString().split('T')[0]}</lastmod> 
            <changefreq>${url.changefreq}</changefreq>
            <priority>${url.priority}</priority>
        </url>
    `).join('');

    // 3. Create XML entries for dynamic post URLs (Assumes posts are at /BlogPost/[slug])
    const postUrlsXml = posts.map(post => {
        const postUrl = `${BASE_URL}/BlogPost/${post.slug}`;
        const lastModDate = post.updatedAt 
            ? new Date(post.updatedAt).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];
        
        return `
            <url>
                <loc>${postUrl}</loc>
                <lastmod>${lastModDate}</lastmod> 
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
            </url>
        `;
    }).join('');

    // 4. Final XML Wrapper
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticUrlsXml}
    ${postUrlsXml}
</urlset>`;
};