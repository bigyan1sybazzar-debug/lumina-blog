import { BlogPost } from '../types';

/**
 * Generate JSON-LD Article Schema with headings and FAQs
 */
export const generateArticleSchema = (post: BlogPost, canonicalUrl: string) => {
    // Extract headings from content
    const headingMatches = post.content.match(/^##\s+(.+)$/gm) || [];
    const headings = headingMatches.map(h => h.replace(/^##\s+/, '').trim());

    // Extract FAQs (looking for Q: and A: patterns or heading + paragraph patterns)
    const faqPattern = /(?:Q:|Question:)\s*(.+?)\n(?:A:|Answer:)\s*(.+?)(?=\n(?:Q:|Question:)|\n##|$)/gis;
    const faqMatches = [...post.content.matchAll(faqPattern)];

    const faqs = faqMatches.map(match => ({
        "@type": "Question" as const,
        "name": match[1].trim(),
        "acceptedAnswer": {
            "@type": "Answer" as const,
            "text": match[2].trim()
        }
    }));

    // Base Article Schema
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.seo?.metaTitle || post.title,
        "description": post.seo?.metaDescription || post.excerpt,
        "image": post.coverImage,
        "author": {
            "@type": "Person",
            "name": post.author.name,
            "url": `https://bigyann.com.np/u/${post.author.id}`
        },
        "publisher": {
            "@type": "Organization",
            "name": "Bigyann",
            "logo": {
                "@type": "ImageObject",
                "url": "https://bigyann.com.np/logo.png"
            }
        },
        "datePublished": new Date(post.date).toISOString(),
        "dateModified": post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date(post.date).toISOString(),
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl
        },
        "articleSection": post.category,
        "keywords": post.seo?.focusKeywords?.join(', ') || post.tags?.join(', ') || '',
        ...(headings.length > 0 && {
            "articleBody": headings.join(' | ')
        })
    };

    // FAQ Schema (if FAQs found)
    const faqSchema = faqs.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs
    } : null;

    // BreadcrumbList Schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://bigyann.com.np"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": post.category,
                "item": `https://bigyann.com.np/categories?category=${encodeURIComponent(post.category)}`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": canonicalUrl
            }
        ]
    };

    return {
        articleSchema,
        faqSchema,
        breadcrumbSchema
    };
};
