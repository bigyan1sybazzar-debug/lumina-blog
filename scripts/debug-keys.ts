
import fs from 'fs';
import path from 'path';

// Load env vars manually
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        console.log("Found .env.local");

        for (const line of envConfig.split('\n')) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^"(.*)"$/, '$1');

                if (key.includes('KEY')) {
                    // Show first 4 chars to identify type
                    const prefix = value.substring(0, 4);
                    const suffix = value.substring(value.length - 4);
                    console.log(`${key}: ${prefix}...${suffix} (Length: ${value.length})`);
                }
            }
        }
    } else {
        console.log("No .env.local found");
    }
} catch (e) {
    console.error("Error loading .env.local", e);
}
