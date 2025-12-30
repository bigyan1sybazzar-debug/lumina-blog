
import { generateText } from 'ai';
import * as path from 'path';
import * as fs from 'fs';

// Load env (for AI_GATEWAY_API_KEY)
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const lines = envConfig.split(/\r?\n/);
    lines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            if (!process.env[key]) {
                process.env[key] = value.replace(/^["']|["']$/g, '');
            }
        }
    });
}

const key = process.env.AI_GATEWAY_API_KEY;
console.log("Gateway Key ends in:", key ? key.slice(-5) : "NONE");

async function main() {
    try {
        console.log("Calling google/gemini-2.5-flash via Gateway...");
        // Note: The user snippet used 'openai/gpt-5'. We will try 'google/gemini-2.5-flash'.
        // If this string format isn't automatically supported by 'ai' standalone, we might fail,
        // but this matches the user's request pattern.
        const result = await generateText({
            model: 'google/gemini-2.5-flash' as any, // Cast to any to bypass TS check if type definitions missing
            prompt: 'Explain quantum computing in 1 sentence.',
        });
        console.log("Result:", result.text);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
