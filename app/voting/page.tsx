import VotingPage from '../../components/voting/VotingPage';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const revalidate = 60; // revalidate every minute

export const metadata: Metadata = {
    title: 'Bigyann Vote | Community Decisions & Trends',
    description: 'Vote on various categories like elections, movies, and gadgets on Bigyann. Share your opinion and watch real-time results.',
    alternates: {
        canonical: 'https://bigyann.com.np/voting',
    },
};

export default function Page() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        }>
            <VotingPage />
        </Suspense>
    );
}
