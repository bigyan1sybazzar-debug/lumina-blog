// pages/sitemap.xml.js
import { getPosts } from '../services/db'; // ← change this line to match how you actually get posts

export default function Sitemap() {
  return null;
}

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

  try {
    const posts = await getPosts(); // ← make sure this returns your real posts
    const baseUrl = 'https://bigyann.com.np';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    posts.forEach(post => {
      const slug = post.slug || post.id;
      const date = post.updatedAt || post.createdAt || new Date();
      xml += `
  <url>
    <loc>${baseUrl}/blog/${slug}</loc>
    <lastmod>${new Date(date).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    xml += '\n</urlset>';

    res.write(xml);
    res.end();
  } catch (error) {
    console.error('Sitemap error:', error);
    res.statusCode = 500;
    res.write('<!-- Sitemap generation failed -->');
    res.end();
  }

  return { props: {} };
}