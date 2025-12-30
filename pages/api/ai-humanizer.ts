
import { NextApiRequest, NextApiResponse } from 'next';
import { analyzeAndHumanize } from '../../services/geminiService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { text, mode } = req.body;

    if (!text) {
        return res.status(400).json({ message: "Text is required" });
    }

    try {
        const result = await analyzeAndHumanize(text, mode);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error("API Humanizer Error:", error);
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
}
