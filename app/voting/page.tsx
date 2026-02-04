import VotingPage from '../../components/voting/VotingPage';
import { Metadata } from 'next';

export const revalidate = 60; // revalidate every minute

export const metadata: Metadata = {
    title: 'Bigyann Vote | Community Decisions & Trends',
    description: 'Vote on various categories like elections, movies, and gadgets on Bigyann. Share your opinion and watch real-time results.',
    alternates: {
        canonical: 'https://bigyann.com.np/voting',
    },
};

export default function Page() {
    return <VotingPage />;
}
