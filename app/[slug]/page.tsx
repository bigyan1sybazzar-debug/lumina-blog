import { BlogPostPage } from '../../components/BlogPost';
import { Metadata } from 'next';
import { getPostBySlug } from '../../services/db';

type Props = {
    params: Promise<{ slug: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

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
            canonical: `https://bigyann.com.np/${post.slug}`,
        },
        openGraph: {
            title: post.title,
            description: post.excerpt || `Read ${post.title} on Bigyann.`,
            url: `https://bigyann.com.np/${post.slug}`,
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

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return <BlogPostPage />;
    }

    const isoDate = post.date ? new Date(post.date).toISOString() : new Date().toISOString();
    const updatedDate = post.updatedAt ? new Date(post.updatedAt).toISOString() : isoDate;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage ? [post.coverImage] : [],
        datePublished: isoDate,
        dateModified: updatedDate,
        author: {
            '@type': 'Person',
            name: post.author.name,
            url: `https://bigyann.com.np/u/${post.author.id}` // Assuming user profile route
        },
        publisher: {
            '@type': 'Organization',
            name: 'Bigyann',
            logo: {
                '@type': 'ImageObject',
                url: 'https://bigyann.com.np/icon-192x192.png'
            }
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://bigyann.com.np/${post.slug}`
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogPostPage />
        </>
    );
}
