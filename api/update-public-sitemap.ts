// api/update-public-sitemap.ts
import { put } from '@vercel/blob';
import { writeFileSync } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  // Only allow POST from your admin (same secret)
  if (req.method !== 'POST') return res.status(405).end();
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${process.env.SITEMAP_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch the latest sitemap from Vercel Blob
    const blobUrl = 'https://ulganzkpfwuuglxj.public.blob.vercel-storage.com/sitemap.xml';
    const response = await fetch(blobUrl);
    if (!response.ok) throw new Error('Failed to fetch sitemap from Blob');

    const xmlContent = await response.text();

    // 2. Write it to public/sitemap.xml (Vercel allows this during build/deploy)
    // This path works in Vercel serverless functions
    const publicPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    writeFileSync(publicPath, xmlContent, 'utf-8');

    // Optional: Also re-upload with overwrite (in case someone visits the Blob directly)
    await put('sitemap.xml', xmlContent, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/xml',
      allowOverwrite: true,
    });

    res.status(200).json({
      success: true,
      message: 'public/sitemap.xml updated automatically!',
      url: 'https://bigyann.com.np/sitemap.xml',
    });
  } catch (error: any) {
    console.error('Auto-update failed:', error);
    res.status(500).json({ error: error.message });
  }
}