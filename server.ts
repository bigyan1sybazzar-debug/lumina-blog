import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';
import { getPostBySlug } from './services/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

export async function renderPage(
  req: IncomingMessage,
  res: ServerResponse
) {
  const url = req.url || '/';

  if (!fs.existsSync(indexPath)) {
    res.statusCode = 500;
    res.end('Run "npm run build" first');
    return;
  }

  let meta = {
    title: 'Bigyann - Exploring Science, Tech & Innovation',
    description:
      'Bigyann is a premier platform for science, technology, and digital insights in Nepal.',
    image: 'https://bigyann.com.np/default-og-image.jpg',
    url: `https://bigyann.com.np${url}`
  };

  const slug = url.replace(/^\/+|\/+$/g, '').split('?')[0];

  if (slug) {
    const post = await getPostBySlug(slug);

    if (post) {
      meta.title = `${post.title} | Bigyann`;
      meta.description = post.excerpt || post.title;
      meta.image = post.coverImage || meta.image;
    } else {
      const pretty = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      meta.title = `${pretty} | Latest News - Bigyann`;
    }
  }

  let html = fs.readFileSync(indexPath, 'utf8');

  html = html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<meta[^>]*name="description"[^>]*>/i,
      `<meta name="description" content="${escapeHtml(meta.description)}">`
    )
    .replace(/<link[^>]*rel="canonical"[^>]*>/i,
      `<link rel="canonical" href="${escapeHtml(meta.url)}">`
    );

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}

function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}
