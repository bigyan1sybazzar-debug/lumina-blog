import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
// 1. Import the new function from your existing db.ts file
import { getPublishedPostSlugs } from '../services/db'; 

// IMPORTANT: Replace with your actual deployed domain
const HOSTNAME = 'https://bigyann.com.np'; 

// 2. DEFINE TYPE: Fixes the TS7006 implicit 'any' error for the mapped post data
type PostSlugData = {
    slug: string; 
    updatedAt?: any; // Retained 'any' for the Firestore Timestamp object
};

// Function to handle the Vercel/Node.js request and response
export default async function Sitemap(req: any, res: any) {
  try {
    // 1. Define Static Links
    const staticLinks = [
      { url: '/', changefreq: 'weekly', priority: 1.0 },
      { url: '/About', changefreq: 'monthly', priority: 0.8 },
      { url: '/Contact', changefreq: 'monthly', priority: 0.8 },
      // Add other static pages here
    ];

    // 2. Fetch Dynamic Blog Post Links using the new function
    // This executes the Firestore query defined in db.ts
    const posts = await getPublishedPostSlugs();
    
    // 3. Map the retrieved data into sitemap format
    const dynamicLinks = posts.map((post: PostSlugData) => { 
      // NOTE: Ensure '/BlogPost/' matches your application's route structure
      const postUrl = `/BlogPost/${post.slug}`;
      
      let lastModified = new Date().toISOString();
      
      // Safely handle Firestore Timestamp conversion
      if (post.updatedAt && post.updatedAt.toDate) {
          lastModified = post.updatedAt.toDate().toISOString();
      } else if (typeof post.updatedAt === 'string') {
          lastModified = post.updatedAt;
      }

      return {
        url: postUrl, 
        changefreq: 'daily',
        priority: 0.9,
        lastModified: lastModified,
      };
    });

    const links = staticLinks.concat(dynamicLinks);

    // 4. Generate the XML Stream
    const smStream = new SitemapStream({ hostname: HOSTNAME });
    const sitemap = await streamToPromise(Readable.from(links).pipe(smStream));

    // 5. Send the XML Response
    res.setHeader('Content-Type', 'text/xml');
    // Set caching headers to reduce Firestore reads (optional but recommended)
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=43200'); 
    res.status(200).send(sitemap.toString());

  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Send a 500 status on failure, not a 404 (which indicates routing failure)
    res.status(500).end('Internal Server Error: Failed to generate sitemap.');
  }
}