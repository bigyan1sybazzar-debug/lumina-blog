/**
 * DeepSeek API Service
 * Using the provided API Key for advanced AI Citation Audits.
 */

const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '';
if (!DEEPSEEK_API_KEY) {
    console.warn("DeepSeek API Key is missing. Citations may not fetch correctly.");
}
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/chat/completions';

export const sendDeepSeekMessage = async function* (prompt: string, signal?: AbortSignal) {
    try {
        const response = await fetch(DEEPSEEK_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are an expert AI Citation Analytics tool. Provide structured data as requested.' },
                    { role: 'user', content: prompt }
                ],
                stream: true,
                temperature: 0.7
            }),
            signal
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || 'DeepSeek API request failed');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body is null');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const cleanLine = line.replace(/^data: /, '').trim();
                if (cleanLine === '[DONE]') return;
                if (!cleanLine) continue;

                try {
                    const parsed = JSON.parse(cleanLine);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) yield content;
                } catch (e) {
                    // Ignore parse errors for incomplete chunks
                }
            }
        }
    } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('DeepSeek Error:', error);
        throw error;
    }
};
