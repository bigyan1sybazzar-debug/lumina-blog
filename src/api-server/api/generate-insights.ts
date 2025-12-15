// src/api-server/api/generate-insights.ts
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const insights = {
      summary: 'This is a test summary',
      keywords: ['keyword1', 'keyword2'],
      qa: [
        { question: 'Example Q1?', answer: 'Example A1' },
        { question: 'Example Q2?', answer: 'Example A2' },
      ],
    };

    return res.json(insights);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
