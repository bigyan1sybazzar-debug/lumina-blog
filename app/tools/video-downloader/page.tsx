// Removed the curly braces because of the default export change
import VideoDownloader from '../../../pages/VideoDownloader';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Video Downloader - Save Videos from Social Media | Bigyann',
    description: 'Download videos from Facebook, Instagram, Twitter, and TikTok for free. Fast and easy video downloader.',
};

export default function Page() { 
    return <VideoDownloader />; 
}