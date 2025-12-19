// src/pages/Home.tsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getPosts } from '../services/db';
import { BlogPost } from '../types';
import { PostCard } from '../components/PostCard';
import { ArrowRight, Loader2, Sparkles, Send, ChevronLeft, ChevronRight, Hash, TrendingUp, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import HelmetProvider, { Helmet } from 'react-helmet-async';
import { Calculator, RefreshCw, LogIn, FileText, Edit } from 'lucide-react';

// Import the hook but don't call it directly at top level
import { useAuth } from '../context/AuthContext';

export const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [heroFeatured, setHeroFeatured] = useState<BlogPost[]>([]);
  const [editorPicks, setEditorPicks] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Auth state — starts as null (safe for SSG)
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch posts (unchanged)
  const fetchPosts = async (): Promise<BlogPost[]> => {
    for (let i = 0; i < 4; i++) {
      try {
        const result = await getPosts();
        return Array.isArray(result) ? result : [];
      } catch (err) {
        if (i === 3) {
          console.error('Failed to fetch posts after 4 attempts');
          return [];
        }
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    return [];
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Load posts
      const data = await fetchPosts();
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPosts(sorted);
      setEditorPicks(sorted.slice(0, 8));

      // Load hero featured posts
      try {
        const configDoc = await getDoc(doc(db, 'config', 'featured'));
        if (configDoc.exists()) {
          const ids: string[] = configDoc.data().postIds || [];
          const ordered: BlogPost[] = [];
          ids.forEach(id => {
            const post = sorted.find(p => p.id === id);
            if (post) ordered.push(post);
          });

          if (ordered.length >= 3) {
            setHeroFeatured(ordered.slice(0, 3));
          } else {
            const remaining = sorted.filter(p => !ids.includes(p.id)).slice(0, 3 - ordered.length);
            setHeroFeatured([...ordered, ...remaining]);
          }
        } else {
          setHeroFeatured(sorted.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load hero posts:', err);
        setHeroFeatured(sorted.slice(0, 3));
      }

      setLoading(false);
    };

    load();
  }, []);

  // NEW: Safely read auth ONLY on client after mount
  useEffect(() => {
    try {
      const { user, isLoading } = useAuth();
      setUser(user);
      setAuthLoading(isLoading);
    } catch (error) {
      // If useAuth throws (e.g., no provider during SSG), ignore gracefully
      console.warn('Auth context not available during initial render (expected in SSG)');
      setUser(null);
      setAuthLoading(false);
    }
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>(posts.map(p => p.category).filter(Boolean) as string[]);
    return ['All', ...Array.from(cats).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return selectedCategory === 'All' ? posts : posts.filter(p => p.category === selectedCategory);
  }, [posts, selectedCategory]);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.clientWidth * 0.8;
    sliderRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Sign in for better experience..</p>
        </div>
      </div>
    );
  }

  const whatsappUrl = "https://wa.me/9779805671898?text=Hello%20Bigyann!%20I'm%20reaching%20out%20from%20your%20homepage.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">

      <Helmet>
        <title>AI Powered Tech and Science - Bigyann | Reviews & Discussions</title>
        <link rel="canonical" href="https://bigyann.com.np/" />
        <meta
          name="description"
          content="AI powered Articles, Reviews & Discussions on latest tech, design, and AI technology. Explore Articles."
        />
        <meta property="og:title" content="AI Powered Tech and Science - Bigyann" />
        <meta property="og:url" content="https://bigyann.com.np/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Bigyann" />
      </Helmet>
  
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-20 pb-10 md:pt-24 md:pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 to-transparent dark:from-primary-900/10"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-10 items-center">
            <div className="space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Welcome to the Bigyann
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                AI <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Powered</span> Reviews & Discussions
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
                AI powered Articles, Reviews & Discussions on latest tech, design, and AI technology.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => document.getElementById('featured-posts')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Explore Articles
                </button>
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Send className="w-4 h-4" /> Ask AI
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {heroFeatured.map((post, index) => (
                  <div key={post.id} className={`relative rounded-2xl overflow-hidden group ${index === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10"></div>
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20">
                      <span className="inline-block px-3 py-1 mb-2 rounded-full bg-white/20 backdrop-blur text-xs font-medium text-white">
                        {post.category}
                      </span>
                      <h3 className="text-white font-bold text-sm md:text-base line-clamp-2">
                        <Link to={`${post.slug ?? post.id}`} className="hover:text-primary-200 transition-colors">
                          {post.title}
                        </Link>
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Hot & Fresh Slider - Latest 8 Posts (Reduced py- from py-16 to py-12) */}
      {editorPicks.length > 0 && (
        <section id="featured-posts" className="py-12 md:py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6"> {/* Reduced mb- from mb-8 to mb-6 */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium"> {/* Reduced mb- from mb-3 to mb-2 */}
                  <TrendingUp className="w-4 h-4" />
                  Hot & Fresh
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Latest Articles
                </h2>
              </div>
            </div>

            <div className="relative">
              <button onClick={() => scrollSlider('left')} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 w-12 h-12 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={() => scrollSlider('right')} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 w-12 h-12 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all">
                <ChevronRight className="w-6 h-6" />
              </button>

              <div ref={sliderRef} className="flex overflow-x-auto scrollbar-hide gap-6 pb-4 scroll-smooth">
                {editorPicks.map((post) => (
                  <div key={post.id} className="flex-shrink-0 w-[calc(100%-2rem)] sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1rem)]">
                    <PostCard post={post} variant="vertical" textSizeClass="text-lg" />
                  </div>
                ))}
              </div>

              <div className="md:hidden text-center mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">← Swipe to see more →</p>
              </div>
            </div>

            {/* Mobile View All */}
            <div className="mt-6 md:hidden text-center"> {/* Reduced mt- from mt-8 to mt-6 */}
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-semibold transition-colors"
              >
                View All Articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
      {/* AI Tools Section (Reduced py- from py-24 to py-16) */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-950">
  <div className="max-w-7xl mx-auto px-4">
  <h2 className="text-3xl md:text-4xl font-extrabold text-left mb-8 text-gray-900 dark:text-white">
  Explore Our AI Tools 💡
</h2>

    
   {/* Main Grid Container */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-0">

{/* Tab 1: Old Phone Price */}
<Link
  to="/price/my-phone-price"
  className="text-sm flex flex-col items-center justify-center p-6 sm:p-8 bg-white dark:bg-gray-800 text-center 
             transition-all duration-300 hover:shadow-2xl hover:bg-white/95 dark:hover:bg-gray-700/80 
             group rounded-2xl lg:rounded-none lg:rounded-l-3xl lg:border-r border-gray-100 dark:border-gray-700/50 
             transform hover:-translate-y-1 shadow-lg lg:shadow-2xl shadow-primary-500/10 dark:shadow-purple-500/10"
  aria-label="Calculate your old phone price"
>

  {/* Icon */}
  <div className="w-14 h-14 mb-3 rounded-full bg-gradient-to-tr from-primary-400 to-purple-500 dark:from-primary-600 dark:to-purple-700
                  flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
    <Send className="w-6 h-6 text-white" />
  </div>

  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
    Old Phone Price
  </h3>

  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
    Get best price for your old phone
  </p>
</Link>

{/* Tab 2: Calculate EMI */}
<a
  href="https://bigyann.com.np/tools/emi-calculator"
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm flex flex-col items-center justify-center p-6 sm:p-8 bg-white dark:bg-gray-800 text-center 
             transition-all duration-300 hover:shadow-2xl hover:bg-white/95 dark:hover:bg-gray-700/80 
             group rounded-2xl lg:rounded-none lg:border-r border-gray-100 dark:border-gray-700/50 
             transform hover:-translate-y-1 shadow-lg lg:shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/10"
  aria-label="Calculate EMI"
>

  {/* Icon */}
  <div className="w-14 h-14 mb-3 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-500 dark:from-blue-600 dark:to-cyan-700
                  flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
    <Calculator className="w-6 h-6 text-white" />
  </div>

  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
    Calculate EMI
  </h3>

  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
    Dedicated tool for quick EMI estimates.
  </p>
</a>

{/* Tab 3: Exchange Offer */}
<a
  href="/tools/exchange-offer"
  className="text-sm flex flex-col items-center justify-center p-6 sm:p-8 bg-white dark:bg-gray-800 text-center 
             transition-all duration-300 hover:shadow-2xl hover:bg-white/95 dark:hover:bg-gray-700/80 
             group rounded-2xl lg:rounded-none lg:rounded-r-3xl 
             transform hover:-translate-y-1 shadow-lg lg:shadow-2xl shadow-green-500/10 dark:shadow-teal-500/10"
  aria-label="Exchange Offer"
>

  {/* Icon */}
  <div className="w-14 h-14 mb-3 rounded-full bg-gradient-to-tr from-green-400 to-teal-500 dark:from-green-600 dark:to-teal-700
                  flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform">
    <RefreshCw className="w-6 h-6 text-white" />
  </div>

  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
    Exchange Offer
  </h3>

  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
    Check eligibility and value here.
  </p>
</a>

</div>


  </div>
</section>
      {/* Category Filter Section (Removed py- from parent, added py- to inner div) */}
      <section className="sticky top-16 md:top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3"> {/* Reduced mb- from mb-4 to mb-3 */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Browse by Categories</h2>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
              aria-label="Toggle filter menu"
            >
              <Hash className="w-5 h-5" />
            </button>
          </div>
          
          {/* Desktop Filter Bar */}
          <div className="hidden md:flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat === 'All' ? <Sparkles className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                {cat}
              </button>
            ))}
          </div>

          {/* Mobile Filter Drawer */}
          {isFilterOpen && (
            <div className="md:hidden mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl"> {/* Reduced mt- from mt-4 to mt-3 */}
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsFilterOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Latest Posts Grid (Reduced py- from py-16 to py-12) */}
      <section className="py-12 md:py-12 px-4 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6"> {/* Reduced mb- from mb-8 to mb-6 */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium"> {/* Reduced mb- from mb-3 to mb-2 */}
              <BookOpen className="w-4 h-4" />
              Latest Articles
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {selectedCategory === 'All' ? 'All Articles' : `${selectedCategory} Articles`}
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredPosts.length} posts)
              </span>
            </h2>
          </div>

          {filteredPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPosts.slice(0, 16).map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    categoryName={post.category}
                    variant="vertical"
                    textSizeClass="text-base"
                    increasedTitle={false}
                    alignLeft={true}
                  />
                ))}
              </div>

              {/* Show the rest of posts in hidden state initially */}
              {filteredPosts.length > 16 && (
                <div id="more-posts" className="hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                    {filteredPosts.slice(16).map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        categoryName={post.category}
                        variant="vertical"
                        textSizeClass="text-base"
                        increasedTitle={false}
                        alignLeft={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Load More Button - Show if there are more than 16 posts */}
              {filteredPosts.length > 16 && (
                <div className="mt-8 text-center"> {/* Reduced mt- from mt-12 to mt-8 */}
                  <button
                    onClick={() => {
                      const morePostsSection = document.getElementById('more-posts');
                      const loadMoreBtn = document.getElementById('load-more-btn');
                      if (morePostsSection) {
                        morePostsSection.classList.remove('hidden');
                        morePostsSection.classList.add('block');
                      }
                      if (loadMoreBtn) {
                        loadMoreBtn.classList.add('hidden');
                      }
                    }}
                    id="load-more-btn"
                    className="px-8 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Load More Articles ({filteredPosts.length - 16} more)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 md:py-12"> {/* Reduced py- from py-16 to py-12 */}
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No articles found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  There are no articles in the <span className="font-semibold">{selectedCategory}</span> category yet.
                </p>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                >
                  View All Articles
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section with conditional authentication buttons */}
      <section className="py-20 md:py-28 bg-white dark:bg-gray-900">
    <div className="max-w-6xl mx-auto px-4">
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-8 sm:p-12 md:p-16 rounded-3xl shadow-2xl shadow-primary-500/30 dark:shadow-purple-500/50 text-white transform hover:scale-[1.01] transition-transform duration-500">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Ready to Share Your Knowledge?
          </h2>
          <p className="text-lg md:text-xl font-light opacity-90 max-w-3xl mx-auto mb-10">
            {user
              ? "Share your tech insights, price analysis, or reviews with thousands of readers across Nepal."
              : "Join the Bigyann community! Post your tech insights, price analysis, or reviews, and reach thousands of readers across Nepal."
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          {/* Show Login only if NOT logged in */}
          {!user ? (
            <Link
              to="/login"
              className="flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold rounded-xl bg-white text-primary-700 hover:bg-gray-100 transition-colors duration-300 shadow-xl w-full sm:w-auto"
            >
              <LogIn className="w-5 h-5" />
              Login to Post 
            </Link>
          ) : (
            <Link
              to="https://bigyann.com.np/admin"
              className="flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold rounded-xl bg-white text-primary-700 hover:bg-gray-100 transition-colors duration-300 shadow-xl w-full sm:w-auto"
            >
              <Edit className="w-5 h-5" />
              Create New Post
            </Link>
          )}

          <Link
            to="/author-guide"
            className="flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold rounded-xl border-2 border-white/50 text-white hover:bg-white/10 transition-colors duration-300 w-full sm:w-auto"
          >
            <FileText className="w-5 h-5" />
            Submission Guidelines
          </Link>
        </div>
      </div>
    </div>
  </section>
      
    </div>
  );
};

export default Home;