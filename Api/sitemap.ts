import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req: any, res: any) {
  try {
    const snapshot = await getDocs(collection(db, "blogs"));
    const posts = snapshot.docs.map((doc) => doc.id);

    const base = "https://www.bigyann.com.np";

    const urls = posts
      .map(
        (id) =>
          `<url><loc>${base}/#/blog/${id}</loc><priority>0.8</priority></url>`
      )
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}</loc><priority>1.0</priority></url>
  <url><loc>${base}/#/blog</loc><priority>0.9</priority></url>
  ${urls}
</urlset>
`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).send("Error generating sitemap: " + err);
  }
}
