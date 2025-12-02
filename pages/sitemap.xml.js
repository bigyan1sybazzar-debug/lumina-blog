export default function SitemapXml() {
    return null;
  }
  
  export async function getServerSideProps({ res }) {
    if (!res) return { props: {} };
    
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'https://lumina-blog.vercel.app';
      
      const response = await fetch(`${baseUrl}/api/generate-sitemap`);
      const xml = await response.text();
      
      res.setHeader('Content-Type', 'application/xml');
      res.write(xml);
      res.end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
    
    return { props: {} };
  }