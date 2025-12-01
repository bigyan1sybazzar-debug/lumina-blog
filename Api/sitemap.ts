// Api/sitemap.ts   ← must be exactly this filename and path
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// This works on Vercel — no import.meta.env needed
const firebaseConfig = {
  apiKey: "AIzaSyBfCLdEs3srUp-Gt7ctNiGFX5czdxDizu4",
  authDomain: "lumina-blog-c92d8.firebaseapp.com",
  projectId: "lumina-blog-c92d8",
  storageBucket: "lumina-blog-c92d8.firebasestorage.app",
  messagingSenderId: "888597428624",
  appId: "1:888597428624:web:ef11dbf874be54ba5bdb15"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

export default async function handler(_req: any, res: any) {
  try {
    const snapshot = await db.collection("posts")
      .where("status", "==", "published")
      .get();

    let urls = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      urls += `<url><loc>https://bigyann.com.np/blog/${slug}</loc></url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://bigyann.com.np/</loc></url>
  ${urls}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).send("Error");
  }
}