import AiVisibilityChecker from '../../../pages/AiVisibilityChecker';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'AI Visibility Checker - Check AI Brand Presence | Bigyann',
    description: 'Find out what AI models know about your brand, website, or identity. Analyze your digital footprint across LLM training sets like Common Crawl and C4.',
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AiVisibilityChecker />
        </Suspense>
    );
}
