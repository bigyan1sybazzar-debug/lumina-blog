// api/index.ts

// 💥 FIX 1: Use require() for external packages in CommonJS context
const { SitemapStream, streamToPromise } = require('sitemap'); 

// The Vercel types are complex to mix with CommonJS, so we simplify
type Req = any;
type Res = any;

export default async function sitemap(req: Req, res: Res) {
    
    console.log("Sitemap function started..."); 
    
    try {
        console.log("Attempting to generate XML...");
        
        // ⭐ FIX 2: Use a dynamic import for your internal service file
        // This is necessary because your services are still being treated as ESM.
        const sitemapModule = await import('../services/sitemapGenerator');
        const { generateSitemapXml } = sitemapModule;

        const sitemapXml = await generateSitemapXml(); 
        
        console.log("XML generation succeeded."); 

        res.setHeader('Content-Type', 'text/xml; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); 
        res.status(200).send(sitemapXml);

    } catch (error) {
        console.error("RUNTIME CRASH ERROR:", error);
        res.status(500).send('Error generating sitemap on the server. Check Vercel logs for details.');
    }
}