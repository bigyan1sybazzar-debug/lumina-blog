// Api/sitemap.ts 
import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK.
// For security and reliability in a serverless environment (like Vercel),
// the Admin SDK is preferred over the client SDK as it has full read/write access.

if (!admin.apps.length) {
  try {
    // This initialization relies on Vercel having the necessary environment variables
    // (e.g., Service Account JSON or FIREBASE_PROJECT_ID) configured for your project.
    admin.initializeApp({
      // The Admin SDK typically uses service account credentials. 
      // We explicitly set the project ID from your original config for clarity.
      projectId: "lumina-blog-c92d8", 
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    // Catch if already initialized (common in Vercel development environment)
    if (!/already exists/u.test(error.message)) {
      console.error("Firebase Admin SDK initialization error:", error);
    }
  }
}

const db = admin.firestore();

// Maximum number of retries for the Firestore read
const MAX_RETRIES = 3;

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

    } catch (e) {
      const errorMessage = `Firestore Query Attempt ${attempt + 1} failed: ${e.message}`;
      console.error(errorMessage);
      
      // If this is the last attempt, re-throw the error to be caught below
      if (attempt === MAX_RETRIES - 1) {
        // Log the final failed attempt
        console.error("Failed to retrieve posts after all retries.");
        throw e;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  try {
    // Ensure snapshot was successfully obtained
    if (!snapshot) {
        // This should not happen if the error handling worked, but as a safeguard:
        throw new Error("Could not retrieve post data from Firestore.");
    }
    
    let urls = "";
    // 2. Iterate over the documents and generate <url> tags
    snapshot.forEach(doc => {
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

  } catch (e) {
    // Handle errors from inside the handler logic
    console.error("Sitemap generation error:", e);
    // Send a 500 status with a specific error message
    res.status(500).send(`Sitemap Generation Error: ${e.message}`);
  }
}