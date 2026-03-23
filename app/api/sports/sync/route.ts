import { NextResponse } from 'next/server';
import { db } from '../../../../services/firebase';
import firebase from 'firebase/compat/app';

export async function POST(req: Request) {
    // Basic security: only allow sync in dev or if skipping auth for now
    // In production, you should add a secret token check here

    try {
        const { football, cricket, standings } = await req.json();
        console.log(`[SPORTS SYNC] Football: ${football?.length || 0}, Cricket: ${cricket?.length || 0}, Standings: ${standings ? Object.keys(standings).length : 0} leagues`);

        if (!football && !cricket && !standings) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        const payload = {
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            ...(football && { football }),
            ...(cricket && { cricket }),
            ...(standings && { standings })
        };

        await db.collection('globals').doc('sports').set(payload, { merge: true });

        console.log("[SPORTS SYNC] Cloud Snapshot Updated via Server");
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[SPORTS SYNC] Server Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
