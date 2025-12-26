import { BlogPostPage } from '../../pages/BlogPost';
import { Metadata } from 'next';
import { getPostBySlug } from '../../services/db';

type Props = {
    params: { slug: string }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = await getPostBySlug(params.slug);

    if (!post) {
        return {
            title: 'Post Not Found',
            description: 'The requested article could not be found on Bigyann.',
            robots: { index: false, follow: true },
        };
    }

    const keywords = post.tags || [];
    const publishedTime = post.date ? new Date(post.date).toISOString() : new Date().toISOString();
    const modifiedTime = post.updatedAt || publishedTime;

    return {
        title: post.title,
        description: post.excerpt || `Read the latest article about ${post.title} on Bigyann.`,
        keywords: keywords,
        authors: [{ name: post.author.name }],
        alternates: {
            canonical: `/${post.slug}`,
        },
        openGraph: {
            title: post.title,
            description: post.excerpt || `Read ${post.title} on Bigyann.`,
            url: `/${post.slug}`,
            siteName: 'Bigyann',
            images: [
                {
                    url: post.coverImage,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
            locale: 'en_US',
            type: 'article',
            publishedTime: publishedTime,
            modifiedTime: modifiedTime,
            authors: [post.author.name],
            tags: keywords,
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt || `Read ${post.title} on Bigyann.`,
            images: [post.coverImage],
        },
    };
}

export default function Page({ params }: Props) {
    return <BlogPostPage />;
}
