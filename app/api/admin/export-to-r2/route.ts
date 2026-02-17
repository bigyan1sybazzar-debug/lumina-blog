import { NextResponse } from 'next/server';
import { db } from '../../../../services/firebase';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Define the collections we want to export
// 'dbName' is the Firestore collection name, 'fileName' is the target R2 JSON file name
const COLLECTIONS = [
    { dbName: 'posts', fileName: 'posts.json' },
    { dbName: 'categories', fileName: 'categories.json' },
    { dbName: 'polls', fileName: 'polls.json' },
    { dbName: 'live_links', fileName: 'live-data.json' },
    { dbName: 'iptv_channels', fileName: 'iptv-data.json' },
    { dbName: 'highlights', fileName: 'highlights.json' },
    { dbName: 'keywords', fileName: 'keywords.json' }
];

export async function POST(req: Request) {
    try {
        const results = [];
        console.log('Starting full export to R2...');

        for (const col of COLLECTIONS) {
            console.log(`Exporting ${col.dbName} -> ${col.fileName}...`);

            const snapshot = await db.collection(col.dbName).get();
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Use 'allowOverwrite' to ensure we update the existing file
            const result = await storage.put(col.fileName, JSON.stringify(data), {
                access: 'public',
                addRandomSuffix: false,
                contentType: 'application/json',
                allowOverwrite: true
            });

            console.log(`Exported ${col.dbName}: ${data.length} items to ${result.url}`);
            results.push({ collection: col.dbName, count: data.length, url: result.url });
        }

        return NextResponse.json({
            success: true,
            message: 'All collections exported to R2 successfully',
            details: results
        });

    } catch (error: any) {
        console.error('Export failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
