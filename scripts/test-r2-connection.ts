
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testR2() {
    console.log('Testing R2 Connection...');
    console.log('Loading configuration...');

    // Dynamic import so env vars are set
    const { storage } = await import('../lib/storage.js');

    console.log('--- R2 Configuration Test ---');
    console.log('R2 Configured:', storage.isR2Configured());

    if (!storage.isR2Configured()) {
        console.error('ERROR: R2 is not configured or env vars missing.');
        console.log('R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? 'Set' : 'Missing');
        console.log('R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? 'Set' : 'Missing');
        return;
    }

    const testFileName = `test-connection-${Date.now()}.txt`;
    const testContent = 'Hello from Lumina Blog R2 Test!';

    try {
        console.log(`Attempting to upload: ${testFileName}...`);
        const result = await storage.put(testFileName, testContent, {
            access: 'public',
            contentType: 'text/plain'
        });

        console.log('✅ UPLOAD SUCCESS!');
        console.log('Public URL:', result.url);

        console.log('Attempting to list files...');
        const list = await storage.list({ limit: 5 });
        console.log(`✅ LIST SUCCESS! Found ${list.blobs.length} items.`);

    } catch (error: any) {
        console.error('❌ TEST FAILED!');
        console.error('Error Details:', error.message);
        if (error.Code) console.error('AWS Error Code:', error.Code);
    }
}

testR2().catch(console.error);
