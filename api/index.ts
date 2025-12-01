// api/index.ts

// 💥 FIX 1: Use require() for external packages (CommonJS)
const { SitemapStream, streamToPromise } = require('sitemap'); 

// ⭐ FIX 2: Define placeholder types to resolve TS2304 error
type Req = any;
type Res = any;

async function sitemap(req: Req, res: Res) {
    
    console.log("Sitemap function started..."); 
    
    try {
        console.log("Attempting to generate XML...");
        
        // ⭐ FIX 3: Dynamic import with .js extension for CommonJS/ESM compatibility
        const sitemapModule = await import('../services/sitemapGenerator.js'); 
        const { generateSitemapXml } = sitemapModule;

        const sitemapXml = await generateSitemapXml(); 
        
        console.log("XML generation succeeded."); // TARGET LOG!

        res.setHeader('Content-Type', 'text/xml; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); 
        res.status(200).send(sitemapXml);

    } catch (error) {
        console.error("RUNTIME CRASH ERROR:", error);
        res.status(500).send('Error generating sitemap on the server. Check Vercel logs for details.');
    }
}

// FIX 4: Use module.exports for CommonJS export
module.exports = sitemap;