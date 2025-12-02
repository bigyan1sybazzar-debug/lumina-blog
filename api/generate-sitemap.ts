import admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('Generating sitemap...');
    
    const snapshot = await db.collection('posts')
      .where('status', '==', 'published')
      .get();
    
    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        slug: data.slug || doc.id,
        updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
      };
    });
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lumina-blog.web.app';
    
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
    
    // Set headers for XML response
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
}
