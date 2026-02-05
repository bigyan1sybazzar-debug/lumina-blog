export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { BlogPostPage } from '../../components/BlogPost';
import { Metadata } from 'next';
import { getPostBySlug } from '../../services/db';
import { generateArticleSchema } from '../../lib/schemaGenerator';

export const revalidate = 3600; // revalidate every hour

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

    const keywords = post.seo?.focusKeywords || post.tags || [];

    // Defensive date parsing
    let publishedTime = new Date().toISOString();
    try {
        if (post.date) {
            const d = new Date(post.date);
            if (!isNaN(d.getTime())) {
                publishedTime = d.toISOString();
            }
        }
    } catch (e) {
        console.error("Metadata date parsing error:", e);
    }

    const modifiedTime = post.updatedAt || publishedTime;

    const authorName = post.author?.name || 'Bigyann Author';

    return {
        title: post.seo?.metaTitle || post.title || 'Tech Article',
        description: post.seo?.metaDescription || post.excerpt || `Read the latest article about ${post.title || 'technology'} on Bigyann.`,
        keywords: keywords,
        authors: [{ name: authorName }],
        alternates: {
            canonical: `https://bigyann.com.np/${post.slug}`,
        },
        openGraph: {
            title: post.seo?.metaTitle || post.title || 'Tech Article',
            description: post.seo?.metaDescription || post.excerpt || `Read ${post.title || 'technology'} on Bigyann.`,
            url: `https://bigyann.com.np/${post.slug}`,
            siteName: 'Bigyann',
            images: post.coverImage ? [
                {
                    url: post.coverImage,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ] : [],
            locale: 'en_US',
            type: 'article',
            publishedTime: publishedTime,
            modifiedTime: modifiedTime,
            authors: [authorName],
            tags: keywords,
        },
        twitter: {
            card: 'summary_large_image',
            title: post.seo?.metaTitle || post.title || 'Tech Article',
            description: post.seo?.metaDescription || post.excerpt || `Read ${post.title || 'technology'} on Bigyann.`,
            images: post.coverImage ? [post.coverImage] : [],
        },
    };
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

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
