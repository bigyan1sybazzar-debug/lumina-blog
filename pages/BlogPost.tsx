import React, { useEffect, useState, useContext, createContext, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Calendar, Clock, Share2, MessageSquare, Heart, Loader2, Send } from 'lucide-react';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

const { useParams, Link, useLocation } = ReactRouterDOM;

// ------------------------------------------------------------------
// ⭐ 1. MOCK TYPES (Moved from ../types)
// ------------------------------------------------------------------
interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
}

interface Author {
  id: string;
  name: string;
  avatar: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  date: string;
  readTime: string;
  author: Author;
  status: 'draft' | 'published';
  views: number;
  likes: string[]; // Array of User IDs who liked the post
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

// ------------------------------------------------------------------
// ⭐ 2. FIREBASE & AUTH SETUP (Simulated ../context/AuthContext)
// ------------------------------------------------------------------

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-blog-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Mock Auth Context
interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAuthReady: false });

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const signInUser = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase Auth failed:", error);
      }
    };

    signInUser();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Use a consistent mock user structure or retrieve actual user profile
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.isAnonymous ? 'Guest User' : `User ${firebaseUser.uid.substring(0, 4)}`,
          avatar: `https://placehold.co/40x40/94A3B8/FFFFFF?text=${firebaseUser.uid.substring(0, 1)}`,
          role: firebaseUser.uid === 'admin-mock-id' ? 'admin' : 'user', // Mock admin for testing
        });
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({ user, isAuthReady }), [user, isAuthReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

// ------------------------------------------------------------------
// ⭐ 3. MOCK DB SERVICES (Simulated ../services/db)
// ------------------------------------------------------------------

// Firestore path definitions
const PUBLIC_POSTS_COLLECTION = `artifacts/${appId}/public/data/posts`;
const COMMENTS_COLLECTION = `artifacts/${appId}/public/data/comments`;

// Helper to ensure data integrity
const formatPost = (docSnap: any): BlogPost | null => {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title || 'Untitled Post',
    excerpt: data.excerpt || '',
    content: data.content || 'No content provided.',
    category: data.category || 'General',
    coverImage: data.coverImage || `https://placehold.co/1200x600/1E3A8A/FFFFFF?text=${data.title || 'Blog'}`,
    date: data.date || 'Jan 1, 2024',
    readTime: data.readTime || '5 min read',
    author: data.author || { id: 'mock-id', name: 'Mock Author', avatar: 'https://placehold.co/40x40/10B981/FFFFFF?text=A' },
    status: data.status || 'draft',
    views: data.views || 0,
    likes: data.likes || [],
  } as BlogPost;
};

const formatComment = (docSnap: any): Comment | null => {
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
        id: docSnap.id,
        postId: data.postId,
        userId: data.userId,
        userName: data.userName || 'Anonymous',
        userAvatar: data.userAvatar || 'https://placehold.co/40x40/333333/FFFFFF?text=G',
        content: data.content,
        createdAt: data.createdAt,
    } as Comment;
};


const getPostById = async (postId: string): Promise<BlogPost | null> => {
  try {
    const docRef = doc(db, PUBLIC_POSTS_COLLECTION, postId);
    const docSnap = await getDoc(docRef);
    return formatPost(docSnap);
  } catch (e) {
    console.error("Error getting post:", e);
    return null;
  }
};

const getPosts = async (): Promise<BlogPost[]> => {
  try {
    const q = query(collection(db, PUBLIC_POSTS_COLLECTION));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(formatPost).filter(p => p !== null) as BlogPost[];
  } catch (e) {
    console.error("Error getting posts:", e);
    return [];
  }
};

const incrementViewCount = async (postId: string) => {
  try {
    const docRef = doc(db, PUBLIC_POSTS_COLLECTION, postId);
    const postSnap = await getDoc(docRef);
    if (postSnap.exists()) {
      const currentViews = postSnap.data().views || 0;
      await updateDoc(docRef, { views: currentViews + 1 });
    }
  } catch (e) {
    console.warn("Could not increment view count:", e);
  }
};

const getCommentsByPostId = async (postId: string): Promise<Comment[]> => {
  try {
    const q = query(collection(db, COMMENTS_COLLECTION), where('postId', '==', postId));
    const querySnapshot = await getDocs(q);
    
    // Sort comments by createdAt descending (newest first)
    const comments = querySnapshot.docs.map(formatComment).filter(c => c !== null) as Comment[];
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("Error getting comments:", e);
    return [];
  }
};

const addComment = async (commentData: Omit<Comment, 'id'>): Promise<Comment | null> => {
  try {
    const collectionRef = collection(db, COMMENTS_COLLECTION);
    const docRef = await addDoc(collectionRef, commentData);
    return { id: docRef.id, ...commentData } as Comment;
  } catch (e) {
    console.error("Error adding comment:", e);
    return null;
  }
};

const toggleLikePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, PUBLIC_POSTS_COLLECTION, postId);
    const postSnap = await getDoc(docRef);
    if (!postSnap.exists()) return false;

    const postData = postSnap.data();
    const currentLikes: string[] = postData.likes || [];
    let newLikes: string[];
    let isNowLiked: boolean;

    if (currentLikes.includes(userId)) {
      // Unlike
      newLikes = currentLikes.filter(id => id !== userId);
      isNowLiked = false;
    } else {
      // Like
      newLikes = [...currentLikes, userId];
      isNowLiked = true;
    }

    await updateDoc(docRef, { likes: newLikes });
    return isNowLiked;
  } catch (e) {
    console.error("Error toggling like:", e);
    return false;
  }
};


// ------------------------------------------------------------------
// Custom Component to handle ugly HTML Headings
// ------------------------------------------------------------------

interface HtmlRendererProps {
  children: React.ReactNode;
}

/**
 * Custom component to analyze raw HTML content, specifically targeting and
 * cleaning up a messy, old pattern of H2 followed by a separator/image div.
 * If the pattern is found, it renders a clean, styled version. Otherwise,
 * it renders the raw HTML content.
 */
const HtmlRenderer: React.FC<HtmlRendererProps> = ({ children }) => {
  // Convert children to a string to analyze the raw HTML/Markdown content
  const content = React.Children.toArray(children).join('');

  // Regex to detect the old, messy <h2>...<div class="separator"... structure
  // This looks for an H2 tag followed immediately by the separator div containing an image.
  const uglyHtmlPattern = /<h2[^>]*>(.*?)<\/h2>\s*<div\s+class="separator"\s+style="clear:\s*both;\s*text-align:\s*center;"><img\s+alt="(.*?)"\s+data-original-height="(\d+)"\s+data-original-width="(\d+)"\s+src="(.*?)"[^>]*><\/div>/si;
  
  const match = content.match(uglyHtmlPattern);

  if (match) {
    // Group 1: H2 text content
    const h2Text = match[1].trim(); 
    // Group 2: Image alt text
    const altText = match[2].trim();
    // Group 5: Image src URL
    const imgSrc = match[5].trim();
    
    // Render the attractive, cleaned-up JSX
    return (
      <div className="my-10 border-b border-gray-200 dark:border-gray-700 pb-4">
        {/* Clean, attractive heading (using h3 here for hierarchy) */}
        <h3 
          className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-6 leading-snug"
          // Generate a simple ID for linking/TOC
          id={h2Text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
        >
          {h2Text}
        </h3>
        {/* Clean, styled image container */}
        <div className="text-center">
          <img 
            src={imgSrc} 
            alt={altText} 
            className="max-w-full h-auto rounded-xl shadow-xl mx-auto transition-transform duration-300 hover:scale-[1.01] border border-gray-100 dark:border-gray-800" 
            loading="lazy"
            // Simple placeholder fallback logic
            onError={(e: any) => e.target.onerror = null && (e.target.src = "https://placehold.co/800x400/CCCCCC/000000?text=Image+Load+Failed")}
          />
        </div>
      </div>
    );
  }

  // If it's not the ugly pattern, just render the children as raw HTML/Markdown output
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
};


// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------

const BlogPostPageContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthReady } = useAuth();
  const location = useLocation(); // Used for redirection state
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Effect for fetching post details, view count increment, and initial likes/comments
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isAuthReady || !id) return; // Wait for auth to be ready

    const fetchData = async () => {
      setLoading(true);
      const p = await getPostById(id);
      setPost(p);
      
      if (p) {
        setLikeCount(p.likes?.length || 0);
        if (user && p.likes?.includes(user.id)) {
          setIsLiked(true);
        } else {
          setIsLiked(false);
        }
      }

      // Increment view count (fire and forget)
      incrementViewCount(id);

      // Fetch comments
      const c = await getCommentsByPostId(id);
      setComments(c);

      // Fetch other posts for related
      const all = await getPosts();
      // Filter out the current post and only show published ones
      setRelatedPosts(all.filter(x => x.id !== id && x.status === 'published').slice(0, 2));
      
      setLoading(false);
    };
    fetchData();
  }, [id, user, isAuthReady]);

  // Real-time listener for comments (optional, but good practice for interactive data)
  useEffect(() => {
    if (!isAuthReady || !id) return;

    const q = query(collection(db, COMMENTS_COLLECTION), where('postId', '==', id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const updatedComments = snapshot.docs
            .map(formatComment)
            .filter(c => c !== null) as Comment[];
            
        // Sort comments by createdAt descending (newest first) for real-time updates
        setComments(updatedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
        console.error("Failed to listen for real-time comment updates:", error);
    });

    return () => unsubscribe();
  }, [id, isAuthReady]);


  const handleLike = async () => {
    if (!user || !post) {
      // Note: Use a custom modal/toast instead of console.log in final app
      console.log("LOGIN_REQUIRED: Please log in to like this post.");
      return;
    }
    const newStatus = await toggleLikePost(post.id, user.id);
    setIsLiked(newStatus);
    setLikeCount(prev => newStatus ? prev + 1 : prev - 1);
  };

  const handleShare = () => {
    // Using document.execCommand('copy') for better iframe compatibility
    document.execCommand('copy', false, window.location.href); 
    // Note: Use a custom modal/toast instead of console.log in final app
    console.log("Link copied to clipboard!");
  };

  const scrollToComments = () => {
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitComment = async () => {
    if (!user || !id || !newComment.trim()) return;

    const commentData: Omit<Comment, 'id'> = {
      postId: id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: newComment,
      createdAt: new Date().toISOString()
    };

    const savedComment = await addComment(commentData);
    
    if (savedComment) {
        // The real-time listener will handle updating the state, 
        // but we clear the input immediately.
        setNewComment('');
    } else {
        // Handle error: e.g., show a toast notification
        console.error("Failed to post comment.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center dark:text-white"><Loader2 className="animate-spin mr-2"/> Loading...</div>;
  }

  if (!post || (post.status !== 'published' && user?.id !== post.author.id && user?.role !== 'admin')) {
    return <div className="min-h-screen flex items-center justify-center dark:text-white">Post not found or access denied.</div>;
  }

  // Simulated TOC generation (In a real app, this should parse headings from post.content)
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
                    // Override H2 and raw HTML rendering to use the custom component for cleanup
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

            {/* Comments Section */}
            <div id="comments-section" className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Comments ({comments.length})</h3>
              
              {user ? (
                <div className="mb-8">
                  <div className="flex gap-4">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <textarea 
                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                        rows={3}
                        placeholder="Join the discussion..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      ></textarea>
                      <button 
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim()}
                        className="mt-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center"
                      >
                        <Send size={16} className="mr-2" /> Post Comment
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl mb-8 text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Log in to leave a comment.</p>
                  <Link to="/login" state={{ from: location.pathname }} className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
                    Log In
                  </Link>
                </div>
              )}

              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <img src={comment.userAvatar} alt={comment.userName} className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-gray-900 dark:text-white">{comment.userName}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                )}
              </div>
            </div>
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
                        <a href={`#${item.id}`} className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 block border-l-2 border-transparent hover:border-primary-500 pl-3 transition-colors">
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


// ------------------------------------------------------------------
// Main Export Component with Auth Provider Wrapper
// ------------------------------------------------------------------

/**
 * Wraps the BlogPostPageContent in the AuthProvider to make it runnable 
 * in a self-contained environment.
 */
const App = () => {
    return (
        <AuthProvider>
            <BlogPostPageContent />
        </AuthProvider>
    );
};

export default App;