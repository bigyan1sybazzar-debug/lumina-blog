import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';

// --- CONFIGURATION ---
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;
const distPath = path.resolve(__dirname, 'dist');
const indexPath = path.resolve(distPath, 'index.html');

// Import your Database logic
// Ensure this file is plain JS or compiled from TS
import { getPostBySlug } from './src/services/db.ts';
const app = express();

// 1. SECURITY & PERFORMANCE MIDDLEWARE
app.use(compression()); // Gzip compression for faster loading
app.use(
  helmet({
    contentSecurityPolicy: false, // Set to false if you use external CDNs like Cloudflare/Google
    crossOriginEmbedderPolicy: false,
  })
);

// 2. SERVE STATIC ASSETS (CSS, JS, Images)
// We serve the /dist folder but EXCLUDE index.html from static serving 
// so our custom route can handle it.
app.use(express.static(distPath, { index: false }));

// 3. DYNAMIC CONTENT ROUTE
app.get('*', async (req, res) => {
  const url = req.originalUrl;

  // Skip files (images, .js, .css) and API routes
  if (url.includes('.') || url.startsWith('/api')) {
    return res.status(404).end();
  }

  try {
    // Default Metadata
    let meta = {
      title: 'Bigyann - Exploring Science, Tech & Innovation',
      description: 'Bigyann is a premier platform for science, technology, and digital insights in Nepal.',
      image: 'https://bigyann.com.np/default-og-image.jpg',
      url: `https://bigyann.com.np${url}`
    };

    // Extract slug (e.g., /my-post-link -> my-post-link)
    const slug = url.split('?')[0].replace(/^\/+|\/+$/g, '');

    if (slug) {
      const post = await getPostBySlug(slug);

      if (post) {
        meta.title = `${post.title} | Price & Specs - Bigyann`;
        meta.description = post.excerpt || post.title;
        meta.image = post.coverImage || meta.image;
      } else {
        // Fallback: Make a pretty title from the slug if post not found
        const prettySlug = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        meta.title = `${prettySlug} | Latest News - Bigyann`;
      }
    }

    // Read the built index.html
    if (!fs.existsSync(indexPath)) {
      return res.status(500).send('Run "npm run build" first to generate dist/index.html');
    }
    let html = fs.readFileSync(indexPath, 'utf8');

    // 4. INJECT METADATA (Advanced Regex)
    // These regex patterns handle tags even if they have extra attributes like data-rh="true"
    html = html
      .replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
      .replace(/<meta[^>]*name="description"[^>]*content="[^"]*"[^>]*>/i, `<meta name="description" content="${escapeHtml(meta.description)}">`)
      .replace(/<meta[^>]*property="og:title"[^>]*content="[^"]*"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(meta.title)}">`)
      .replace(/<meta[^>]*property="og:description"[^>]*content="[^"]*"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(meta.description)}">`)
      .replace(/<meta[^>]*property="og:image"[^>]*content="[^"]*"[^>]*>/i, `<meta property="og:image" content="${escapeHtml(meta.image)}">`)
      .replace(/<meta[^>]*property="og:url"[^>]*content="[^"]*"[^>]*>/i, `<meta property="og:url" content="${escapeHtml(meta.url)}">`)
      .replace(/<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(meta.url)}">`);

    console.log(`[SEO] Injected meta for: ${url}`);
    res.send(html);

  } catch (error) {
    console.error('[Server Error]', error);
    // On error, send the original file as a fallback
    res.sendFile(indexPath);
  }
});

// Helper to prevent XSS in meta tags
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}

app.listen(PORT, () => {
  console.log(`
  🚀 Bigyann Production Server
  ----------------------------
  Local: http://localhost:${PORT}
  Mode:  Production
  `);
});