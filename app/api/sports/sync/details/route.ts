import { NextResponse } from 'next/server';
import { db } from '../../../../../services/firebase';

export async function POST(req: Request) {
    try {
        const { eventId, statistics, lineups, details } = await req.json();

        if (!eventId) {
            return NextResponse.json({ error: "No eventId provided" }, { status: 400 });
        }

        // Store each match detail in its own document to bypass 1MB limit
        await db.collection('match_details').doc(eventId.toString()).set({
            eventId,
            statistics: statistics || null,
            lineups: lineups || null,
            details: details || null,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[DETAILS SYNC] Server Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
