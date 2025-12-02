import { put } from '@vercel/blob';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const secret = req.query.secret;
    
    // Check secret - make sure this matches your .env
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    // Your sitemap generation logic here
    const baseUrl = 'https://bigyann.com.np';
    
    // Example XML - replace with your actual posts
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    // Upload to Vercel Blob
    const blob = await put('sitemap.xml', xmlContent, {
      access: 'public',
      contentType: 'application/xml',
    });

    return res.status(200).json({
      success: true,
      message: 'Sitemap generated',
      sitemapUrl: blob.url,
      postsCount: 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
}