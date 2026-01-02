'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPosts, createPost, seedDatabase, getAllUsers, updateUserRole, getPendingPosts, updatePostStatus, getUserPosts, getCategories, createCategory } from '../services/db';
import { generateBlogOutline, generateFullPost, generateNewsPost, generateBlogImage } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { BlogPost, User, Category, BlogPostComment, BlogPostReview } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

import {
  LayoutDashboard, FileText, Settings, Sparkles, Loader2, Save, LogOut, Home, Database,
  PenTool, Image as ImageIcon, Menu, X, ArrowLeft, Plus, Edit3, Wand2, RefreshCw,
  Users, CheckCircle, Clock, Shield, Tag, Globe, ExternalLink, Trash2, Eye,
  Calendar, TrendingUp, MessageSquare, Download, Upload, Search, Filter,
  Bot, Zap, Play, Pause, AlertTriangle, Terminal, GripVertical
} from 'lucide-react';

import { ANALYTICS_DATA } from '../constants';
import { deleteCategory, updatePost, deletePost, getPostById } from '../services/db';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { generateAndUploadSitemap } from '../services/db';

// Automation Types
interface AutoLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'posts' | 'users' | 'categories' | 'approvals' | 'analytics' | 'automation' | 'featured'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Data State
  const [stats, setStats] = useState({ posts: 0, views: 0, users: 0, comments: 0, engagement: 0 });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [pendingPosts, setPendingPosts] = useState<BlogPost[]>([]);
  const [myPosts, setMyPosts] = useState<BlogPost[]>([]);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sitemapUrl, setSitemapUrl] = useState<string | null>(null);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);

  // Editor State
  // Editor State
  const [editorMode, setEditorMode] = useState<'ai' | 'manual'>('manual');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [outline, setOutline] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Real Analytics State
  const [chartData, setChartData] = useState<any[]>([]);

  // Post Data State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState(''); // Custom Slug State
  const [fullContent, setFullContent] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('https://picsum.photos/800/400?random=1');
  const [coverImageAlt, setCoverImageAlt] = useState(''); // Alt Text State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [excerpt, setExcerpt] = useState('');

  // Category creation
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Automation State
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);
  const [autoLogs, setAutoLogs] = useState<AutoLog[]>([]);
  const [nextRunTime, setNextRunTime] = useState<number | null>(null);
  const [autoIntervalId, setAutoIntervalId] = useState<any>(null);
  const [postsGeneratedToday, setPostsGeneratedToday] = useState(0);

  // Featured Posts Manager State
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [availablePosts, setAvailablePosts] = useState<BlogPost[]>([]);
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;

  // === Load & Save Featured Posts ===
  const loadFeaturedPosts = async () => {
    try {
      const configDoc = await getDoc(doc(db, 'config', 'featured'));
      if (configDoc.exists()) {
        const ids: string[] = configDoc.data().postIds || [];
        const ordered: BlogPost[] = [];
        ids.forEach(id => {
          const post = allPosts.find(p => p.id === id);
          if (post) ordered.push(post);
        });
        setFeaturedPosts(ordered);
        setAvailablePosts(allPosts.filter(p => !ids.includes(p.id)));
      } else {
        setFeaturedPosts([]);
        setAvailablePosts(allPosts);
      }
    } catch (err) {
      console.error('Failed to load featured posts');
    }
  };

  const saveFeaturedOrder = async () => {
    setIsSavingFeatured(true);
    try {
      await setDoc(doc(db, 'config', 'featured'), {
        postIds: featuredPosts.map(p => p.id),
        updatedAt: new Date().toISOString()
      });
      alert('Featured posts saved successfully!');
    } catch (err) {
      alert('Failed to save featured posts');
    } finally {
      setIsSavingFeatured(false);
    }
  };

  useEffect(() => {
    if (allPosts.length > 0 && activeTab === 'featured') {
      loadFeaturedPosts();
    }
  }, [allPosts, activeTab]);

  const refreshData = async () => {
    try {
      if (isAdmin) {
        const allPostsData = await getPosts();
        const totalViews = allPostsData.reduce((acc, curr) => acc + (curr.views || 0), 0);
        setAllPosts(allPostsData);
        setStats({
          posts: allPostsData.length,
          views: totalViews,
          users: usersList.length,
          comments: 0,
          engagement: Math.round((totalViews / Math.max(allPostsData.length, 1)) * 100) / 100
        });

        const pPending = await getPendingPosts();
        setPendingPosts(pPending);
        const allUsers = await getAllUsers();
        setUsersList(allUsers);
      }

      if (user) {
        const mine = await getUserPosts(user.id);
        setMyPosts(mine);
      }

      const cats = await getCategories();
      setCategories(cats);
      if (cats.length > 0 && !category) {
        setCategory(cats[0].name);
      }

      // --- CALCULATE REAL ANALYTICS ---
      if (isAdmin) { // Ensure using the refreshed allPostsData
        // We need to use valid posts data. If we just fetched it above, we should use that.
        // The implementation above sets allPostsState, but due to closure we might not have it yet if using state.
        // Best to use the fetched variable 'allPostsData' if available, otherwise fallback.

        // Assuming this is inside refreshData where 'allPostsData' was defined for admin
        const sourcePosts = await getPosts(); // Re-fetching or using local var would be better, but getPosts is cheap-ish. 
        // Actually, looking at previous code, 'allPostsData' was available in the isAdmin block.
        // Let's optimize: We can't easily access 'allPostsData' here if it was in a generic block scope above.
        // BUT, notice refreshData structure:
        // if (isAdmin) { const allPostsData = ... }
        // We need to move this logic INTO the isAdmin block or recalculate.
        // Let's recalculate simply here to be safe and clean, or move logic.
        // Better yet, let's just do it in the isAdmin block in next Edit if possible? 
        // No, I can't jump blocks easily. I will rely on the fact that I can fetch or use existing state.
        // Actually, state 'allPosts' might be stale in this very render cycle.
        // Let's put this logic INSIDE the existing isAdmin block in a separate replace call? 
        // No, I'll just implement a dedicated effect or append to refreshData.

        // Wait, I am editing the end of refreshData.
        // Let's restructure:
        const postsForStats = await getPosts();
        const categoryStats = postsForStats.reduce((acc: any, post) => {
          const cat = post.category || 'Uncategorized';
          if (!acc[cat]) acc[cat] = { name: cat, views: 0, posts: 0 };
          acc[cat].views += (post.views || 0);
          acc[cat].posts += 1;
          return acc;
        }, {});

        setChartData(Object.values(categoryStats));
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user, activeTab]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoLogs]);

  // --- AUTOMATION LOGIC ---

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setAutoLogs(prev => [...prev, {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const runAutomationCycle = async () => {
    if (categories.length === 0) {
      addLog('No categories found. Cannot run automation.', 'error');
      return;
    }

    addLog('Starting automation cycle...', 'info');

    try {
      // 1. Pick a random category
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      addLog(`Selected category: ${randomCategory.name}`, 'info');
      addLog(`Fetching trending news and generating article via Gemini...`, 'info');

      // 2. Generate Content via Gemini (Search + Writing)
      const { title: aiTitle, content: aiContent, sources } = await generateNewsPost(randomCategory.name);
      addLog(`Content generated: "${aiTitle}"`, 'success');

      // 3. Generate Image
      addLog(`Generating AI header image for: "${aiTitle}"...`, 'info');
      const aiImage = await generateBlogImage(aiTitle);
      addLog('Image generated successfully.', 'success');

      // 4. Create Post Object
      const postData = {
        title: aiTitle,
        content: aiContent,
        excerpt: aiContent.substring(0, 150).replace(/[#*`]/g, '') + '...',
        author: { name: 'BIGGS', avatar: '/images/biggs-avatar.png', id: 'ai-bot' },
        readTime: `${Math.ceil(aiContent.split(' ').length / 200)} min read`,
        category: randomCategory.name,
        tags: [randomCategory.name, 'News', 'AI Generated'],
        coverImage: aiImage,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'published' as const,
        updatedAt: new Date().toISOString()
      };

      // 5. Save to DB
      await createPost(postData);
      addLog('Post published successfully!', 'success');
      setPostsGeneratedToday(prev => prev + 1);

      // Refresh list
      refreshData();

    } catch (error: any) {
      addLog(`Automation failed: ${error.message}`, 'error');
    }
  };

  const toggleAutoPilot = () => {
    if (isAutoPilotOn) {
      // Turn Off
      if (autoIntervalId) clearInterval(autoIntervalId);
      setIsAutoPilotOn(false);
      setNextRunTime(null);
      addLog('Auto-Pilot stopped.', 'warning');
    } else {
      // Turn On
      setIsAutoPilotOn(true);
      addLog('Auto-Pilot activated. Scheduling 4 posts per day.', 'success');

      // Calculate interval for 4 times a day (approx every 6 hours)
      // For demo purposes, we can set it faster, but let's do a logic check
      const postsPerDay = 4;
      const msPerDay = 24 * 60 * 60 * 1000;
      const interval = msPerDay / postsPerDay;

      // Run one immediately? No, let's schedule.
      const run = () => {
        runAutomationCycle();
        setNextRunTime(Date.now() + interval);
      };

      run(); // Run first one now
      const id = setInterval(run, interval); // Then every 6 hours
      setAutoIntervalId(id);
      setNextRunTime(Date.now() + interval);
    }
  };

  // --- EDITOR HANDLERS ---

  const handleGenerateOutline = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const result = await generateBlogOutline(topic);
      setOutline(result);
      const lines = result.split('\n');
      const possibleTitle = lines.find(l => l.startsWith('#'))?.replace('#', '').trim() || `Post about ${topic}`;
      setTitle(possibleTitle);
      setExcerpt(`${possibleTitle} - An in-depth exploration of ${topic.toLowerCase()}.`);
    } catch (error) {
      alert('Failed to generate outline. Please try again.');
      console.error(error);
    } finally {
      setIsGenerating(false);
      setStep(2);
    }
  };

  const handleGenerateFull = async () => {
    setIsGenerating(true);
    try {
      const result = await generateFullPost(title, outline);
      setFullContent(result);
      if (!excerpt) {
        setExcerpt(result.substring(0, 150).replace(/[#*`]/g, '') + '...');
      }
    } catch (error) {
      alert('Failed to generate full post. Please try again.');
      console.error(error);
    } finally {
      setIsGenerating(false);
      setStep(3);
    }
  };

  const handleSavePost = async () => {
    if (!title || !fullContent || !user || !category) {
      alert("Please fill in Title, Content, and select a Category.");
      return;
    }

    setIsSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      if (editorMode === 'ai' && tags.length === 0) tags.push('AI Generated');

      const status: 'published' | 'pending' | 'draft' = isAdmin ? 'published' : 'pending';
      const postData = {
        title,
        content: fullContent,
        excerpt: excerpt || fullContent.substring(0, 150).replace(/[#*`]/g, '') + '...',
        author: { name: user.name, avatar: user.avatar, id: user.id },
        readTime: `${Math.ceil(fullContent.split(' ').length / 200)} min read`,
        category,
        tags,
        coverImage,
        coverImageAlt,
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || undefined,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status, // Now properly typed
        updatedAt: new Date().toISOString()
      };

      if (editingPostId) {
        await updatePost(editingPostId, postData);
        alert('Post updated successfully!');
      } else {
        await createPost(postData);
        alert(isAdmin ? 'Post published successfully!' : 'Post submitted for approval!');
      }

      // Reset form
      resetEditor();
      setActiveTab('posts');
      refreshData();
    } catch (error) {
      alert('Failed to save post. Please check console for details.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPost = async (postId: string) => {
    try {
      const post = await getPostById(postId);
      if (post) {
        setTitle(post.title);
        setFullContent(post.content);
        setCategory(post.category);
        setTagsInput(post.tags?.join(', ') || '');
        setCoverImage(post.coverImage || 'https://picsum.photos/800/400?random=1');
        setCoverImageAlt(post.coverImageAlt || '');
        setSlug(post.slug || '');
        setExcerpt(post.excerpt || '');
        setEditingPostId(postId);
        setEditorMode('manual');
        setStep(3);
        setActiveTab('editor');
      }
    } catch (error) {
      console.error('Error loading post:', error);
      alert('Failed to load post for editing.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost(postId);
        alert('Post deleted successfully!');
        refreshData();
      } catch (error) {
        alert('Failed to delete post.');
        console.error(error);
      }
    }
  };

  const handleApprovePost = async (postId: string) => {
    try {
      await updatePostStatus(postId, 'published');
      alert('Post approved and published!');
      refreshData();
    } catch (error) {
      alert('Failed to approve post.');
      console.error(error);
    }
  };

  const handleRejectPost = async (postId: string) => {
    if (confirm('Are you sure you want to reject this post?')) {
      try {
        await updatePostStatus(postId, 'draft');
        alert('Post rejected and moved to draft.');
        refreshData();
      } catch (error) {
        alert('Failed to reject post.');
        console.error(error);
      }
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      // Type assertion
      await updateUserRole(userId, newRole as 'user' | 'moderator' | 'admin');
      alert(`User role updated to ${newRole}`);
      refreshData();
    } catch (error) {
      alert('Failed to update user role.');
      console.error(error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      alert('Please enter a category name.');
      return;
    }

    try {
      await createCategory({
        name: newCatName,
        description: newCatDesc,
        icon: newCatIcon
      });
      alert('Category created successfully!');
      setNewCatName('');
      setNewCatDesc('');
      setNewCatIcon('Tag');
      refreshData();
    } catch (error) {
      alert('Failed to create category.');
      console.error(error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure? Posts in this category will need to be reassigned.')) {
      try {
        await deleteCategory(categoryId);
        alert('Category deleted successfully!');
        refreshData();
      } catch (error) {
        alert('Failed to delete category.');
        console.error(error);
      }
    }
  };

  const handleRegenerateSitemap = async () => {
    setIsGeneratingSitemap(true);

    try {
      const response = await fetch('https://bigyann.com.np/api/sitemap', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer bigyann-2025-super-secret-987654321',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert(`Sitemap Updated!\n${data.posts} posts indexed\n\nLive URL:\nhttps://ulganzkpfwuuglxj.public.blob.vercel-storage.com/sitemap.xml`);
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err) {
      alert('Deploy vercel.json + api/sitemap.ts first!');
    } finally {
      setIsGeneratingSitemap(false);
    }
  };
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const resetEditor = () => {
    setTitle('');
    setSlug('');
    setFullContent('');
    setCategory('');
    setTagsInput('');
    setCoverImage(`https://picsum.photos/800/400?random=${Date.now()}`);
    setCoverImageAlt('');
    setExcerpt('');
    setTopic('');
    setOutline('');
    setEditingPostId(null);
    setStep(1);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const setRandomImage = () => setCoverImage(`https://picsum.photos/800/400?random=${Math.floor(Math.random() * 1000)}`);

  const goToEditor = (mode: 'manual' | 'ai', editPostId: string | null = null) => {
    setEditorMode(mode);
    setActiveTab('editor');
    setIsSidebarOpen(false);
    setEditingPostId(editPostId);

    if (!editPostId) {
      resetEditor();
      setStep(mode === 'ai' ? 1 : 3);

      if (categories.length > 0) {
        setCategory(categories[0].name);
      }
    }
  };

  // Filter posts based on search and status
  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              Bigyann
            </span>
            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 uppercase">
              {user?.role}
            </span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">Menu</h2>
            <nav className="space-y-1">
              <button
                onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'dashboard'
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <LayoutDashboard size={18} className="mr-3" /> Dashboard
              </button>

              <button
                onClick={() => goToEditor('manual')}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'editor'
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <PenTool size={18} className="mr-3" /> Write Post
              </button>

              <button
                onClick={() => { setActiveTab('posts'); setIsSidebarOpen(false); }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'posts'
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <FileText size={18} className="mr-3" /> All Posts
              </button>
              <button onClick={() => { setActiveTab('featured'); setIsSidebarOpen(false); }} className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'featured' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <Sparkles size={18} className="mr-3" /> Featured Posts
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => { setActiveTab('automation'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'automation'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Bot size={18} className="mr-3" />
                    Auto-Pilot
                    {isAutoPilotOn && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveTab('approvals'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'approvals'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <CheckCircle size={18} className="mr-3" />
                    Approvals {pendingPosts.length > 0 && (
                      <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {pendingPosts.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'users'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Users size={18} className="mr-3" /> Users
                  </button>

                  <button
                    onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'categories'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Tag size={18} className="mr-3" /> Categories
                  </button>

                  <button
                    onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'analytics'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <TrendingUp size={18} className="mr-3" /> Analytics
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center mb-4 px-4">
            <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full mr-3 border border-gray-200" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Link href="/" className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Home size={16} className="mr-3" /> Back to Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:hover:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <LogOut size={16} className="mr-3" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="mr-3 text-gray-600 dark:text-gray-300">
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Dashboard</span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
            <img src={user?.avatar} alt="User" />
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* === FEATURED POSTS TAB === */}
          {activeTab === 'featured' && isAdmin && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Sparkles className="text-yellow-500" />
                    Featured Posts Manager
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Choose and reorder the 3 posts shown in the homepage hero section</p>
                </div>
                <button
                  onClick={saveFeaturedOrder}
                  disabled={isSavingFeatured}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingFeatured ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Current Featured */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold mb-4">Current Featured ({featuredPosts.length}/3)</h2>
                  {featuredPosts.length === 0 ? (
                    <p className="text-center py-12 text-gray-500">No posts selected yet</p>
                  ) : (
                    <div className="space-y-4">
                      {featuredPosts.map((post, index) => (
                        <div
                          key={post.id}
                          draggable
                          onDragStart={(e) => (e.dataTransfer as any).setData('index', index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIndex = Number((e.dataTransfer as any).getData('index'));
                            const newPosts = [...featuredPosts];
                            const [moved] = newPosts.splice(fromIndex, 1);
                            newPosts.splice(index, 0, moved);
                            setFeaturedPosts(newPosts);
                          }}
                          className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-move hover:shadow-md border-2 border-dashed border-transparent hover:border-primary-400 transition-all"
                        >
                          <GripVertical className="text-gray-400" />
                          <span className="text-2xl font-bold text-primary-600 w-8">{index + 1}</span>
                          <img src={post.coverImage} alt="" className="w-16 h-16 object-cover rounded-lg" />
                          <div className="flex-1">
                            <h4 className="font-semibold">{post.title}</h4>
                            <p className="text-sm text-gray-500">{post.category} • {post.date}</p>
                          </div>
                          <button
                            onClick={() => {
                              // 1. Find the post to remove
                              const postToRemove = featuredPosts.find(p => p.id === post.id);

                              // 2. Remove it from featured
                              setFeaturedPosts(featuredPosts.filter(p => p.id !== post.id));

                              // 3. Add it back to available so it can be picked again later
                              if (postToRemove) {
                                setAvailablePosts(prev => [...prev, postToRemove]);
                              }
                            }}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Posts */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold mb-4">Add from All Posts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {availablePosts.map(post => (
                      <div
                        key={post.id}
                        onClick={() => {
                          if (featuredPosts.length < 3) {
                            setFeaturedPosts([...featuredPosts, post]);
                            setAvailablePosts(availablePosts.filter(p => p.id !== post.id));
                          } else {
                            alert('Maximum 3 featured posts allowed');
                          }
                        }}
                        className="group relative bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                      >
                        <img src={post.coverImage} alt="" className="w-full h-32 object-cover" />
                        <div className="p-3">
                          <h4 className="font-medium text-sm line-clamp-2">{post.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{post.category}</p>
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium">
                            + Add to Featured
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hello, {user?.name}</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {isAdmin ? "Here's what's happening across the platform." : "Manage your stories and create something new."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToEditor('manual')}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm active:scale-95 transform duration-100"
                  >
                    <Plus size={16} />
                    <span>Write New Story</span>
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={async () => { if (confirm("Seed database with sample data?")) await seedDatabase(); refreshData(); }}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        <Database size={16} />
                        <span className="hidden sm:inline">Seed Data</span>
                      </button>
                      <button
                        onClick={handleRegenerateSitemap}
                        disabled={isGeneratingSitemap}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <Globe size={16} />
                        <span className="hidden sm:inline">Update Sitemap</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.views.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Posts</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.posts}</p>
                </div>
                {isAdmin && (
                  <>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{pendingPosts.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.users}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement Rate</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.engagement}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Sitemap Card for Admin */}
              {isAdmin && sitemapUrl && (
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-sm border border-gray-700 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Globe size={24} className="text-emerald-400" />
                      <div>
                        <h3 className="font-bold text-lg">Sitemap</h3>
                        <p className="text-sm text-gray-300">Last updated automatically</p>
                      </div>
                    </div>
                    <a
                      href={sitemapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <ExternalLink size={16} />
                      <span>View XML</span>
                    </a>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-400">Updates automatically on publish. Force update if needed.</p>
                    <button
                      onClick={handleRegenerateSitemap}
                      disabled={isGeneratingSitemap}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isGeneratingSitemap ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      <span>Update Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => goToEditor('manual')}
                  className="p-6 bg-gradient-to-br from-indigo-500 to-primary-600 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col items-start"
                >
                  <Edit3 size={32} className="mb-4 bg-white/20 p-1.5 rounded-lg" />
                  <h3 className="text-xl font-bold">Write Manually</h3>
                  <p className="text-indigo-100 text-sm mt-1">Draft a new post from scratch using the Markdown editor.</p>
                </button>
                <button
                  onClick={() => goToEditor('ai')}
                  className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col items-start group"
                >
                  <Wand2 size={32} className="mb-4 text-purple-500 bg-purple-50 dark:bg-purple-900/20 p-1.5 rounded-lg" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">BIGGS</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Generate outlines and full articles using Gemini AI.</p>
                </button>
              </div>

              {/* My Posts Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">My Recent Stories</h3>
                  <button
                    onClick={() => setActiveTab('posts')}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Title</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Views</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {myPosts.slice(0, 5).map(post => (
                        <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">{post.title}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{post.date}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              post.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                              {post.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">{post.views?.toLocaleString() || 0}</td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPost(post.id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => window.open(`/${post.slug}`, '_blank')}
                                className="text-gray-600 hover:text-gray-800 dark:text-gray-400"
                                title="Preview"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {myPosts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                            You haven't written any posts yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Admin Analytics Chart */}
              {isAdmin && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Real-Time Content Performance (Views by Category)</h3>
                  <div className="h-64 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                          itemStyle={{ color: '#F3F4F6' }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                        />
                        <Bar dataKey="views" name="Total Views" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
                        <Bar dataKey="posts" name="Total Posts" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AUTOMATION TAB */}
          {activeTab === 'automation' && isAdmin && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bot size={28} className="text-primary-600" />
                    Auto-Pilot Automation
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Automatically fetch news, generate articles, create images, and publish 4 times a day.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-sm">
                    <span className="text-gray-500 mr-2">Posts Today:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{postsGeneratedToday}/4</span>
                  </div>

                  <button
                    onClick={toggleAutoPilot}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm ${isAutoPilotOn
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-500/20'
                      }`}
                  >
                    {isAutoPilotOn ? <Pause size={18} /> : <Play size={18} />}
                    {isAutoPilotOn ? 'Stop Auto-Pilot' : 'Start Auto-Pilot'}
                  </button>
                </div>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 p-4 opacity-10 ${isAutoPilotOn ? 'text-green-500' : 'text-gray-400'}`}>
                    <Zap size={64} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-3 h-3 rounded-full ${isAutoPilotOn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isAutoPilotOn ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {isAutoPilotOn ? 'Scheduled to run 4 times/day' : 'Click start to begin'}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Scheduled Run</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock size={24} className="text-blue-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {nextRunTime ? new Date(nextRunTime).toLocaleTimeString() : '--:--'}
                    </span>
                  </div>
                  <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Keep this tab open for automation to work
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Categories</h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {categories.slice(0, 5).map(c => (
                      <span key={c.id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                        {c.name}
                      </span>
                    ))}
                    {categories.length > 5 && (
                      <span className="text-xs text-gray-400 self-center">+{categories.length - 5} more</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Console Log Area */}
              <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col h-[400px]">
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-gray-400" />
                    <span className="text-sm font-mono text-gray-300">Automation Logs</span>
                  </div>
                  <button
                    onClick={() => setAutoLogs([])}
                    className="text-xs text-gray-400 hover:text-white hover:underline"
                  >
                    Clear Logs
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-2">
                  {autoLogs.length === 0 && (
                    <div className="text-gray-600 italic text-center mt-10">No activity logs yet...</div>
                  )}
                  {autoLogs.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                      <span className={`break-all ${log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                          log.type === 'warning' ? 'text-yellow-400' :
                            'text-blue-300'
                        }`}>
                        {log.type === 'success' && '✓ '}
                        {log.type === 'error' && '✕ '}
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>

              {/* Manual Trigger for Testing */}
              <div className="flex justify-end">
                <button
                  onClick={runAutomationCycle}
                  disabled={isAutoPilotOn}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                >
                  Trigger Single Run (Test)
                </button>
              </div>
            </div>
          )}

          {/* ALL POSTS TAB */}
          {activeTab === 'posts' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Posts</h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToEditor('manual')}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    <Plus size={16} />
                    <span>New Post</span>
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="pending">Pending</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Posts Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredPosts.map(post => (
                        <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                  {post.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {post.tags?.slice(0, 2).map(tag => `#${tag}`).join(', ')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img src={post.author.avatar} alt={post.author.name} className="w-6 h-6 rounded-full mr-2" />
                              <span className="text-sm text-gray-900 dark:text-white">{post.author.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {post.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              post.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                              {post.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {post.views?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {post.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPost(post.id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1"
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => window.open(`/${post.slug}`, '_blank')}
                                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 p-1"
                                title="Preview"
                              >
                                <Eye size={16} />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 p-1"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredPosts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            No posts found. {searchQuery && 'Try a different search term.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* APPROVALS TAB */}
          {activeTab === 'approvals' && isAdmin && (
            <div className="max-w-7xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Approvals</h1>

              {pendingPosts.length > 0 ? (
                <div className="space-y-4">
                  {pendingPosts.map(post => (
                    <div key={post.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-24 h-24 rounded-lg object-cover"
                            />
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{post.title}</h3>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center">
                                  <img src={post.author.avatar} alt={post.author.name} className="w-5 h-5 rounded-full mr-2" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{post.author.name}</span>
                                </div>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{post.date}</span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{post.category}</span>
                              </div>
                              <p className="text-gray-600 dark:text-gray-300 mb-3">{post.excerpt}</p>
                              <div className="flex flex-wrap gap-2">
                                {post.tags?.map(tag => (
                                  <span key={tag} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 md:w-48">
                          <button
                            onClick={() => window.open(`/${post.slug}`, '_blank')}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye size={16} />
                            Preview
                          </button>
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectPost(post.id)}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <X size={16} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No pending approvals</h3>
                  <p className="text-gray-500 dark:text-gray-400">All posts have been reviewed and approved.</p>
                </div>
              )}
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && isAdmin && (
            <div className="max-w-7xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posts</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {usersList.map(u => {
                        const userPosts = allPosts.filter(p => p.author.id === u.id);
                        return (
                          <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img className="h-10 w-10 rounded-full" src={u.avatar} alt="" />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {u.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                u.role === 'moderator' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                {u.role}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {userPosts.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
                              >
                                <option value="user">User</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && isAdmin && (
            <div className="max-w-7xl mx-auto space-y-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Categories</h1>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Category Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 sticky top-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add New Category</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., AI Trends"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon Name</label>
                        <input
                          type="text"
                          placeholder="Lucide icon name"
                          value={newCatIcon}
                          onChange={(e) => setNewCatIcon(e.target.value)}
                          className="input-field"
                        />
                        <p className="text-xs text-gray-500 mt-1">Use icon names from Lucide React Icons</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                          placeholder="Brief description of this category"
                          value={newCatDesc}
                          onChange={(e) => setNewCatDesc(e.target.value)}
                          className="input-field min-h-[100px]"
                        />
                      </div>
                      <button
                        onClick={handleCreateCategory}
                        className="w-full btn-primary flex items-center justify-center gap-2"
                      >
                        <Plus size={18} />
                        Create Category
                      </button>
                    </div>
                  </div>
                </div>

                {/* Categories List */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(cat => (
                      <div key={cat.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex justify-between items-start hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                              <Tag size={20} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white">{cat.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{cat.description || 'No description'}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-700 dark:text-gray-300">
                              {cat.count || 0} posts
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 p-1"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {categories.length === 0 && (
                      <div className="col-span-2 text-center py-12">
                        <Tag size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No categories yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Create your first category to organize posts.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && isAdmin && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <TrendingUp className="text-primary-500" />
                Performance Analytics
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Posts</div>
                  <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats.posts}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Views</div>
                  <div className="text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400">{stats.views.toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Registered Users</div>
                  <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats.users}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg. Engagement</div>
                  <div className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">{stats.engagement}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Views by Category</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                        itemStyle={{ color: '#F3F4F6' }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      />
                      <Bar dataKey="views" name="Total Views" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
                      <Bar dataKey="posts" name="Total Posts" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* EDITOR TAB */}
          {activeTab === 'editor' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">

              {/* Editor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    {editorMode === 'ai' ? <Sparkles className="text-primary-500" /> : <PenTool className="text-green-500" />}
                    {editorMode === 'ai' ? 'BIGGS' : 'Post Editor'}
                    {editingPostId && <span className="text-sm font-normal text-gray-500">(Editing)</span>}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {editorMode === 'ai' ? 'Let AI help you write amazing content' : 'Create and edit your blog posts'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                    <button
                      onClick={() => { setEditorMode('manual'); setStep(3) }}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${editorMode === 'manual'
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() => { setEditorMode('ai'); setStep(1) }}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${editorMode === 'ai'
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      AI Write
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-8">

                {/* === AI FLOW === */}
                {editorMode === 'ai' && (
                  <>
                    {/* Step 1: Topic */}
                    <div className={`space-y-6 ${step !== 1 ? 'hidden' : ''}`}>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">What should we write about?</h2>
                        <p className="text-gray-500 dark:text-gray-400">
                          Enter a topic or prompt and let AI generate an outline for you.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-base font-medium text-gray-700 dark:text-gray-200">
                          Topic or Prompt *
                        </label>
                        <div className="flex flex-col md:flex-row gap-3">
                          <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., The future of JavaScript frameworks, How to learn React in 2024, Benefits of TypeScript..."
                            className="input-field flex-1"
                          />
                          <button
                            onClick={handleGenerateOutline}
                            disabled={isGenerating || !topic.trim()}
                            className="btn-primary flex items-center justify-center min-w-[180px] h-[42px]"
                          >
                            {isGenerating ? (
                              <Loader2 size={20} className="animate-spin mr-2" />
                            ) : (
                              <Wand2 size={20} className="mr-2" />
                            )}
                            {isGenerating ? 'Generating...' : 'Generate Outline'}
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">
                          Be specific for better results. Include keywords and target audience if possible.
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Outline */}
                    <div className={`space-y-6 ${step !== 2 ? 'hidden' : ''}`}>
                      <button
                        onClick={() => setStep(1)}
                        className="text-sm flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-600"
                      >
                        <ArrowLeft size={16} className="mr-1" /> Back to Topic
                      </button>

                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Outline & Title</h2>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Review and refine the AI-generated outline. A good outline leads to better content.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post Title</label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a compelling title..."
                            className="input-field text-lg font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Outline (Markdown)
                            <span className="text-xs text-gray-500 ml-2">Edit as needed before generating full content</span>
                          </label>
                          <textarea
                            value={outline}
                            onChange={(e) => setOutline(e.target.value)}
                            placeholder="The AI-generated outline will appear here..."
                            className="input-field min-h-[300px] font-mono text-sm"
                          />
                        </div>

                        <button
                          onClick={handleGenerateFull}
                          disabled={isGenerating || !outline.trim()}
                          className="btn-primary w-full flex items-center justify-center"
                        >
                          {isGenerating ? (
                            <Loader2 size={20} className="animate-spin mr-2" />
                          ) : (
                            <Sparkles size={20} className="mr-2" />
                          )}
                          {isGenerating ? 'Generating Full Post...' : 'Generate Full Post from Outline'}
                        </button>
                      </div>
                    </div>

                    {/* Step 3: Final Review (AI) */}
                    <div className={`space-y-6 ${step !== 3 ? 'hidden' : ''}`}>
                      <button
                        onClick={() => setStep(2)}
                        className="text-sm flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-600"
                      >
                        <ArrowLeft size={16} className="mr-1" /> Back to Outline
                      </button>

                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Final Review</h2>
                          <p className="text-gray-500 dark:text-gray-400">
                            Review and refine the AI-generated content before publishing.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Generate new cover image?')) {
                              setRandomImage();
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <RefreshCw size={16} />
                          New Cover
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Form */}
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post Title *</label>
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Enter a compelling title..."
                              className="input-field text-xl font-bold"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                              <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="input-field"
                              >
                                {categories.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                              <input
                                type="text"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                placeholder="react, webdev, tutorial"
                                className="input-field"
                              />
                              <p className="text-xs text-gray-500 mt-1">Comma-separated keywords</p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Cover Image URL
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="input-field flex-1"
                              />
                              <button
                                onClick={setRandomImage}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                Random
                              </button>
                            </div>
                            {coverImage && (
                              <div className="mt-2 space-y-2">
                                <img
                                  src={coverImage}
                                  alt="Cover preview"
                                  className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <input
                                  type="text"
                                  value={coverImageAlt}
                                  onChange={(e) => setCoverImageAlt(e.target.value)}
                                  placeholder="Image Alt Text (for SEO)"
                                  className="input-field text-sm"
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Slug (Optional)</label>
                            <input
                              type="text"
                              value={slug}
                              onChange={(e) => setSlug(e.target.value)}
                              placeholder="custom-url-path"
                              className="input-field font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from title</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Short Description / Excerpt
                              <span className="text-xs text-gray-500 ml-2">(Supports Markdown/HTML for backlinks)</span>
                            </label>
                            <textarea
                              value={excerpt}
                              onChange={(e) => setExcerpt(e.target.value)}
                              placeholder="Brief summary for search results and social cards..."
                              className="input-field min-h-[100px]"
                            />
                            <p className="text-xs text-gray-500 mt-1">Shown in post listings and SEO previews</p>
                          </div>
                        </div>

                        {/* Right Column - Preview */}
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Content Preview
                            </label>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 max-h-[500px] overflow-y-auto">
                              <div className="prose dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeRaw]}
                                >
                                  {fullContent || '*Your content will appear here...*'}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                              <Sparkles size={16} />
                              AI-Generated Content
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              This content was generated by AI. Please review carefully for accuracy, tone, and relevance before publishing.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSavePost}
                        disabled={isSaving || !title || !fullContent}
                        className="btn-primary w-full flex items-center justify-center mt-6"
                      >
                        {isSaving ? (
                          <Loader2 size={20} className="animate-spin mr-2" />
                        ) : (
                          <Save size={20} className="mr-2" />
                        )}
                        {isSaving ? 'Saving...' : editingPostId ? 'Update Post' : isAdmin ? 'Publish Post' : 'Submit for Review'}
                      </button>
                    </div>
                  </>
                )}

                {/* === MANUAL FLOW === */}
                {editorMode === 'manual' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {editingPostId ? 'Edit Post' : 'Create New Post'}
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - Form */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post Title *</label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a compelling title..."
                            className="input-field text-xl font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="input-field"
                            >
                              {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                            <input
                              type="text"
                              value={tagsInput}
                              onChange={(e) => setTagsInput(e.target.value)}
                              placeholder="react, webdev, tutorial"
                              className="input-field"
                            />
                            <p className="text-xs text-gray-500 mt-1">Comma-separated keywords</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cover Image URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={coverImage}
                              onChange={(e) => setCoverImage(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                              className="input-field flex-1"
                            />
                            <button
                              onClick={setRandomImage}
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              Random
                            </button>
                          </div>
                          {coverImage && (
                            <div className="mt-2 space-y-2">
                              <img
                                src={coverImage}
                                alt="Cover preview"
                                className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <input
                                type="text"
                                value={coverImageAlt}
                                onChange={(e) => setCoverImageAlt(e.target.value)}
                                placeholder="Image Alt Text (for SEO)"
                                className="input-field text-sm"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Slug (Optional)</label>
                          <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="custom-url-path"
                            className="input-field font-mono text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from title</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Short Description / Excerpt
                            <span className="text-xs text-gray-500 ml-2">(Supports Markdown/HTML)</span>
                          </label>
                          <textarea
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="Brief summary for search results and social cards..."
                            className="input-field min-h-[100px]"
                          />
                          <p className="text-xs text-gray-500 mt-1">Shown in post listings and SEO previews</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Content (Markdown & HTML) *
                          </label>
                          <textarea
                            value={fullContent}
                            onChange={(e) => setFullContent(e.target.value)}
                            placeholder="Start writing your post using Markdown. You can also use HTML tags..."
                            className="input-field min-h-[400px] font-mono text-sm"
                          />
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-500">
                              Supports: # Headers, **bold**, *italic*, `code`, ```code blocks```, &lt;html&gt;
                            </p>
                            <span className="text-xs text-gray-500">
                              {fullContent.split(' ').length} words
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Preview */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Live Preview
                          </label>
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900 max-h-[600px] overflow-y-auto">
                            {coverImage && (
                              <img
                                src={coverImage}
                                alt="Cover"
                                className="w-full h-48 object-cover rounded-lg mb-6"
                              />
                            )}
                            <div className="prose dark:prose-invert max-w-none">
                              <h1 className="text-3xl font-bold mb-4">{title || 'Post Title'}</h1>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                <span>By {user?.name}</span>
                                <span>•</span>
                                <span>{new Date().toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{Math.ceil((fullContent || '').split(' ').length / 200)} min read</span>
                              </div>
                              {excerpt && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                                  <p className="text-gray-600 dark:text-gray-300 italic">{excerpt}</p>
                                </div>
                              )}
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                              >
                                {fullContent || '*Start writing your content...*'}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setActiveTab('posts')}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleSavePost}
                        disabled={isSaving || !title || !fullContent || !category}
                        className="btn-primary flex items-center justify-center px-6"
                      >
                        {isSaving ? (
                          <Loader2 size={20} className="animate-spin mr-2" />
                        ) : (
                          <Save size={20} className="mr-2" />
                        )}
                        {isSaving ? 'Saving...' : editingPostId ? 'Update Post' : isAdmin ? 'Publish Post' : 'Submit for Review'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;