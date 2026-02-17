import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { IPTVChannel } from '@/types';

const JSON_FILE = 'iptv-data.json';

// Helper to fetch current IPTV channels from R2
async function getIPTVChannels(): Promise<IPTVChannel[]> {
    try {
        const url = `${process.env.R2_PUBLIC_DOMAIN}/${JSON_FILE}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error('Error fetching IPTV channels from R2:', e);
        return [];
    }
}

// Helper to save IPTV channels to R2
async function saveIPTVChannels(channels: IPTVChannel[]) {
    await storage.put(JSON_FILE, JSON.stringify(channels), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
    });
}

export async function GET() {
    const channels = await getIPTVChannels();
    return NextResponse.json(channels);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, channel, id } = body;

        let channels = await getIPTVChannels();

        // Ensure channels is an array
        if (!Array.isArray(channels)) channels = [];

        if (action === 'create' || action === 'upsert') {
            // Check if channel exists
            const existingIndex = channels.findIndex(c => c.id === channel.id || c.url === channel.url);

            if (existingIndex !== -1) {
                // Update existing
                channels[existingIndex] = {
                    ...channels[existingIndex],
                    ...channel,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Create new
                const newChannel: IPTVChannel = {
                    ...channel,
                    id: channel.id || crypto.randomUUID(),
                    createdAt: new Date().toISOString()
                };
                channels.unshift(newChannel);
            }

            await saveIPTVChannels(channels);
            return NextResponse.json({ success: true, channel: channels[existingIndex !== -1 ? existingIndex : 0] });
        }

        if (action === 'update') {
            const index = channels.findIndex(c => c.id === id);
            if (index === -1) return NextResponse.json({ error: 'IPTV channel not found' }, { status: 404 });

            channels[index] = {
                ...channels[index],
                ...channel,
                updatedAt: new Date().toISOString()
            };
            await saveIPTVChannels(channels);
            return NextResponse.json({ success: true, channel: channels[index] });
        }

        if (action === 'delete') {
            channels = channels.filter(c => c.id !== id);
            await saveIPTVChannels(channels);
            return NextResponse.json({ success: true });
        }

        if (action === 'setDefault') {
            // Unset all defaults first
            channels = channels.map(c => ({ ...c, isDefault: false }));
            // Set the specified one as default
            const index = channels.findIndex(c => c.id === id);
            if (index !== -1) {
                channels[index].isDefault = true;
            }
            await saveIPTVChannels(channels);
            return NextResponse.json({ success: true });
        }

        if (action === 'toggleTrending') {
            const index = channels.findIndex(c => c.id === id);
            if (index !== -1) {
                channels[index].isTrending = !channels[index].isTrending;
                await saveIPTVChannels(channels);
                return NextResponse.json({ success: true, channel: channels[index] });
            }
            return NextResponse.json({ error: 'IPTV channel not found' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('R2 IPTV Channels Management Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
