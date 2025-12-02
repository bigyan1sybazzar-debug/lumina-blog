// pages/sitemap.xml.js   ← must be this exact path and filename

import { getPosts } from '../services/db';

export default function Sitemap() {
  return null; // This page never renders HTML
}

export const getServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

  const baseUrl = 'https://bigyann.com.np';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

  try {
    const posts = await getPosts(); // ← This pulls only published posts from Firestore

    posts.forEach(post => {
      const slug = post.slug || post.id;
      const lastmod = post.updatedAt || post.createdAt || new Date().toISOString();

      xml += `
  <url>
    <loc>${baseUrl}/blog/${slug}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    xml += '\n</urlset>';

    res.write(xml);
    res.end();
  } catch (error) {
    console.error('Sitemap generation failed:', error);
    // Fallback so it never breaks
    res.write(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc></url>
</urlset>`);
    res.end();
  }

  return { props: {} };
};