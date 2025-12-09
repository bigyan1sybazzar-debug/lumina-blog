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

  // Fetch post + related data
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      if (!slug) return;

      const p = await getPostBySlug(slug);
      setPost(p);

      if (p) {
        // Redirect to canonical slug if needed
        if (p.slug && slug !== p.slug) {
          navigate(`/blog/${p.slug}`, { replace: true });
          return;
        }

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

  // Auto-hide "Copied!" toast
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

  const handleSubmitComment = async () => {
    if (!user || !post || !newComment.trim()) return;

    const commentData: Omit<Comment, 'id'> = {
      postId: post.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    const tempComment = { ...commentData, id: `temp-${Date.now()}` } as Comment;
    setComments([tempComment, ...comments]);
    setNewComment('');

    await addComment(commentData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <Loader2 className="animate-spin mr-3" size={28} />
        Loading...
      </div>
    );
  }

  if (!post || (post.status !== 'published' && user?.id !== post.author.id && user?.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        Post not found.
      </div>
    );
  }

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const canonicalUrl = `https://bigyann.com.np/blog/${post.slug}`;

  return (
    <>
      {/* ==================== ULTIMATE SEO HEAD ==================== */}
      <Helmet>
  {/* Basic */}
  <title>{post.title} | Bigyann</title>
  <meta name="description" content={post.excerpt} />
  <link rel="canonical" href={canonicalUrl} />

  {/* Open Graph – Facebook, LinkedIn, WhatsApp, etc. */}
  <meta property="og:title" content={`${post.title} | Bigyann`} />
  <meta property="og:description" content={post.excerpt} />
  {/* Add itemProp for image confirmation (supplementary) */}
  <meta property="og:image" content={post.coverImage} itemProp="image" /> 
  <meta property="og:image:alt" content={post.title} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Bigyann" />
  <meta property="og:locale" content="en_US" />
  <meta property="article:published_time" content={post.date} />
  {/* ✅ ADDED: article:modified_time for better freshness signal */}
  <meta property="article:modified_time" content={post.updatedAt || post.date} /> 
  <meta property="article:author" content={post.author.name} />
  <meta property="article:section" content={post.category} />

  {/* Twitter Cards */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@bigyann" />
  <meta name="twitter:creator" content="@bigyann" />
  <meta name="twitter:title" content={`${post.title} | Bigyann`} />
  <meta name="twitter:description" content={post.excerpt} />
  <meta name="twitter:image" content={post.coverImage} />
  <meta name="twitter:image:alt" content={post.title} />
  {/* ✅ ADDED: twitter:label & twitter:data for read time UX */}
  <meta name="twitter:label1" content="Reading time" />
  <meta name="twitter:data1" content={post.readTime} /> 

  {/* Favicon & App Icons (No changes needed, already great) */}
  <link rel="icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/logo192.png" />

  {/* Structured Data – Google Rich Results (No changes needed, already perfect) */}
  <script type="application/ld+json">
    {JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      image: post.coverImage,
      author: {
        '@type': 'Person',
        name: post.author.name,
        url: `https://bigyann.com.np/author/${post.author.id}`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Bigyann',
        logo: {
          '@type': 'ImageObject',
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAe1BMVEX////78vL45ufrlZvbACPcFDLcFTLbACLdK0LdLkTdKEDcJD745OX45+jcHTriYmzngYLbESngTVz21tfdJzPjdX/ur7LcGTbqmqD++fnYAAD33uDvt7voiIvbISrhW1/dMjr1ztLdNUvfRFbso6Tng4vhWWTmfH7lc3pUlbFDAAAApklEQVR4AbWSAw7AAAxFO9u2cf8Tzu4W7oU/NeBPCPIGATsUzbAXGI7a42heuMNtsSQ7a1EaEVcjI8OCMhtVTR/RDB4xiuYiLJt/GlUHFlwPN/qSE4wKN1JcqED0Ehk7MUCivteMUty4kkl4Q3meABQe3hAjSQqQJY9GllU9rgGPXGieRrFaRFAzyOKlthvpS2NdPHIyib+djOA+jj3uFH+T7wf7hwE23xD0wroPdwAAAABJRU5ErkJggg==',
        },
      },
      datePublished: post.date,
      dateModified: post.updatedAt || post.date,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      wordCount: post.content.split(/\s+/).length,
      keywords: post.tags?.join(', ') || post.category,
    })}
  </script>
</Helmet>

      {/* ==================== PAGE CONTENT ==================== */}
      <div className="bg-white dark:bg-gray-900 min-h-screen pb-20">
        {/* Hero Header */}
        <div className="h-[50vh] w-full relative">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://placehold.co/1200x600/1F2937/F3F4F6?text=${encodeURIComponent(
                post.title
              )}`;
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
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://placehold.co/40x40/6B7280/FFFFFF?text=${post.author.name[0]}`;
                    }}
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

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Sticky Social */}
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

            {/* Article Body */}
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
                      html: ({ node, ...props }) => <HtmlRenderer>{props.children}</HtmlRenderer>,
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-3xl font-extrabold mt-12 mb-6 pb-3 border-b border-gray-200 dark:border-gray-700"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-2xl font-bold mt-10 mb-4 pt-6 border-t border-gray-200 dark:border-gray-700"
                          {...props}
                        />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4 className="text-xl font-semibold mt-8 mb-3" {...props} />
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>

                {/* Author Bio */}
                <div className="mt-20 p-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-6">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-24 h-24 rounded-full object-cover shadow-lg"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://placehold.co/96x96/10B981/FFFFFF?text=${post.author.name[0]}`;
                    }}
                  />
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      About {post.author.name}
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Tech enthusiast and senior developer sharing insights on modern web technologies, AI,
                      design, and the future of digital experiences.
                    </p>
                  </div>
                </div>

                {/* Reviews Section */}
                <div id="reviews-section" className="mt-16">
                  {post.id && <ReviewSection postId={post.id} />}
                </div>
              </div>
            </article>

            {/* Right Sidebar – Related Posts */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24">
                <h3 className="text-xl font-bold mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
                  Related Posts
                </h3>
                <div className="space-y-8">
                  {relatedPosts.map((rp) => (
                    <Link
                      key={rp.id}
                      to={`/blog/${rp.slug || rp.id}`}
                      className="block group transition-all hover:translate-x-1"
                    >
                      <div className="aspect-video rounded-xl overflow-hidden mb-4 shadow-md">
                        <img
                          src={rp.coverImage}
                          alt={rp.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://placehold.co/400x225/1F2937/F3F4F6?text=Related`;
                          }}
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
                  {relatedPosts.length === 0 && (
                    <p className="text-gray-500 text-sm">No related posts yet.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};