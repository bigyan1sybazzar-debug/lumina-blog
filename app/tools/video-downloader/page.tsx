import VideoDownloader from '../../../pages/VideoDownloader';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Video Downloader - Save Videos from Social Media | Bigyann',
    description: 'Download videos from Facebook, Instagram, Twitter, and TikTok for free. Fast and easy video downloader.',
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VideoDownloader />
        </Suspense>
    );
}