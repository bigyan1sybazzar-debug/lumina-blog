import type { VercelRequest, VercelResponse } from '@vercel/node';
import { renderPage } from '../server';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    await renderPage(req, res);
  } catch (err) {
    console.error('[SSR ERROR]', err);
    res.status(500).send('SSR failed');
  }
}
