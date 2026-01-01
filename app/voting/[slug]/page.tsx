import PollDetailPage from '../../../components/voting/PollDetailPage';
import { Metadata } from 'next';
import { getPollBySlug } from '../../../services/db';

type Props = {
    params: Promise<{ slug: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const poll = await getPollBySlug(slug);

    if (!poll) {
        return {
            title: 'Poll Not Found | Bigyann',
            description: 'The requested poll could not be found.',
        };
    }

    return {
        title: `${poll.question} - Vote Now | Bigyann`,
        description: poll.description ? poll.description.substring(0, 160) : `Cast your vote on: ${poll.question}. See live results on Bigyann.`,
        openGraph: {
            title: `${poll.question} - Live Poll`,
            description: poll.description || `What's your opinion? Join the discussion on Bigyann.`,
            images: poll.questionImage ? [{ url: poll.questionImage }] : [],
            url: `https://bigyann.com.np/voting/${poll.slug || poll.id}`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: poll.question,
            description: poll.description || `Cast your vote and see live results.`,
            images: poll.questionImage ? [poll.questionImage] : [],
        },
    };
}

export default async function Page({ params }: Props) {
    return <PollDetailPage />;
}
