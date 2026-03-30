import AiCitationStats from '../../../pages/AiCitationStats';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'AI Citation Stats - Track AI Referrals | Bigyann',
    description: 'Monitor how often your content is cited by ChatGPT, Bing AI, and Perplexity. Track referral traffic from AI platforms and see which pages are top-cited.',
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AiCitationStats />
        </Suspense>
    );
}
