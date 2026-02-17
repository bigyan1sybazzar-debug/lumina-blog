
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
    try {
        console.log('Loading storage...');
        const { storage } = await import('../lib/storage.js');

        console.log('Listing files in bucket...');
        const list = await storage.list({ limit: 5 });

        const output = `SUCCESS: true
Count: ${list.blobs.length}
First: ${list.blobs[0]?.url || 'none'}
`;
        fs.writeFileSync('r2-check-output.txt', output);
        console.log('Done.');
    } catch (err: any) {
        fs.writeFileSync('r2-check-output.txt', `SUCCESS: false\nError: ${err.message}`);
        console.error(err);
    }
}

run();
