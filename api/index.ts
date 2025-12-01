// api/index.ts

// The static import for 'sitemap' package should still be 'require'
const { SitemapStream, streamToPromise } = require('sitemap'); 

// The Vercel types are complex to mix with CommonJS, so we simplify
type Req = any;
type Res = any;

// 💥 FIX 1: Change the function definition (remove 'export default')
async function sitemap(req: Req, res: Res) {
    
    console.log("Sitemap function started..."); 
    
    try {
        console.log("Attempting to generate XML...");
        
        // Use dynamic import for the local service file:
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

// 💥 FIX 2: Assign the function to module.exports for CommonJS compatibility
module.exports = sitemap;