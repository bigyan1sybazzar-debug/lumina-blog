import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getPostBySlug,
  getPosts,
  incrementViewCount,
  getCommentsByPostId,
  addComment,
  toggleLikePost,
} from '../services/db';
import { BlogPost, Comment } from '../types';
import { Calendar, Clock, Share2, MessageSquare, Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReviewSection from '../components/ReviewSection';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Helmet } from 'react-helmet-async';

// ------------------------------------------------------------------
// HtmlRenderer – Clean up old Blogger-style image separators
// ------------------------------------------------------------------
interface HtmlRendererProps {
  children: React.ReactNode;
}

const HtmlRenderer: React.FC<HtmlRendererProps> = ({ children }) => {
  const content = React.Children.toArray(children).join('');
  const uglyHtmlPattern =
    /<h2[^>]*>(.*?)<\/h2>\s*<div\s+class="separator"\s+style="clear:\s*both;\s*text-align:\s*center;"><img\s+alt="(.*?)"\s+data-original-height="(\d+)"\s+data-original-width="(\d+)"\s+src="(.*?)"[^>]*><\/div>/si;

  const match = content.match(uglyHtmlPattern);

  if (match) {
    const h2Text = match[1].trim();
    const altText = match[2].trim();
    const imgSrc = match[5].trim();

    return (
      <div className="my-10 border-b border-gray-200 dark:border-gray-700 pb-8">
        <h3
          className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-6 leading-snug"
          id={h2Text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
        >
          {h2Text}
        </h3>
        <div className="text-center">
          <img
            src={imgSrc}
            alt={altText}
            className="max-w-full h-auto rounded-xl shadow-xl mx-auto transition-transform duration-300 hover:scale-[1.01] border border-gray-100 dark:border-gray-800"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

// ------------------------------------------------------------------
// MAIN COMPONENT – Fully SEO Optimized
// ------------------------------------------------------------------
export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const SITE_URL = "https://bigyann.com.np";

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      if (!slug) return;

      const p = await getPostBySlug(slug);

      if (p) {
        if (p.slug && slug !== p.slug) {
          navigate(`/${p.slug}`, { replace: true });
          return;
        }

        setPost(p);
        setLikeCount(p.likes?.length || 0);
        if (user && p.likes?.includes(user.id)) setIsLiked(true);

        incrementViewCount(p.id);
        const c = await getCommentsByPostId(p.id);
        setComments(c);

        const all = await getPosts();
        setRelatedPosts(
          all.filter((x) => x.id !== p.id && x.status === 'published').slice(0, 3)
        );
      }
      setLoading(false);
    };

    fetchData();
  }, [slug, user, navigate]);

  useEffect(() => {
    if (isCopied) {
      const t = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isCopied]);

  const handleLike = async () => {
    if (!user || !post) {
      alert('Please login to like posts');
      return;
    }
    const newStatus = await toggleLikePost(post.id, user.id);
    setIsLiked(newStatus);
    setLikeCount((prev) => (newStatus ? prev + 1 : prev - 1));
  };

  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => setIsCopied(true))
      .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setIsCopied(true);
      });
  };

  const scrollToComments = () => {
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Loading State (FIXED: Unique title but NO 'noindex' to satisfy Search Console)
  if (loading) {
    return (
      <>
        <Helmet>
          <title data-rh="true">Loading Content... | Bigyann</title>
        </Helmet>
        <div className="min-h-screen flex flex-col items-center justify-center dark:bg-gray-900 text-gray-500">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Illuminating content...</p>
        </div>
      </>
    );
  }

  // 2. Error State
  if (!post || (post.status !== 'published' && user?.id !== post.author.id && user?.role !== 'admin')) {
    return (
      <>
        <Helmet>
          <title data-rh="true">Post Not Found | Bigyann</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 text-white">
          Post not found or unavailable.
        </div>
      </>
    );
  }

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const canonicalUrl = `${SITE_URL}/${post.slug}`;
  const isoPublishDate = new Date(post.date).toISOString();
  const isoUpdateDate = post.updatedAt ? new Date(post.updatedAt).toISOString() : isoPublishDate;

  return (
    <>
      <Helmet>
        {/* Basic SEO - Putting Post Title First for Google visibility */}
        <title data-rh="true">{post.title} | Price, Specs & News - Bigyann</title>
        <meta name="description" content={post.excerpt} data-rh="true" />
        <link rel="canonical" href={canonicalUrl} data-rh="true" />
        <meta name="robots" content="index, follow, max-image-preview:large" data-rh="true" />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content={`${post.title} - Bigyann`} data-rh="true" />
        <meta property="og:description" content={post.excerpt} data-rh="true" />
        <meta property="og:image" content={post.coverImage} data-rh="true" />
        <meta property="og:url" content={canonicalUrl} data-rh="true" />
        <meta property="og:type" content="article" data-rh="true" />
        <meta property="og:site_name" content="Bigyann" data-rh="true" />
        <meta property="article:published_time" content={isoPublishDate} data-rh="true" />
        <meta property="article:modified_time" content={isoUpdateDate} data-rh="true" />
        <meta property="article:author" content={post.author.name} data-rh="true" />
        <meta property="article:section" content={post.category} data-rh="true" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" data-rh="true" />
        <meta name="twitter:title" content={post.title} data-rh="true" />
        <meta name="twitter:description" content={post.excerpt} data-rh="true" />
        <meta name="twitter:image" content={post.coverImage} data-rh="true" />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            'headline': post.title,
            'description': post.excerpt,
            'image': post.coverImage,
            'datePublished': isoPublishDate,
            'dateModified': isoUpdateDate,
            'author': {
              '@type': 'Person',
              'name': post.author.name,
              'url': `${SITE_URL}`,
            },
            'publisher': {
              '@type': 'Organization',
              'name': 'Bigyann',
              'logo': {
                '@type': 'ImageObject',
                'url': `${SITE_URL}/logo.png`,
              },
            },
            'mainEntityOfPage': {
              '@type': 'WebPage',
              '@id': canonicalUrl,
            },
            'wordCount': post.content.split(/\s+/).length,
            'keywords': post.tags?.join(', ') || post.category,
          })}
        </script>
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen pb-20">
        <div className="h-[50vh] w-full relative">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://placehold.co/1200x600/1F2937/F3F4F6?text=${encodeURIComponent(post.title)}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
          <div className="absolute bottom-0 w-full p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-gray-200 text-sm">
                <div className="flex items-center gap-3">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
                  />
                  <span className="font-medium">{post.author.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  {formattedDate}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  {post.readTime}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar Left: Actions */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 flex flex-col items-center space-y-6">
                <button
                  onClick={handleLike}
                  className={`p-4 rounded-full transition-all ${
                    isLiked
                      ? 'bg-red-50 text-red-600 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
                  <span className="block text-xs font-bold mt-1">{likeCount}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="relative p-4 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  <Share2 size={22} />
                  {isCopied && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded text-xs whitespace-nowrap">
                      Copied!
                    </div>
                  )}
                </button>

                <button
                  onClick={scrollToComments}
                  className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-green-50 hover:text-green-600 transition-all"
                >
                  <MessageSquare size={22} />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <article className="lg:col-span-8">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="lead text-xl italic text-gray-600 dark:text-gray-300 border-l-4 border-primary-500 pl-6 mb-10 font-serif">
                  {post.excerpt}
                </p>

                <div className="font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      html: ({ ...props }) => <HtmlRenderer>{props.children}</HtmlRenderer>,
                      h2: ({ ...props }) => (
                        <h2
                          className="text-3xl font-extrabold mt-12 mb-6 pb-3 border-b border-gray-200 dark:border-gray-700"
                          {...props}
                        />
                      ),
                      h3: ({ ...props }) => (
                        <h3
                          className="text-2xl font-bold mt-10 mb-4 pt-6 border-t border-gray-200 dark:border-gray-700"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>

                <div className="mt-20 p-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-6">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-24 h-24 rounded-full object-cover shadow-lg"
                  />
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      About {post.author.name}
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Tech enthusiast sharing insights on modern web technologies, AI,
                      and the future of digital experiences on Bigyann.
                    </p>
                  </div>
                </div>

                <div id="comments-section" className="mt-16">
                  {post.id && <ReviewSection postId={post.id} />}
                </div>
              </div>
            </article>

            {/* Sidebar Right: Related Posts */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24">
                <h3 className="text-xl font-bold mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
                  Related Posts
                </h3>
                <div className="space-y-8">
                  {relatedPosts.map((rp) => (
                    <Link
                      key={rp.id}
                      to={`/${rp.slug || rp.id}`}
                      className="block group transition-all hover:translate-x-1"
                    >
                      <div className="aspect-video rounded-xl overflow-hidden mb-4 shadow-md">
                        <img
                          src={rp.coverImage}
                          alt={rp.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 line-clamp-2">
                        {rp.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(rp.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};