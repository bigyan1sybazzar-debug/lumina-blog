export default async function handler(req, res) {
    const { endpoint, address, token } = req.query;
    const RAPID_API_KEY = 'b60d288a5dmsh589478213136d86p1ad513jsn354c232be7de';
    const RAPID_API_HOST = 'temporary-gmail-account.p.rapidapi.com';
  
    let url = `https://${RAPID_API_HOST}/${endpoint}`;
    
    // Add query parameters if checking messages
    if (address && token) {
      url += `?address=${encodeURIComponent(address)}&token=${encodeURIComponent(token)}`;
    }
  
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPID_API_KEY,
          'x-rapidapi-host': RAPID_API_HOST,
        },
      });
  
      const data = await response.json();
      
      // Set proper headers for the browser
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch from RapidAPI" });
    }
  }