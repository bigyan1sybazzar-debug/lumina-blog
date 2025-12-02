// /api/generate-sitemap.js
import { kv } from '@vercel/kv'; // If using Vercel KV
// OR use fetch to your Firebase
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    console.log('Generating sitemap...');
    
    // Method 1: Fetch from your Firebase Firestore
    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    
    // Get published posts from Firebase REST API
    const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts?key=${firebaseApiKey}`;
    
    const response = await fetch(firebaseUrl);
    const data = await response.json();
    
    // Filter published posts
    const publishedPosts = data.documents?.filter(doc => {
      const fields = doc.fields;
      return fields?.status?.stringValue === 'published';
    }) || [];
    
    // Process posts
    const posts = publishedPosts.map(doc => {
      const fields = doc.fields;
      return {
        slug: fields?.slug?.stringValue || doc.name.split('/').pop(),
        updatedAt: fields?.updatedAt?.stringValue || fields?.createdAt?.stringValue || new Date().toISOString(),
      };
    });
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'https://bigyann.com.np';
    
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
      xml += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
    
    xml += '\n</urlset>';
    
    // Save to Vercel KV if available
    try {
      if (process.env.KV_REST_API_URL) {
        await kv.set('sitemap-xml', xml);
        console.log('Sitemap saved to Vercel KV');
      }
    } catch (kvError) {
      console.log('KV not available:', kvError);
    }
    
    // Return both JSON and XML
    if (req.headers['accept']?.includes('application/xml')) {
      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } else {
      res.status(200).json({
        message: 'Sitemap generated successfully',
        sitemapUrl: `${baseUrl}/sitemap.xml`,
        xml: xml,
        postCount: posts.length,
        generatedAt: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ 
      error: error.message || 'Unknown error',
      note: 'Make sure Firebase environment variables are set'
    });
  }
}