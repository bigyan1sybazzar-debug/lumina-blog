export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    try {
      if (req.query.secret !== process.env.REVALIDATE_SECRET) {
        return res.status(401).json({ message: 'Invalid token' });
      }
  
      const path = req.query.path || '/';
      
      // In a real Next.js app, you'd use: await res.revalidate(path);
      // For React/Vite, just return success
      
      return res.json({ 
        revalidated: true, 
        path,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ 
        message: 'Error revalidating',
        error: err.message 
      });
    }
  }