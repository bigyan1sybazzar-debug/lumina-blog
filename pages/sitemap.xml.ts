import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
// 1. Import the new function from your existing db.ts file
// After (in api/sitemap.ts)
import { getPublishedPostSlugs } from '../services/db';
// IMPORTANT: Replace with your actual deployed domain
const HOSTNAME = 'https://www.lumina-blog-app.com'; 

// Function to handle the Vercel/Node.js request and response
export default async function Sitemap(req: any, res: any) {
  try {
    // 1. Define Static Links
    const staticLinks = [
      { url: '/', changefreq: 'weekly', priority: 1.0 },
      { url: '/About', changefreq: 'monthly', priority: 0.8 },
      { url: '/Contact', changefreq: 'monthly', priority: 0.8 },
      // ... other static pages
    ];

    // 2. Fetch Dynamic Blog Post Links using the new function
    const posts = await getPublishedPostSlugs();
    
    const dynamicLinks = posts.map((post) => {
      // NOTE: Adjust the URL path if your blog posts are not at /BlogPost/:slug
      const postUrl = `/BlogPost/${post.slug}`;
      
      let lastModified = new Date().toISOString();
      // Safely convert Firestore Timestamp to Date, or use the ISO string if it's already one
      if (post.updatedAt && post.updatedAt.toDate) {
          lastModified = post.updatedAt.toDate().toISOString();
      } else if (post.updatedAt) {
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

    // 3. Generate the XML Stream
    const smStream = new SitemapStream({ hostname: HOSTNAME });
    const sitemap = await streamToPromise(Readable.from(links).pipe(smStream));

    // 4. Send the XML Response
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(sitemap.toString());

  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).end('Internal Server Error');
  }
}