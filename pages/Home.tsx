'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getR2Posts, getR2Polls } from '../services/r2-data'; // Use R2 data
import { BlogPost, Poll } from '../types';
import dynamic from 'next/dynamic';
import { PostCard } from '../components/PostCard';

const PollCard = dynamic(() => import('../components/PollCard'), {
  loading: () => <div className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />,
  ssr: false
});

const LiveMatchPopup = dynamic(() => import('../components/LiveMatchPopup').then(mod => mod.LiveMatchPopup), {
  ssr: false
});

import { ArrowRight, Loader2, Sparkles, Send, BookOpen, Vote, ShoppingBag, Clock, Calendar, Hash, TrendingUp, ChevronLeft, ChevronRight, Languages, LogIn, Edit } from 'lucide-react'; // Consolidated imports
import Link from 'next/link';
import Image from 'next/image';
import { Calculator, RefreshCw, Tv, Terminal, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleAdSense from '../components/GoogleAdSense';

interface HomeProps {
  initialPosts?: BlogPost[];
  initialHeroFeatured?: BlogPost[];
  initialPolls?: Poll[];
}

export const Home: React.FC<HomeProps> = ({
  initialPosts = [],
  initialHeroFeatured = [],
  initialPolls = []
}) => {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [heroFeatured, setHeroFeatured] = useState<BlogPost[]>(initialHeroFeatured);
  const [editorPicks, setEditorPicks] = useState<BlogPost[]>(initialPosts.slice(0, 8));
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const pollSliderRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 20;

  // Reset pagination when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const load = async () => {
      // If we have initial data, we don't need to show loading, but we might want to fetch FULL list for client-side filtering
      // initialPosts from server (page.tsx) is likely sliced (e.g. 20), so we need the full list for category filtering.

      const shouldFetch = posts.length <= 20; // If we only have limited posts, fetch all

      if (shouldFetch) {
        try {
          // Fetch all posts from R2 (fast JSON)
          const allPosts = await getR2Posts();
          const sorted = allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setPosts(sorted);
          setEditorPicks(sorted.slice(0, 8));

          // If we didn't have hero featured (fallback), try to derive from posts or stick to props
          if (heroFeatured.length === 0 && initialHeroFeatured.length === 0) {
            setHeroFeatured(sorted.slice(0, 3));
          }
        } catch (err) {
          console.error("Failed to fetch R2 posts on client:", err);
        }
      }

      // Load Polls if missing
      if (polls.length === 0) {
        try {
          const allPolls = await getR2Polls();
          setPolls(allPolls.slice(0, 8));
        } catch (err) {
          console.error("Failed to fetch R2 polls on client:", err);
        }
      }

      setLoading(false);
    };
    load();
  }, [initialPosts.length, initialHeroFeatured.length, polls.length]);

  const categories = useMemo(() => {
    const cats = new Set<string>(posts.map(p => p.category).filter(Boolean) as string[]);
    const sortedCats = Array.from(cats).sort();
    return heroFeatured.length > 0 ? ['All', 'Featured', ...sortedCats] : ['All', ...sortedCats];
  }, [posts, heroFeatured]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'All') return posts;
    if (selectedCategory === 'Featured') return heroFeatured;
    return posts.filter(p => p.category === selectedCategory);
  }, [posts, selectedCategory, heroFeatured]);

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage, POSTS_PER_PAGE]);

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.clientWidth * 0.8;
    sliderRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
  };

  if (loading) {
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


      {/* Hero Section - Modern Premium Design */}
      <section className="relative overflow-hidden px-4 pt-20 pb-12 md:pt-32 md:pb-24">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900"></div>
        <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-primary-400/20 md:from-primary-400/30 to-purple-600/20 md:to-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-gradient-to-tr from-pink-400/15 to-primary-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-primary-100 dark:border-primary-800 shadow-lg">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary-600 animate-pulse" />
                <span className="text-xs md:text-sm font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to Bigyann
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.1] md:leading-tight">
                Confused About{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                    New Gadgets?
                  </span>
                  <svg className="absolute -bottom-1 md:-bottom-2 left-0 w-full" height="8 md:12" viewBox="0 0 200 12" fill="none">
                    <path d="M2 10C60 2 140 2 198 10" stroke="url(#gradient-hero)" strokeWidth="3" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="gradient-hero" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Ask Our AI & Read <span className="font-bold text-primary-600 dark:text-primary-400">Real Reviews</span> from Tech Enthusiasts
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => document.getElementById('featured-posts')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative px-6 py-3.5 md:px-8 md:py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold rounded-xl md:rounded-2xl overflow-hidden shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-sm md:text-base">
                    Explore Articles
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                <Link
                  href='https://bigyann.com.np/chat'
                  className="group px-6 py-3.5 md:px-8 md:py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl md:rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" />
                  Ask AI Assistant
                </Link>
              </div>

              {/* Stats with Animated Counters - Responsive Grid/Flex */}
              <div className="grid grid-cols-3 gap-4 md:gap-8 justify-center lg:justify-start pt-4 mb-2">
                <div className="text-center lg:text-left group cursor-pointer">
                  <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                    {posts.length > 0 ? `${posts.length}+` : '100+'}
                  </div>
                  <div className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400 font-medium">Articles</div>
                  <div className="mt-1 h-0.5 md:h-1 w-0 group-hover:w-full bg-gradient-to-r from-primary-600 to-purple-600 transition-all duration-300 rounded-full"></div>
                </div>
                <div className="text-center lg:text-left group cursor-pointer">
                  <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                    20K+
                  </div>
                  <div className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400 font-medium">Monthly Views</div>
                  <div className="mt-1 h-0.5 md:h-1 w-0 group-hover:w-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 rounded-full"></div>
                </div>
                <div className="text-center lg:text-left group cursor-pointer">
                  <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-pink-600 to-primary-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                    24/7
                  </div>
                  <div className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400 font-medium">AI Help</div>
                  <div className="mt-1 h-0.5 md:h-1 w-0 group-hover:w-full bg-gradient-to-r from-pink-600 to-primary-600 transition-all duration-300 rounded-full"></div>
                </div>
              </div>

              {/* Floating Tools Showcase - Responsive Flow */}
              <div className="mt-6 md:mt-8 p-3 md:p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-lg max-w-full overflow-hidden">
                <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-3">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary-600" />
                  <span className="font-semibold">Featured Tools</span>
                </div>
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <Link href="/ai-humanizer" className="group flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-200/50 dark:border-purple-800/50 transition-all hover:scale-105 shrink-0">
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-purple-600 group-hover:rotate-12 transition-transform" />
                    <span className="text-[9px] md:text-xs font-bold text-gray-700 dark:text-gray-300">AI Humanizer</span>
                  </Link>
                  <Link href="/price/my-phone-price" className="group flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-gradient-to-r from-primary-500/10 to-purple-500/10 hover:from-primary-500/20 hover:to-purple-500/20 border border-primary-200/50 dark:border-primary-800/50 transition-all hover:scale-105 shrink-0">
                    <Send className="w-3 h-3 md:w-4 md:h-4 text-primary-600 group-hover:rotate-12 transition-transform" />
                    <span className="text-[9px] md:text-xs font-bold text-gray-700 dark:text-gray-300">Phone Price</span>
                  </Link>
                  <Link href="/tools/live-tv" className="group flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 border border-red-200/50 dark:border-red-800/50 transition-all hover:scale-105 shrink-0">
                    <div className="relative">
                      <div className="absolute -top-1 -right-1 w-1.5 md:w-2 h-1.5 md:h-2 bg-red-500 rounded-full animate-ping"></div>
                      <div className="w-3 h-3 md:w-4 md:h-4 flex items-center justify-center">🔴</div>
                    </div>
                    <span className="text-[9px] md:text-xs font-bold text-gray-700 dark:text-gray-300">Live Sports</span>
                  </Link>
                  <Link href="/chat" className="group flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-gradient-to-r from-green-500/10 to-teal-500/10 hover:from-green-500/20 hover:to-teal-500/20 border border-green-200/50 dark:border-green-800/50 transition-all hover:scale-105 shrink-0">
                    <span className="text-xs md:text-base">🤖</span>
                    <span className="text-[9px] md:text-xs font-bold text-gray-700 dark:text-gray-300">AI Chat</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Content - Modern Featured Grid */}
            <div className="relative group/grid">
              {/* Decorative Floating Blurs */}
              <div className="absolute -top-10 -right-10 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px] animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>

              <div className="relative grid grid-cols-2 gap-3 md:gap-5">
                {heroFeatured.map((post, index) => {
                  return (
                    <div
                      key={post.id}
                      className={`group flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-xl transition-all duration-500 hover:shadow-primary-500/10 hover:-translate-y-2 ${index === 0 ? 'col-span-2' : ''
                        }`}
                      style={{
                        animation: `fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 0.15}s both`
                      }}
                    >
                      {/* Image Container with fixed aspect ratio */}
                      <div className={`relative overflow-hidden ${index === 0 ? 'aspect-[21/9]' : 'aspect-[4/3]'}`}>
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          sizes={index === 0 ? "(max-width: 1280px) 100vw, 800px" : "(max-width: 768px) 50vw, 400px"}
                          priority={index === 0}
                        />
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-primary-600/90 backdrop-blur-md text-[8px] sm:text-[10px] font-black text-white uppercase tracking-wider shadow-lg">
                            {post.category}
                          </span>
                        </div>
                      </div>

                      {/* Content below image ("Name Down") */}
                      <div className="px-2.5 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 flex flex-col">
                        <h3 className={`font-black text-gray-900 dark:text-white leading-[1.2] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 ${index === 0 ? 'text-sm sm:text-xl md:text-2xl' : 'text-[11px] sm:text-sm md:text-base'
                          }`}>
                          <Link href={`${post.slug ?? post.id}`} className="hover:underline decoration-primary-500 decoration-2 underline-offset-4">
                            {post.title}
                          </Link>
                        </h3>

                        <div className="flex items-center gap-2 mt-1.5 text-gray-500 dark:text-gray-400 text-[8px] sm:text-[10px] font-bold">
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock size={10} className="text-primary-500 sm:w-3 sm:h-3" />
                            {post.readTime || '5 min'}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar size={10} className="text-primary-500 sm:w-3 sm:h-3" />
                            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Animations */}
        <style jsx>{`
          @keyframes gradient {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          .animate-gradient {
            background-size: 200% auto;
            animation: gradient 3s ease infinite;
          }
        `}</style>
      </section>


      {/* Hot & Fresh Slider - Latest 8 Posts (Reduced py- from py-16 to py-12) */}
      {editorPicks.length > 0 && (
        <section id="featured-posts" className="py-12 md:py-12 px-4 section-lazy">
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
                    <PostCard post={post} variant="vertical" textSizeClass="text-[11px] sm:text-base md:text-lg" />
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
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-semibold transition-colors"
              >
                View All Articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
      {/* AdSense: Home Page Top - Between Featured and AI Tools */}
      <div className="max-w-7xl mx-auto px-4 my-8 text-center">
        <GoogleAdSense
          slot="7838572857"
          format="auto"
          responsive={true}
        />
      </div>

      {/* AI Tools Section */}
      <section className="py-8 md:py-10 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 section-lazy">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl md:text-3xl font-bold text-left text-gray-900 dark:text-white">
              Explore Our AI Tools 💡
            </h2>
          </div>

          {/* Grid: 2 cols on mobile, 3 cols on desktop. Last item full width. */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">

            {/* Tab 0: AI Humanizer */}
            <Link
              href="/ai-humanizer"
              className="relative text-sm flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-gray-800 text-center 
                   transition-all duration-200 hover:shadow-lg hover:bg-white/95 dark:hover:bg-gray-700/80 
                   group rounded-2xl border border-gray-100 dark:border-gray-700/50"
            >
              <span className="absolute top-2 right-2 bg-purple-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full uppercase">Hot</span>
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 rounded-full bg-gradient-to-tr from-purple-500 to-blue-600 
                        flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">AI Humanizer</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Bypass AI Detection (0%)</p>
            </Link>

            {/* New: Second Hand Phones */}
            <Link
              href="/tools/phone-marketplace"
              className="text-sm flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-gray-800 text-center 
                   transition-all duration-200 hover:shadow-lg hover:bg-white/95 dark:hover:bg-gray-700/80 
                   group rounded-2xl border border-gray-100 dark:border-gray-700/50"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 rounded-full bg-gradient-to-tr from-green-500 to-teal-600 
                        flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Buy/Sell Phones</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Marketplace</p>
            </Link>

            {/* Tab 1: Old Phone Price */}
            <Link
              href="/price/my-phone-price"
              className="text-sm flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-gray-800 text-center 
                   transition-all duration-200 hover:shadow-lg hover:bg-white/95 dark:hover:bg-gray-700/80 
                   group rounded-2xl border border-gray-100 dark:border-gray-700/50"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 rounded-full bg-gradient-to-tr from-primary-400 to-purple-500 
                        flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Send className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Old Phone Price</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Get best price</p>
            </Link>

            {/* Tab 2: AI Translator */}
            <Link
              href="/tools/ai-translator"
              className="text-sm flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-gray-800 text-center 
                   transition-all duration-200 hover:shadow-lg hover:bg-white/95 dark:hover:bg-gray-700/80 
                   group rounded-2xl border border-gray-100 dark:border-gray-700/50"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-600 
                        flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">AI Translator</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Live translation</p>
            </Link>

            {/* Tab 3: Resume Checker */}
            <Link
              href="/tools/resume-checker"
              className="relative text-sm flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-gray-800 text-center 
                   transition-all duration-200 hover:shadow-lg hover:bg-white/95 dark:hover:bg-gray-700/80 
                   group rounded-2xl border border-gray-100 dark:border-gray-700/50"
            >
              <span className="absolute top-2 right-2 bg-pink-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full uppercase">New</span>
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 
                        flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Resume Checker</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">ATS Optimization</p>
            </Link>

            {/* Tab 4: Prompts Library (Replaced Temp Mail) */}
            <Link
              href="/prompts"
              className="relative text-sm flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-gray-800 text-center 
                   transition-all duration-200 hover:shadow-lg hover:bg-white/95 dark:hover:bg-gray-700/80 
                   group rounded-2xl border border-gray-100 dark:border-gray-700/50"
            >
              <span className="absolute top-2 right-2 bg-pink-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full uppercase">New</span>
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 
                        flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Prompts Library</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">AI Asssitants</p>
            </Link>

            {/* Tab 5: EMI Calculator */}
            <a
              href="https://bigyann.com.np/tools/emi-calculator"
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 lg:col-span-1 text-sm flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-gray-800 text-center 
                   transition-all duration-200 hover:shadow-lg hover:bg-white/95 dark:hover:bg-gray-700/80 
                   group rounded-2xl border border-gray-100 dark:border-gray-700/50"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-500 
                        flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">EMI Calculator</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Loan Estimates</p>
            </a>

            {/* Tab 6: Exchange Offer (Standard Width) */}
            <Link
              href="/tools/exchange-offer"
              className="text-sm flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-gray-800 text-center 
                   transition-all duration-200 hover:shadow-lg hover:bg-white/95 dark:hover:bg-gray-700/80 
                   group rounded-2xl border border-gray-100 dark:border-gray-700/50"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 rounded-full bg-gradient-to-tr from-green-400 to-teal-500 
                        flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Exchange Offer</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Check Value</p>
            </Link>

            {/* Tab 7: Live TV Shortcut */}
            <Link
              href="/tools/live-tv"
              className="text-sm flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-gray-800 text-center 
                    transition-all duration-200 hover:shadow-lg hover:bg-white/95 dark:hover:bg-gray-700/80 
                    group rounded-2xl border border-gray-100 dark:border-gray-700/50"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 mb-3 rounded-full bg-gradient-to-tr from-red-500 to-orange-600 
                        flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Tv className="w-5 h-5 text-white" />
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Live Sports </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Watch Now</p>
            </Link>

          </div>
        </div>
      </section>



      {/* Community Polls Section - Repositioned below AI Tools */}
      {polls.length > 0 && (
        <section className="py-12 md:py-16 px-4 bg-gray-50/50 dark:bg-gray-900/30 section-lazy">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium">
                  <Vote className="w-4 h-4" />
                  Voice Your Vision
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Featured Community Polls
                </h2>
              </div>
              <Link
                href="/voting"
                className="hidden md:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                View More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  if (pollSliderRef.current) {
                    pollSliderRef.current.scrollLeft -= pollSliderRef.current.clientWidth * 0.8;
                  }
                }}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 w-12 h-12 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => {
                  if (pollSliderRef.current) {
                    pollSliderRef.current.scrollLeft += pollSliderRef.current.clientWidth * 0.8;
                  }
                }}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 w-12 h-12 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div
                ref={pollSliderRef}
                className="flex overflow-x-auto scrollbar-hide gap-4 sm:gap-6 pb-6 scroll-smooth"
              >
                {polls.map((poll) => (
                  <div
                    key={poll.id}
                    className="flex-shrink-0 w-[calc(46%-0.5rem)] md:w-[calc(50%-1rem)] lg:w-[calc(25%-1.25rem)]"
                  >
                    <PollCard poll={poll} userId={user?.id} variant="minimal" />
                  </div>
                ))}
              </div>

              <div className="md:hidden text-center mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase">← Swipe to Explore →</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AdSense: Home Page Mid - Between Polls and Latest Articles */}
      <div className="max-w-7xl mx-auto px-4 my-8">
        <GoogleAdSense
          slot="7838572857"
          format="auto"
          responsive={true}
        />
      </div>

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
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${selectedCategory === cat
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
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat
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
      <section id="latest-articles" className="py-12 md:py-12 px-4 bg-gray-50/50 dark:bg-gray-900/50 section-lazy">
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

          {paginatedPosts.length > 0 ? (
            <div className="space-y-12">
              <div className="grid grid-cols-2 min-[480px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {paginatedPosts.map((post, index) => (
                  <React.Fragment key={post.id}>
                    <PostCard
                      post={post}
                      categoryName={post.category}
                      variant="vertical"
                      textSizeClass="text-[11px] sm:text-base md:text-lg"
                      increasedTitle={false}
                      alignLeft={true}
                    />
                    {/* Insert AdSense ad after every 4 posts */}
                    {(index + 1) % 4 === 0 && index !== paginatedPosts.length - 1 && (
                      <div className="col-span-2 sm:col-span-2 lg:col-span-3 xl:col-span-4 flex items-center justify-center w-full my-4 md:my-6">
                        <div className="w-full min-h-[100px] md:min-h-[250px] bg-gray-50 dark:bg-gray-900/50 overflow-hidden rounded-none flex items-center justify-center">
                          <GoogleAdSense
                            slot="7838572857"
                            className="w-full h-full flex justify-center items-center"
                            format="auto"
                            responsive={true}
                            style={{ display: 'block', width: '100%', height: '100%' }}
                          />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-8">
                  <button
                    onClick={() => {
                      setCurrentPage(prev => Math.max(prev - 1, 1));
                      window.scrollTo({ top: document.getElementById('latest-articles')?.offsetTop || 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          window.scrollTo({ top: document.getElementById('latest-articles')?.offsetTop || 0, behavior: 'smooth' });
                        }}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === page
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setCurrentPage(prev => Math.min(prev + 1, totalPages));
                      window.scrollTo({ top: document.getElementById('latest-articles')?.offsetTop || 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
            </div>
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

      {/* AdSense: Before CTA Section */}
      <div className="max-w-7xl mx-auto px-4 my-12">
        <GoogleAdSense
          slot="7838572857"
          format="auto"
          responsive={true}
        />
      </div>

      {/* CTA Section with conditional authentication buttons */}
      <section className="py-20 md:py-28 bg-white dark:bg-gray-900 section-lazy">
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
                  href="/login"
                  className="flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold rounded-xl bg-white text-primary-700 hover:bg-gray-100 transition-colors duration-300 shadow-xl w-full sm:w-auto"
                >
                  <LogIn className="w-5 h-5" />
                  Login to Post
                </Link>
              ) : (
                <Link
                  href="https://bigyann.com.np/admin"
                  className="flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold rounded-xl bg-white text-primary-700 hover:bg-gray-100 transition-colors duration-300 shadow-xl w-full sm:w-auto"
                >
                  <Edit className="w-5 h-5" />
                  Create New Post
                </Link>
              )}

              <Link
                href="/author-guide"
                className="flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold rounded-xl border-2 border-white/50 text-white hover:bg-white/10 transition-colors duration-300 w-full sm:w-auto"
              >
                <FileText className="w-5 h-5" />
                Submission Guidelines
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LiveMatchPopup />
    </div>
  );
};

export default Home;