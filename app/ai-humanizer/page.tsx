import AIHumanizer from '../../pages/_ai_humanizer_base';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Free AI Humanizer - Bypass AI Detection (Zero % Detection)',
    description: 'Humanize your AI-generated content for free. Our tool helps you bypass AI detectors like GPTZero, Originality.ai, and more with 100% human-like text.',
    alternates: {
        canonical: 'https://bigyann.com.np/ai-humanizer',
    },
    openGraph: {
        title: 'Free AI Humanizer - Bypass AI Detection (Zero % Detection)',
        description: 'Humanize your AI-generated content for free and bypass all AI detectors.',
        url: 'https://bigyann.com.np/ai-humanizer',
        type: 'website',
    }
};

export default function Page() { return <AIHumanizer />; }
