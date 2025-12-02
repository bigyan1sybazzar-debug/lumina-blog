// /api/sitemap.xml.js
import { get } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    // Fetch the sitemap from Vercel Blob Storage
    const blob = await get('sitemap.xml');
    
    // Set proper headers for XML
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    // Send the XML content
    res.status(200).send(blob);
    
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    
    // Fallback to basic sitemap if blob doesn't exist
    const baseUrl = 'https://bigyann.com.np';
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(fallbackXml);
  }
}