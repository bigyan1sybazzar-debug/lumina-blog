
import dotenv from 'dotenv';
import path from 'path';

// Load env vars using dotenv BEFORE importing services
const envConfig = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import the service
import { analyzeAndHumanize } from '../services/geminiService';

console.log("Dotenv parsed:", Object.keys(envConfig.parsed || {}));
console.log("Checking keys in process.env:");
console.log("NEXT_PUBLIC_GEMINI_API_KEY exists?", !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
console.log("API_KEY exists?", !!process.env.API_KEY);

const testText = `
Artificial Intelligence is rapidly changing the world. In conclusion, it is a very important technology. 
Furthermore, it has many applications in various fields such as healthcare, finance, and transportation. 
The algorithms are becoming more sophisticated every day, leading to better performance and accuracy.
`;

async function runTest() {
    console.log("Starting Humanizer Test...");
    try {
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY && !process.env.API_KEY) {
            console.warn("⚠️  Warning: No API Key found in environment variables.");
        }

        const result = await analyzeAndHumanize(testText);
        console.log("---------------------------------------------------");
        console.log("Humanizer Result:");
        console.log(JSON.stringify(result, null, 2));
        console.log("---------------------------------------------------");
    } catch (error: any) {
        console.error("Test Failed:", error);
    }
}

runTest();
