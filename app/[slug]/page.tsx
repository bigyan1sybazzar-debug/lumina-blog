import { BlogPostPage } from '../../components/BlogPost';
import { Metadata } from 'next';
import { getR2PostBySlug } from '../../services/r2-data';
import { generateArticleSchema } from '../../lib/schemaGenerator';

export const revalidate = 3600; // revalidate every hour

type Props = {
    params: Promise<{ slug: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getR2PostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
            description: 'The requested article could not be found on Bigyann.',
            robots: { index: false, follow: true },
        };
    }

    const keywords = post.seo?.focusKeywords || post.tags || [];
    const publishedTime = post.date ? new Date(post.date).toISOString() : new Date().toISOString();
    const modifiedTime = post.updatedAt || publishedTime;

    return {
        title: post.seo?.metaTitle || post.title,
        description: post.seo?.metaDescription || post.excerpt || `Read the latest article about ${post.title} on Bigyann.`,
        keywords: keywords,
        authors: [{ name: post.author.name }],
        alternates: {
            canonical: `https://bigyann.com.np/${post.slug}`,
        },
        openGraph: {
            title: post.seo?.metaTitle || post.title,
            description: post.seo?.metaDescription || post.excerpt || `Read ${post.title} on Bigyann.`,
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
            title: post.seo?.metaTitle || post.title,
            description: post.seo?.metaDescription || post.excerpt || `Read ${post.title} on Bigyann.`,
            images: [post.coverImage],
        },
    };
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const post = await getR2PostBySlug(slug);

    if (!post) {
        return <BlogPostPage />;
    }

    const canonicalUrl = `https://bigyann.com.np/${post.slug}`;
    const { articleSchema, faqSchema, breadcrumbSchema } = generateArticleSchema(post, canonicalUrl);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <BlogPostPage initialPost={post} />
        </>
    );
}
