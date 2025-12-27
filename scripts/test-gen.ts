import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from "@google/genai";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        if (line.startsWith('#')) return;
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            process.env[key.trim()] = value;
        }
    });
}

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ NEXT_PUBLIC_GEMINI_API_KEY not found in environment variables.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: apiKey });

async function testGeneration() {
    try {
        console.log("Testing generation with model: gemini-2.5-flash");
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Say hello!",
        });
        console.log("Response:", response.text);
    } catch (error: any) {
        console.error("Generation failed:", error.message);
    }
}

testGeneration();
