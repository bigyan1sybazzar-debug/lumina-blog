import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { getPostById, getPosts, incrementViewCount, getCommentsByPostId, addComment, toggleLikePost } from '../services/db';
import { BlogPost, Comment } from '../types';
import { Calendar, Clock, Share2, MessageSquare, Heart, Loader2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ⭐ NEW IMPORT: Review Section Component
import ReviewSection from '../components/ReviewSection'; 

// NEW IMPORTS for Markdown Rendering
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // <-- Enables HTML rendering

const { useParams, Link, useLocation } = ReactRouterDOM;

// ------------------------------------------------------------------
// ⭐ Custom Component to handle ugly HTML Headings (Unchanged)
// ------------------------------------------------------------------

interface HtmlRendererProps {
  children: React.ReactNode;
}

// Function to clean up and render messy heading HTML
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
// END: Custom Component
// ------------------------------------------------------------------


export const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation(); // Used for redirection state
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      if (id) {
        const p = await getPostById(id);
        setPost(p);
        
        if (p) {
          setLikeCount(p.likes?.length || 0);
          if (user && p.likes?.includes(user.id)) {
            setIsLiked(true);
          }
        }

        // Background update view count
        incrementViewCount(id);

        // Fetch comments
        const c = await getCommentsByPostId(id);
        setComments(c);

        // Fetch other posts for related
        const all = await getPosts();
        // Filter out the current post and only show published ones
        setRelatedPosts(all.filter(x => x.id !== id && x.status === 'published').slice(0, 2));
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const handleLike = async () => {
    if (!user || !post) {
      alert("Please log in to like this post.");
      return;
    }
    const newStatus = await toggleLikePost(post.id, user.id);
    setIsLiked(newStatus);
    setLikeCount(prev => newStatus ? prev + 1 : prev - 1);
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard! ✅");
  };

  const scrollToComments = () => {
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // NOTE: You might want to update this function to scroll to the reviews section too.
  const scrollToReviews = () => {
    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
  };
  

  const handleSubmitComment = async () => {
    if (!user || !id || !newComment.trim()) return;
  
    const commentData = {
      postId: id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
  
    await addComment(commentData);
  
    setComments([
      { ...commentData, id: `temp-${Date.now()}` } as Comment,
      ...comments
    ]);
    setNewComment('');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center dark:text-white"><Loader2 className="animate-spin mr-2"/> Loading...</div>;
  }

  if (!post || (post.status !== 'published' && user?.id !== post.author.id && user?.role !== 'admin')) {
    return <div className="min-h-screen flex items-center justify-center dark:text-white">Post not found or access denied.</div>;
  }

  // Simulated TOC generation for demo
  const toc = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'main-points', title: 'Main Concepts' },
    { id: 'conclusion', title: 'Conclusion' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen pb-20">
      {/* Header Image */}
      <div className="h-[50vh] w-full relative">
        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
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
                <img src={post.author.avatar} className="w-10 h-10 rounded-full border-2 border-white/20" alt="Author" />
                <span className="font-medium text-white">{post.author.name}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" /> {post.date}
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
          
          {/* Sidebar Left: Social (Sticky) */}
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
                className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                title="Share this post"
              >
                <Share2 size={20} />
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

          {/* Main Content */}
          <article className="lg:col-span-8">
            <div className="prose prose-lg dark:prose-invert max-w-none prose-a:text-primary-600 hover:prose-a:text-primary-500">
              <p className="lead text-xl text-gray-600 dark:text-gray-300 font-serif italic mb-8 border-l-4 border-primary-500 pl-4">
                {post.excerpt}
              </p>
              
              {/* === START: UPDATED CONTENT RENDERING with CUSTOM RENDERER === */}
              <div className="font-serif text-gray-800 dark:text-gray-200">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    // Override H2 rendering to use the custom component
                    components={{
                      // This applies the custom rendering logic to any raw HTML block that might contain the H2 structure
                      html: ({ node, ...props }) => <HtmlRenderer>{props.children}</HtmlRenderer>,
                      // This ensures standard Markdown H2 tags are also well-styled
                      h2: ({ node, ...props }) => (
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-10 mb-4" {...props} />
                      ),
                    }}
                >
                    {post.content}
                </ReactMarkdown>
              </div>
              {/* === END: UPDATED CONTENT RENDERING with CUSTOM RENDERER === */}
            </div>
{/* Author Bio Box */}
<div className="mt-16 p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-6">
              <img src={post.author.avatar} alt="Author" className="w-20 h-20 rounded-full" />
              <div className="text-center md:text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">About {post.author.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Tech enthusiast and senior developer sharing insights on the latest web technologies.
                </p>
              </div>
            </div>
            {/* ------------------------------------------- */}
            {/* ⭐ NEW: REVIEWS SECTION IS PLACED HERE ⭐ */}
            {/* ------------------------------------------- */}
            {id && <ReviewSection postId={id} />}

            

           
          </article>

          {/* Sidebar Right: TOC & Related */}
          <aside className="hidden lg:block lg:col-span-3 space-y-8">
            <div className="sticky top-24 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 uppercase text-xs tracking-wider">Table of Contents</h4>
                <nav>
                  <ul className="space-y-3 text-sm">
                    {toc.map(item => (
                      <li key={item.id}>
                        <a href={`#`} className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 block border-l-2 border-transparent hover:border-primary-500 pl-3 transition-colors">
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 uppercase text-xs tracking-wider">Related Posts</h4>
                <div className="space-y-4">
                  {relatedPosts.map(p => (
                    <Link key={p.id} to={`/blog/${p.id}`} className="group block">
                      <div className="aspect-video rounded-lg overflow-hidden mb-2">
                        <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <h5 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-primary-600">{p.title}</h5>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};