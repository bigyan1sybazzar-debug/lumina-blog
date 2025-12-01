// api/sitemap.ts
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

// Firebase config from environment variables (set in Vercel dashboard)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "lumina-blog-c92d8.firebaseapp.com",
  projectId: "lumina-blog-c92d8",
  storageBucket: "lumina-blog-c92d8.firebasestorage.app",
  messagingSenderId: "888597428624",
  appId: "1:888597428624:web:ef11dbf874be54ba5bdb15",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DOMAIN = "https://bigyann.com.np";

export default async function handler(req: any, res: any) {
  try {
    // Only fetch published posts
    const q = query(collection(db, "posts"), where("status", "==", "published"));
    const snapshot = await getDocs(q);

    let urls = "";

    snapshot.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id; // use slug if exists, fallback to ID
      const lastmod = data.updatedAt || data.createdAt || new Date();
      const dateStr = new Date(lastmod.toMillis?.() || lastmod.seconds * 1000 || lastmod).toISOString().split("T")[0];

      urls += `
  <url>
    <loc>${DOMAIN}/blog/${slug}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${DOMAIN}/about</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${DOMAIN}/contact</loc>
    <priority>0.8</priority>
  </url>
  ${urls}
</urlset>`.trim();

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.status(200).send(xml);
  } catch (error: any) {
    console.error("Sitemap error:", error);
    res.status(500).send("Error generating sitemap");
  }
}