
export interface M3UChannel {
    name: string;
    logo: string;
    id: string;
    group: string;
    url: string;
    isTrending?: boolean;
    isDefault?: boolean;
    trendingOrder?: number;
}

export const parseM3U = (content: string): M3UChannel[] => {
    const lines = content.split('\n');
    const channels: M3UChannel[] = [];
    let currentChannel: Partial<M3UChannel> = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
            // Extract metadata
            const nameMatch = line.match(/tvg-name="([^"]+)"/);
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const idMatch = line.match(/tvg-id="([^"]+)"/);
            const groupMatch = line.match(/group-title="([^"]+)"/);

            // Channel name is after the last comma
            const nameParts = line.split(',');
            const displayName = nameParts[nameParts.length - 1].trim();

            currentChannel = {
                name: displayName || (nameMatch ? nameMatch[1] : 'Unknown Channel'),
                logo: logoMatch ? logoMatch[1] : '',
                id: idMatch ? `${idMatch[1]}-${channels.length}` : `channel-${channels.length}`,
                group: groupMatch ? groupMatch[1] : 'Uncategorized'
            };
        } else if (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp')) {
            if (currentChannel.name) {
                currentChannel.url = line;
                channels.push(currentChannel as M3UChannel);
                currentChannel = {};
            }
        }
    }

    return channels;
};
