import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  getPostBySlug, 
  getPosts, 
  incrementViewCount, 
  getCommentsByPostId, 
  addComment,  
  toggleLikePost 
} from '../services/db'; 
import { BlogPost, Comment } from '../types';
import { Calendar, Clock, Share2, MessageSquare, Heart, Loader2, Send, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Components
import ReviewSection from '../components/ReviewSection'; 

// Markdown
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; 

// SEO: Add Helmet for dynamic <head> tags
import { Helmet } from 'react-helmet-async';

// ------------------------------------------------------------------
// Custom Component to handle ugly HTML Headings (kept unchanged)
// ------------------------------------------------------------------
interface HtmlRendererProps {
  children: React.ReactNode;
}

const HtmlRenderer: React.FC<HtmlRendererProps> = ({ children }) => {
  const content = React.Children.toArray(children).join('');
  const uglyHtmlPattern = /<h2[^>]*>(.*?)<\/h2>\s*<div\s+class="separator"\s+style="clear:\s*both;\s*text-align:\s*center;"><img\s+alt="(.*?)"\s+data-original-height="(\d+)"\s+data-original-width="(\d+)"\s+src="(.*?)"[^>]*><\/div>/si;
  
  const match = content.match(uglyHtmlPattern);

  if (match) {
    const h2Text = match[1].trim(); 
    const altText = match[2].trim();
    const imgSrc = match[5].trim();
    
    return (
      <div className="my-10 border-b border-gray-200 dark:border-gray-700 pb-4">
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
// MAIN COMPONENT
// ------------------------------------------------------------------
export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>(); 
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      if (slug) {
        const p = await getPostBySlug(slug); 
        setPost(p);
        
        if (p) {
          // SEO FIX: Redirect from ID-based URL to canonical slug URL
          if (p.slug && slug !== p.slug) {
            console.log("Redirecting to canonical slug:", p.slug);
            navigate(`/blog/${p.slug}`, { replace: true });
            return;
          }

          setLikeCount(p.likes?.length || 0);
          if (user && p.likes?.includes(user.id)) {
            setIsLiked(true);
          }
          
          incrementViewCount(p.id);

          const c = await getCommentsByPostId(p.id);
          setComments(c);

          const all = await getPosts();
          setRelatedPosts(all.filter(x => x.id !== p.id && x.status === 'published').slice(0, 3));
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [slug, user, navigate]); 
  
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleLike = async () => {
    if (!user || !post) {
      alert("Please login to like posts");
      return;
    }
    const newStatus = await toggleLikePost(post.id, user.id); 
    setIsLiked(newStatus);
    setLikeCount(prev => newStatus ? prev + 1 : prev - 1);
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setIsCopied(true);
    }
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
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">
        <Loader2 className="animate-spin mr-2"/> Loading...
      </div>
    );
  }

  if (!post || (post.status !== 'published' && user?.id !== post.author.id && user?.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">
        Post not found.
      </div>
    );
  }
  
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const canonicalUrl = `https://bigyann.com.np/blog/${post.slug}`;

  return (
    <>
      {/* Dynamic SEO Tags */}
      <Helmet>
        <title>{post.title} | Bigyann</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Social Sharing */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.coverImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Bigyann" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.coverImage} />
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen pb-20">
        {/* Header Image */}
        <div className="h-[50vh] w-full relative">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.currentTarget.onerror = null; 
              e.currentTarget.src = `https://placehold.co/1200x600/1F2937/F3F4F6?text=Image+Unavailable`; 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
              <span className="inline-block px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-md mb-4 uppercase tracking-wider">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center text-gray-200 text-sm space-x-6">
                <div className="flex items-center space-x-2">
                  <img 
                    src={post.author.avatar} 
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" 
                    alt="Author" 
                    onError={(e) => {
                      e.currentTarget.onerror = null; 
                      e.currentTarget.src = `https://placehold.co/40x40/6B7280/FFFFFF?text=${post.author.name.charAt(0)}`; 
                    }}
                  />
                  <span className="font-medium text-white">{post.author.name}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" /> {formattedDate}
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" /> {post.readTime}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Sidebar: Social Buttons */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 flex flex-col space-y-6 items-center">
                <button 
                  onClick={handleLike}
                  className={`p-3 rounded-full transition-colors ${
                    isLiked 
                      ? 'bg-red-50 text-red-600' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Like this post"
                >
                  <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                  <span className="text-xs font-bold block mt-1 text-center">{likeCount}</span>
                </button>
                
                <button 
                  onClick={handleShare}
                  className="relative p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors group"
                  title="Share this post"
                >
                  <Share2 size={20} />
                  {isCopied && (
                    <div className="absolute top-1/2 right-full -translate-y-1/2 mr-3 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-lg whitespace-nowrap">
                      Copied!
                    </div>
                  )}
                </button>
                
                <button 
                  onClick={scrollToComments}
                  className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors"
                  title="Go to comments"
                >
                  <MessageSquare size={20} />
                </button>
              </div>
            </div>

            {/* Main Article */}
            <article className="lg:col-span-8">
              <div className="prose prose-lg dark:prose-invert max-w-none prose-a:text-primary-600 hover:prose-a:text-primary-500">
                <p className="lead text-xl text-gray-600 dark:text-gray-300 font-serif italic mb-8 border-l-4 border-primary-500 pl-4">
                  {post.excerpt}
                </p>
                
                <div className="font-serif text-gray-800 dark:text-gray-200">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      html: ({ node, ...props }) => <HtmlRenderer>{props.children}</HtmlRenderer>,
                      h2: ({ node, ...props }) => (
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-10 mb-4" {...props} />
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Author Bio */}
              <div className="mt-16 p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-6">
                <img 
                  src={post.author.avatar} 
                  alt="Author" 
                  className="w-20 h-20 rounded-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.onerror = null; 
                    e.currentTarget.src = `https://placehold.co/80x80/10B981/FFFFFF?text=${post.author.name.charAt(0)}`; 
                  }}
                />
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">About {post.author.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Tech enthusiast and senior developer sharing insights on the latest web technologies.
                  </p>
                </div>
              </div>

              {/* Reviews */}
              <div id="reviews-section" className="mt-12">
                {post.id && <ReviewSection postId={post.id} />} 
              </div>
              
              
            </article>

            {/* Right Sidebar: Related Posts */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Related Posts
                </h3>
                <div className="space-y-6">
                  {relatedPosts.map(rp => (
                    <Link to={`/blog/${rp.slug || rp.id}`} key={rp.id} className="block group">
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                        <img 
                          src={rp.coverImage} 
                          alt={rp.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.onerror = null; 
                            e.currentTarget.src = `https://placehold.co/400x225/1F2937/F3F4F6?text=Related`; 
                          }}
                        />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                        {rp.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(rp.date).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                  {relatedPosts.length === 0 && (
                    <p className="text-sm text-gray-500">No related posts found.</p>
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
