import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading .env.local from ${envPath}`);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        // Skip comments
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
} else {
    console.warn(".env.local file not found!");
}

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ NEXT_PUBLIC_GEMINI_API_KEY not found in environment variables.");
    process.exit(1);
}

console.log(`✅ Found API Key: ${apiKey.substring(0, 5)}...`);

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("Error listing models:", data.error);
            return;
        }

        if (data.models) {
            console.log("\nAvailable Models:");
            data.models.forEach((model: any) => {
                if (model.name.includes("gemini")) {
                    console.log(`- ${model.name} (${model.displayName})`);
                }
            });
        } else {
            console.log("No models found or unexpected response format:", data);
        }

    } catch (error) {
        console.error("Failed to fetch models:", error);
    }
}

listModels();
