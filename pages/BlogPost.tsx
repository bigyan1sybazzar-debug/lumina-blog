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
import HelmetProvider, { Helmet } from 'react-helmet-async';
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

  if (loading) {
    return (
      <><HelmetProvider>
        <Helmet>
          <title data-rh="true">Loading Content... | Bigyann</title>
        </Helmet></HelmetProvider>
        <div className="min-h-screen flex flex-col items-center justify-center dark:bg-gray-900 text-gray-500">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Illuminating content...</p>
        </div>
      </>
    );
  }

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
        <title data-rh="true">{post.title} | Price, Specs & News - Bigyann</title>
        <meta name="description" content={post.excerpt} data-rh="true" />
        <link rel="canonical" href={canonicalUrl} data-rh="true" />
        <meta name="robots" content="index, follow, max-image-preview:large" data-rh="true" />

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

        <meta name="twitter:card" content="summary_large_image" data-rh="true" />
        <meta name="twitter:title" content={post.title} data-rh="true" />
        <meta name="twitter:description" content={post.excerpt} data-rh="true" />
        <meta name="twitter:image" content={post.coverImage} data-rh="true" />

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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Sidebar Left: Actions - Relative container with calc/vw logic */}
            <div className="hidden lg:block lg:col-span-1 relative">
              <div 
                className="sticky top-24 flex flex-col items-center space-y-6"
                style={{ width: 'clamp(50px, 5vw, 80px)' }}
              >
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

                <div className="font-sans text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      html: ({ ...props }) => <HtmlRenderer>{props.children}</HtmlRenderer>,
                      h2: ({ ...props }) => (
                        <h2 className="text-3xl font-extrabold mt-12 mb-6 pb-3 border-b-2 border-primary-500 dark:border-primary-800 text-gray-900 dark:text-white uppercase tracking-tight" {...props} />
                      ),
                      h3: ({ ...props }) => (
                        <h3 className="text-2xl font-bold mt-10 mb-4 text-primary-600 dark:text-primary-400 flex items-center gap-2" {...props} />
                      ),
                      h4: ({ ...props }) => (
                        <h4 className="text-xl font-bold mt-8 mb-3 text-gray-800 dark:text-gray-100 italic" {...props} />
                      ),
                      table: ({ ...props }) => (
                        <div className="my-8 w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm scrollbar-thin scrollbar-thumb-gray-300">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-auto" {...props} />
                        </div>
                      ),
                      thead: ({ ...props }) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
                      th: ({ ...props }) => <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider" {...props} />,
                      td: ({ ...props }) => <td className="px-4 py-3 text-sm border-t border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300" {...props} />,
                      ul: ({ ...props }) => <ul className="space-y-4 my-6 list-none pl-0" {...props} />,
                      li: ({ children }) => (
                        <li className="flex items-start gap-3 group">
                          <span className="mt-2 h-2 w-2 rounded-full bg-primary-500 group-hover:scale-125 transition-transform shrink-0" />
                          <div className="text-gray-700 dark:text-gray-300 leading-snug">{children}</div>
                        </li>
                      ),
                      blockquote: ({ ...props }) => (
                        <blockquote className="border-l-4 border-primary-500 bg-primary-50/30 dark:bg-primary-900/10 p-6 my-8 rounded-r-xl italic font-medium" {...props} />
                      ),
                      strong: ({ ...props }) => <strong className="font-bold text-gray-900 dark:text-white bg-primary-50 dark:bg-primary-900/20 px-1 rounded" {...props} />,
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>

                <div className="mt-20 p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div className="relative">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-28 h-28 rounded-2xl object-cover shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-1.5 rounded-lg shadow-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                      {post.author.name}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      Tech enthusiast sharing insights on modern web technologies, AI,
                      and the future of digital experiences on <strong>Bigyann</strong>.
                    </p>
                  </div>
                </div>

                <div id="comments-section" className="mt-16">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold">Comment, Discuss and post Your Reviews</h2>
                    <div className="h-px flex-grow bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  {post.id && <ReviewSection postId={post.id} />}
                </div>
              </div>
            </article>

            {/* Sidebar Right: Related Posts - Responsive floating card logic applied */}
            <aside className="hidden lg:block lg:col-span-3 relative">
              <div 
                className="sticky top-24 overflow-visible"
                style={{ width: 'calc(18vw + 40px)' }}
              >
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
                      <div className="aspect-video rounded-xl overflow-hidden mb-4 shadow-md relative">
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