// /pages/sitemap.xml.js
import { getPosts } from '../services/db'; // Adjust the import path

export default function Sitemap() {
  return null;
}

export async function getServerSideProps({ res }) {
  if (!res) return { props: {} };
  
  try {
    // Get published posts
    const posts = await getPosts();
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bigyann.com.np';
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
    
    posts.forEach(post => {
      const slug = post.slug || post.id;
      const lastmod = post.updatedAt || post.createdAt || post.date || new Date().toISOString();
      
      xml += `
  <url>
    <loc>${baseUrl}/blog/${slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
    
    xml += '\n</urlset>';
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.write(xml);
    res.end();
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: error.message });
  }
  
  return { props: {} };
}