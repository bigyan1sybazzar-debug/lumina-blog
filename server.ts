import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import { getPostBySlug } from './services/db.js'; // Ensure tsx resolves this

// --- CONFIGURATION ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT: number = Number(process.env.PORT) || 3000;
const distPath: string = path.resolve(__dirname, 'dist');
const indexPath: string = path.resolve(distPath, 'index.html');

const app = express();

// 1. SECURITY & PERFORMANCE MIDDLEWARE
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. SERVE STATIC ASSETS
app.use(express.static(distPath, { index: false }));

// 3. DYNAMIC CONTENT ROUTE
app.get('*', async (req, res) => {
  const url: string = req.originalUrl;

  // Skip static files and API routes
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

    // Extract slug from URL
    const slug: string = url.split('?')[0].replace(/^\/+|\/+$/g, '');

    if (slug) {
      const post = await getPostBySlug(slug);

      if (post) {
        meta.title = `${post.title} |- Bigyann`;
        meta.description = post.excerpt || post.title;
        meta.image = post.coverImage || meta.image;
      } else {
        const prettySlug: string = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        meta.title = `${prettySlug} | Latest News - Bigyann`;
      }
    }

    // Read the built index.html
    if (!fs.existsSync(indexPath)) {
      return res.status(500).send('Run "npm run build" first to generate dist/index.html');
    }

    let html: string = fs.readFileSync(indexPath, 'utf8');

    // 4. INJECT METADATA
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
    res.sendFile(indexPath);
  }
});

// --- HELPER FUNCTIONS ---

function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, (m: string) => map[m]);
}

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`
🚀 Bigyann Production Server
----------------------------
Local: http://localhost:${PORT}
Mode:  Production
`);
});
