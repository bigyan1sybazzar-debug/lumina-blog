// /api/generate-sitemap.js
import { put } from '@vercel/blob';
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Check for secret token
    if (req.query.secret !== process.env.REVALIDATE_SECRET) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('Generating sitemap...');
    
    // Fetch your posts from database or API
    const posts = await fetchPosts(); // Implement this
    
    const baseUrl = 'https://bigyann.com.np';
    
    // Generate XML content
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
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/admin</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;
    
    // Add posts dynamically
    posts.forEach(post => {
      const slug = post.slug || post.id;
      const lastmod = post.updatedAt || post.createdAt || new Date().toISOString();
      
      xml += `
  <url>
    <loc>${baseUrl}/blog/${slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
    
    xml += '\n</urlset>';
    
    // Upload to Vercel Blob Storage
    const blob = await put('sitemap.xml', xml, {
      access: 'public',
      contentType: 'application/xml',
      addRandomSuffix: false // Keep the name as sitemap.xml
    });
    
    console.log('Sitemap uploaded to:', blob.url);
    
    return res.status(200).json({
      success: true,
      message: 'Sitemap generated and uploaded successfully',
      sitemapUrl: blob.url,
      postsCount: posts.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to generate sitemap',
      error: error.message 
    });
  }
}

// Function to fetch posts - adjust based on your data source
async function fetchPosts() {
  try {
    // Example: Fetch from your database or API
    const response = await fetch('https://your-api.com/api/posts');
    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}