// Api/sitemap.ts 
import * as admin from 'firebase-admin';
// Import the specific type from the standard path for Firestore
import { QueryDocumentSnapshot } from 'firebase-admin/lib/firestore'; 

// Maximum number of retries for the Firestore read
const MAX_RETRIES = 3;

// Initialize the Firebase Admin SDK.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // We explicitly set the project ID from your original config for clarity.
      projectId: "lumina-blog-c92d8", 
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: unknown) { // Use 'unknown' but check its type or cast it for safe access
    // Cast the error to safely access the message property, fixing TS18046
    const e = error as Error;
    if (!/already exists/u.test(e.message)) {
      console.error("Firebase Admin SDK initialization error:", e);
    }
  }
}

// Access Firestore service
const db = admin.firestore();

/**
 * Handles the request to generate the sitemap.xml.
 * @param _req - The incoming request object (not used here).
 * @param res - The outgoing response object.
 */
export default async function handler(_req: any, res: any) {
  let snapshot;
  
  // Use a retry loop to handle transient network or initialization errors
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // 1. Query Firestore for all published posts
      snapshot = await db.collection("posts")
        .where("status", "==", "published")
        .get();

      // If successful, break the retry loop
      break;

    } catch (e: unknown) { // Fixing TS18046: 'e' is of type 'unknown'
      const error = e as Error;
      const errorMessage = `Firestore Query Attempt ${attempt + 1} failed: ${error.message || 'Unknown Error'}`;
      console.error(errorMessage);
      
      // If this is the last attempt, re-throw the error to be caught below
      if (attempt === MAX_RETRIES - 1) {
        console.error("Failed to retrieve posts after all retries.");
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  try {
    // Ensure snapshot was successfully obtained
    if (!snapshot) {
        throw new Error("Could not retrieve post data from Firestore.");
    }
    
    let urls = "";
    // 2. Iterate over the documents and generate <url> tags
    // Explicitly type 'doc' as QueryDocumentSnapshot to fix TS7006
    snapshot.forEach((doc: QueryDocumentSnapshot) => { 
      const data = doc.data();
      // Use the 'slug' field if it exists, otherwise fall back to the document ID
      const slug = data.slug || doc.id;
      
      // Add the full URL for the post
      urls += `<url><loc>https://bigyann.com.np/blog/${slug}</loc></url>\n`;
    });

    // 3. Construct the final XML string
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static homepage URL -->
  <url><loc>https://bigyann.com.np/</loc></url>
  
  <!-- Dynamic post URLs -->
  ${urls}
</urlset>`;

    // 4. Set headers and send the response
    res.setHeader("Content-Type", "application/xml");
    // Set caching policy: s-maxage (CDN cache) for 24 hours, revalidate on stale
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate"); 
    res.status(200).send(xml);

  } catch (e: unknown) { // Fixing TS18046
    const error = e as Error;
    console.error("Sitemap generation error:", error);
    // Handle errors from inside the handler logic
    res.status(500).send(`Sitemap Generation Error: ${error.message || 'An unexpected error occurred.'}`);
  }
}