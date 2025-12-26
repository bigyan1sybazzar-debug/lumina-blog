import { Home } from '../pages/Home';
import { Metadata } from 'next';

export const metadata: Metadata = {
    // Title and Description inherited from Root Layout (which matches Old SEO now)
    // We can override specific fields if needed, but for Home, the Root is usually sufficient.
    // However, to be exact:
    title: 'AI Powered Tech and Science - Bigyann | Reviews & Discussions',
    description: 'AI powered Articles, Reviews & Discussions on latest tech, design, and AI technology. Explore Articles.',
    alternates: {
        canonical: 'https://bigyann.com.np',
    },
};

export default function Page() {
    return <Home />;
}
