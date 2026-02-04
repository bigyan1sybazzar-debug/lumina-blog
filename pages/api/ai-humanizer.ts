
export const runtime = 'edge';

import { analyzeAndHumanize } from '../../services/geminiService';

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { text, mode } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ message: "Text is required" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await analyzeAndHumanize(text, mode);
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error("API Humanizer Error:", error);
        return new Response(JSON.stringify({ message: error.message || "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
