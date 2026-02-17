import PromptsPage from '../../pages/_prompts_base';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'AI Prompt Library - Best ChatGPT, Claude & Gemini Prompts',
    description: 'Explore our curated collection of free AI prompts for ChatGPT, Claude, Gemini, and more. Boost your productivity with high-quality, tested prompts.',
    alternates: {
        canonical: 'https://bigyann.com.np/prompts',
    },
    openGraph: {
        title: 'AI Prompt Library - Best ChatGPT, Claude & Gemini Prompts',
        description: 'Explore our curated collection of free AI prompts for ChatGPT, Claude, Gemini, and more.',
        url: 'https://bigyann.com.np/prompts',
        type: 'website',
    }
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PromptsPage />
        </Suspense>
    );
}
