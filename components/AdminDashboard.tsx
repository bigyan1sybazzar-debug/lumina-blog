'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getPosts, createPost, seedDatabase, getAllUsers, updateUserRole, updateUserStatus, getPendingPosts, updatePostStatus, getUserPosts, getCategories, createCategory, getAllComments, getAllReviews, deleteComment, deleteReview, replyToComment, replyToReview, getAllPostsAdmin, getAllPollsAdmin, updatePollStatus, updatePoll, deletePoll } from '../services/db';
import { generateBlogOutline, generateFullPost, generateNewsPost, generateBlogImage } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { BlogPost, User, Category, BlogPostComment, BlogPostReview, Poll } from '../types';
// Removed modular firestore imports for consistency with services/firebase.ts
import { db } from '../services/firebase';
import { getAllChats } from '../services/chatService';
import { ChatSession } from '../types';

import {
  LayoutDashboard, FileText, Settings, Sparkles, Loader2, Save, LogOut, Home, Database,
  PenTool, Image as ImageIcon, Menu, X, ArrowLeft, Plus, Edit3, Wand2, RefreshCw,
  Users, CheckCircle, Shield, Tag, Globe, ExternalLink, Trash2, Eye,
  Calendar, TrendingUp, MessageSquare, Download, Upload, Search, Filter,
  Bot, Vote
} from 'lucide-react';
import { AnalyticsDashboard } from './admin/AnalyticsDashboard';
import { UserManagement } from './admin/UserManagement';
import { ContentApprovals } from './admin/ContentApprovals';
import { AutomationPanel } from './admin/AutomationPanel';
import { FeaturedManager } from './admin/FeaturedManager';
import { CategoriesManager } from './admin/CategoriesManager';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'posts' | 'users' | 'categories' | 'approvals' | 'analytics' | 'automation' | 'featured' | 'chat-history' | 'reviews-comments' | 'polls' | 'social'>('dashboard');
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
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [sitemapUrl, setSitemapUrl] = useState<string | null>(null);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);

  // Chat History State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  // Reviews & Comments State
  const [allComments, setAllComments] = useState<BlogPostComment[]>([]);
  const [allReviews, setAllReviews] = useState<BlogPostReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsTab, setReviewsTab] = useState<'reviews' | 'comments'>('reviews');
  const [replyingTo, setReplyingTo] = useState<{ type: 'review' | 'comment', id: string } | null>(null);
  const [replyText, setReplyText] = useState('');

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
  // Removed local interval states

  // Poll Editing State
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [pollForm, setPollForm] = useState<Partial<Poll>>({});

  // Featured Posts Manager State
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [availablePosts, setAvailablePosts] = useState<BlogPost[]>([]);
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;

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

  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    const tab = searchParams.get('tab');
    if (tab === 'editor') {
      setActiveTab('editor');
      setEditorMode('manual');
      setStep(3);
    }

    const editId = searchParams.get('edit');
    if (editId) {
      handleEditPost(editId);
    }
  }, [searchParams]);

  // === Load & Save Featured Posts ===
  const loadFeaturedPosts = async () => {
    try {
      const configDoc = await db.collection('config').doc('featured').get();
      if (configDoc.exists) {
        const ids: string[] = configDoc.data()?.postIds || [];
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
      await db.collection('config').doc('featured').set({
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
        const allPostsData = await getAllPostsAdmin();
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

        const polls = await getAllPollsAdmin();
        setAllPolls(polls);
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
    if (activeTab === 'chat-history' && isAdmin) {
      setIsLoadingChats(true);
      getAllChats().then(chats => {
        setChatSessions(chats);
        setIsLoadingChats(false);
      });
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab === 'reviews-comments' && isAdmin) {
      setIsLoadingReviews(true);
      Promise.all([getAllComments(), getAllReviews()]).then(([comments, reviews]) => {
        setAllComments(comments);
        setAllReviews(reviews);
        setIsLoadingReviews(false);
      });
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    refreshData();
  }, [user, activeTab]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoLogs]);

  // --- AUTOMATION LOGIC (SERVER-SIDE) ---

  // Listen to Firestore config
  useEffect(() => {
    // Only listen if we are admin
    if (!isAdmin) return;

    const unsub = db.collection('config').doc('autopilot').onSnapshot(
      (docSnap) => {
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data) {
            setIsAutoPilotOn(!!data.isEnabled);
            const logs = data.logs || [];
            setAutoLogs([...logs].reverse());
          }
        }
      },
      (error) => {
        console.error("Firestore listener error:", error);
        if (error.code === 'permission-denied') {
          console.error("Error: Permission denied. Check Firestore Rules.");
        }
      }
    );

    return () => unsub();
  }, [isAdmin]);

  const toggleAutoPilot = async () => {
    try {
      const newState = !isAutoPilotOn;
      await db.collection('config').doc('autopilot').set({
        isEnabled: newState,
        // Initialize logs if not present
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Optimistic updat is not needed due to listener, but feedback is good
      alert(newState ? 'Auto-Pilot Enabled (Server-Side)' : 'Auto-Pilot Disabled');
    } catch (error) {
      console.error('Failed to toggle autopilot:', error);
      alert('Error updating configuration');
    }
  };

  const runAutomationCycle = async () => {
    // TODO: Implement secure manual trigger via new API route
    alert("Manual trigger is currently disabled for server-side automation. Please check back later.");
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
        author: editorMode === 'ai'
          ? { name: 'BIGGS', avatar: '/images/biggs-avatar.png', id: 'ai-bot' }
          : { name: user.name, avatar: user.avatar, id: user.id },
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

  const handleHidePost = async (postId: string) => {
    if (confirm('Are you sure you want to hide this post? It will not be visible to the public.')) {
      try {
        await updatePostStatus(postId, 'hidden');
        alert('Post hidden successfully!');
        refreshData();
      } catch (error) {
        alert('Failed to hide post.');
        console.error(error);
      }
    }
  };

  const handleUnhidePost = async (postId: string) => {
    try {
      await updatePostStatus(postId, 'published');
      alert('Post unhidden and published!');
      refreshData();
    } catch (error) {
      alert('Failed to unhide post.');
      console.error(error);
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

  const handleApproveUser = async (userId: string) => {
    try {
      await updateUserStatus(userId, 'approved');
      alert('User approved successfully!');
      refreshData();
    } catch (error) {
      alert('Failed to approve user.');
      console.error(error);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (confirm('Are you sure you want to reject this user?')) {
      try {
        await updateUserStatus(userId, 'rejected');
        alert('User rejected.');
        refreshData();
      } catch (error) {
        alert('Failed to reject user.');
        console.error(error);
      }
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
      const response = await fetch('/api/sitemap', {
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

  const handleApprovePoll = async (pollId: string) => {
    try {
      await updatePollStatus(pollId, 'approved');
      alert('Poll approved!');
      refreshData();
    } catch (error) {
      alert('Failed to approve poll.');
      console.error(error);
    }
  };

  const handleRejectPoll = async (pollId: string) => {
    if (window.confirm('Are you sure you want to reject this poll?')) {
      try {
        await updatePollStatus(pollId, 'rejected');
        alert('Poll rejected.');
        refreshData();
      } catch (error) {
        alert('Failed to reject poll.');
        console.error(error);
      }
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!window.confirm('Are you sure you want to delete this poll permanently?')) return;
    try {
      await deletePoll(pollId);
      await refreshData();
      alert('Poll deleted successfully!');
    } catch (err) {
      alert('Failed to delete poll');
    }
  };

  const handleEditPoll = (poll: Poll) => {
    setEditingPoll(poll);
    setPollForm({ ...poll });
  };

  const handleSavePollEdit = async () => {
    if (!editingPoll) return;
    try {
      setIsSaving(true);
      await updatePoll(editingPoll.id, pollForm);
      await refreshData();
      setEditingPoll(null);
      alert('Poll updated successfully!');
    } catch (error) {
      console.error('Error updating poll:', error);
      alert('Failed to update poll');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFeaturedPoll = async (pollId: string, currentStatus: boolean) => {
    try {
      await updatePoll(pollId, { isFeatured: !currentStatus });
      alert(`Poll ${!currentStatus ? 'marked as featured' : 'removed from featured'}!`);
      refreshData();
    } catch (error) {
      alert('Failed to update featured status.');
      console.error(error);
    }
  };

  // Reviews & Comments Handlers
  const handleDeleteComment = async (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(commentId);
        setAllComments(allComments.filter(c => c.id !== commentId));
        alert('Comment deleted successfully!');
      } catch (error) {
        alert('Failed to delete comment.');
        console.error(error);
      }
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview(reviewId);
        setAllReviews(allReviews.filter(r => r.id !== reviewId));
        alert('Review deleted successfully!');
      } catch (error) {
        alert('Failed to delete review.');
        console.error(error);
      }
    }
  };

  const handleReplySubmit = async () => {
    if (!replyingTo || !replyText.trim() || !user) return;

    try {
      if (replyingTo.type === 'comment') {
        await replyToComment(replyingTo.id, user.name, replyText);
        setAllComments(allComments.map(c =>
          c.id === replyingTo.id
            ? { ...c, adminReply: { content: replyText, adminName: user.name, repliedAt: new Date().toISOString() } }
            : c
        ));
      } else {
        await replyToReview(replyingTo.id, user.name, replyText);
        setAllReviews(allReviews.map(r =>
          r.id === replyingTo.id
            ? { ...r, adminReply: { content: replyText, adminName: user.name, repliedAt: new Date().toISOString() } }
            : r
        ));
      }
      alert('Reply added successfully!');
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      alert('Failed to add reply.');
      console.error(error);
    }
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
                    Approvals {(pendingPosts.length + allPolls.filter(p => p.status === 'pending').length) > 0 && (
                      <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {pendingPosts.length + allPolls.filter(p => p.status === 'pending').length}
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
                    onClick={() => { setActiveTab('chat-history'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'chat-history'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <MessageSquare size={18} className="mr-3" /> Chat History
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

                  <button
                    onClick={() => { setActiveTab('reviews-comments'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'reviews-comments'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <MessageSquare size={18} className="mr-3" /> Reviews & Comments
                  </button>

                  <button
                    onClick={() => { setActiveTab('polls'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'polls'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Vote size={18} className="mr-3" /> Manage Polls
                  </button>

                  <button
                    onClick={() => { setActiveTab('social'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'social'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Users size={18} className="mr-3" /> Social Mgmt
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
          {
            activeTab === 'featured' && isAdmin && (
              <FeaturedManager
                featuredPosts={featuredPosts}
                availablePosts={availablePosts}
                isSavingFeatured={isSavingFeatured}
                onSave={saveFeaturedOrder}
                setFeaturedPosts={setFeaturedPosts}
                setAvailablePosts={setAvailablePosts}
              />
            )}
          {/* === CHAT HISTORY TAB === */}
          {
            activeTab === 'chat-history' && isAdmin && (
              <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
                {/* Chat List */}
                <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary-500" />
                      User Chats
                    </h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {isLoadingChats ? (
                      <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
                    ) : chatSessions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No chat history found.</p>
                    ) : (
                      <div className="space-y-2">
                        {chatSessions.map(session => (
                          <button
                            key={session.id}
                            onClick={() => setSelectedChatId(session.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${selectedChatId === session.id
                              ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 border'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                {session.userAvatar ? <img src={session.userAvatar} className="w-10 h-10 rounded-full" /> : (session.userName?.[0] || 'U')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {session.userName || 'Guest User'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(session.updatedAt).toLocaleDateString()} • {session.messages.length} msgs
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Detail */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                  {selectedChatId ? (
                    <>
                      {(() => {
                        const session = chatSessions.find(s => s.id === selectedChatId);
                        if (!session) return <div>Session not found</div>;
                        return (
                          <>
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                  Conversation with {session.userName || 'User'}
                                </h3>
                                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                                  {new Date(session.updatedAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                              {session.messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-600'
                                    }`}>
                                    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                                      {msg.content}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                      <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                      <p>Select a chat session to view details</p>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          {/* DASHBOARD TAB */}
          {
            activeTab === 'dashboard' && (
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
                {/* New component handling Stats and Chart */}
                <AnalyticsDashboard
                  stats={stats}
                  pendingPostsCount={pendingPosts.length}
                  chartData={chartData}
                  isAdmin={isAdmin}
                />

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
                {/* Chart removed as it is now included in AnalyticsDashboard above */}
              </div>
            )
          }

          {/* AUTOMATION TAB */}
          {
            activeTab === 'automation' && isAdmin && (
              <AutomationPanel
                isAutoPilotOn={isAutoPilotOn}
                toggleAutoPilot={toggleAutoPilot}
                runAutomationCycle={runAutomationCycle}
                autoLogs={autoLogs}
                setAutoLogs={setAutoLogs}
                categories={categories}
              />
            )
          }

          {/* ALL POSTS TAB */}
          {
            activeTab === 'posts' && (
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
                        <option value="hidden">Hidden</option>
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
                                  post.status === 'hidden' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
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
                                  <>
                                    {post.status === 'hidden' ? (
                                      <button
                                        onClick={() => handleUnhidePost(post.id)}
                                        className="text-purple-600 hover:text-purple-800 dark:text-purple-400 p-1"
                                        title="Unhide"
                                      >
                                        <Eye size={16} />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleHidePost(post.id)}
                                        className="text-purple-600 hover:text-purple-800 dark:text-purple-400 p-1"
                                        title="Hide"
                                      >
                                        <Eye size={16} className="opacity-50" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeletePost(post.id)}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 p-1"
                                      title="Delete"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
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
            )
          }

          {/* APPROVALS TAB */}
          {
            activeTab === 'approvals' && isAdmin && (
              <ContentApprovals
                pendingPosts={pendingPosts}
                pendingPolls={allPolls.filter(p => p.status === 'pending')}
                onApprovePost={handleApprovePost}
                onRejectPost={handleRejectPost}
                onApprovePoll={handleApprovePoll}
                onRejectPoll={handleRejectPoll}
              />
            )
          }

          {/* USERS TAB */}
          {
            activeTab === 'users' && isAdmin && (
              <div className="max-w-7xl mx-auto space-y-6">
                <UserManagement
                  users={usersList}
                  onChangeRole={handleChangeRole}
                  onApproveUser={handleApproveUser}
                  onRejectUser={handleRejectUser}
                />
              </div>
            )
          }

          {/* SOCIAL MANAGEMENT TAB */}
          {
            activeTab === 'social' && isAdmin && (
              <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Social & Profile Management</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Profiles</h3>
                      <div className="space-y-4">
                        {usersList.map(u => (
                          <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center space-x-3">
                              <img src={u.avatar} className="w-10 h-10 rounded-full object-cover" />
                              <div>
                                <p className="font-bold dark:text-white">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={async () => {
                                  const newBio = prompt('Enter new bio for user:', u.bio || '');
                                  if (newBio !== null) {
                                    await db.collection('users').doc(u.id).update({ bio: newBio });
                                    refreshData();
                                  }
                                }}
                                className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <Edit3 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Social Stats</h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Users</span>
                          <span className="font-bold dark:text-white">{usersList.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Social Interface</span>
                          <span className="font-bold dark:text-white">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {/* CATEGORIES TAB */}
          {
            activeTab === 'categories' && isAdmin && (
              <CategoriesManager
                categories={categories}
                onCreateCategory={handleCreateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )
          }

          {/* ANALYTICS TAB */}
          {
            activeTab === 'analytics' && isAdmin && (
              <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                  <TrendingUp className="text-primary-500" />
                  Performance Analytics
                </h1>
                <AnalyticsDashboard
                  stats={stats}
                  pendingPostsCount={pendingPosts.length}
                  chartData={chartData}
                  isAdmin={isAdmin}
                />
              </div>
            )
          }

          {/* EDITOR TAB */}
          {
            activeTab === 'editor' && (
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
            )
          }

          {/* === REVIEWS & COMMENTS TAB === */}
          {
            activeTab === 'reviews-comments' && isAdmin && (
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <MessageSquare className="text-primary-600" />
                      Reviews & Comments Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View, reply to, and moderate user feedback</p>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setReviewsTab('reviews')}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${reviewsTab === 'reviews'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                  >
                    Reviews ({allReviews.length})
                  </button>
                  <button
                    onClick={() => setReviewsTab('comments')}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${reviewsTab === 'comments'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                  >
                    Comments ({allComments.length})
                  </button>
                </div>

                {isLoadingReviews ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewsTab === 'reviews' ? (
                      <>
                        {allReviews.length === 0 ? (
                          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No reviews yet</p>
                          </div>
                        ) : (
                          allReviews.map((review) => (
                            <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                  <img src={review.userAvatar} alt={review.userName} className="w-12 h-12 rounded-full" />
                                  <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{review.userName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                                        ))}
                                      </div>
                                      <span className="text-sm text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                  title="Delete review"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>

                              <div className="text-sm">
                                <span className="text-gray-500">On post: </span>
                                <Link href={`/${review.postId}`} className="text-primary-600 hover:underline">
                                  {review.postTitle}
                                </Link>
                              </div>

                              <p className="text-gray-700 dark:text-gray-300">{review.content}</p>

                              {review.adminReply ? (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                                    Reply by {review.adminReply.adminName}
                                  </p>
                                  <p className="text-gray-700 dark:text-gray-300">{review.adminReply.content}</p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {new Date(review.adminReply.repliedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  {replyingTo?.type === 'review' && replyingTo.id === review.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write your reply..."
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        rows={3}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleReplySubmit}
                                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                        >
                                          Submit Reply
                                        </button>
                                        <button
                                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setReplyingTo({ type: 'review', id: review.id })}
                                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                    >
                                      Reply to this review
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </>
                    ) : (
                      <>
                        {allComments.length === 0 ? (
                          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No comments yet</p>
                          </div>
                        ) : (
                          allComments.map((comment) => (
                            <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                  <img src={comment.userAvatar} alt={comment.userName} className="w-12 h-12 rounded-full" />
                                  <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{comment.userName}</h3>
                                    <span className="text-sm text-gray-500">
                                      {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                  title="Delete comment"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>

                              <div className="text-sm">
                                <span className="text-gray-500">On post: </span>
                                <Link href={`/${comment.postId}`} className="text-primary-600 hover:underline">
                                  {comment.postTitle}
                                </Link>
                              </div>

                              <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>

                              {comment.adminReply ? (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                                    Reply by {comment.adminReply.adminName}
                                  </p>
                                  <p className="text-gray-700 dark:text-gray-300">{comment.adminReply.content}</p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {new Date(comment.adminReply.repliedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  {replyingTo?.type === 'comment' && replyingTo.id === comment.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write your reply..."
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        rows={3}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleReplySubmit}
                                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                        >
                                          Submit Reply
                                        </button>
                                        <button
                                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setReplyingTo({ type: 'comment', id: comment.id })}
                                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                    >
                                      Reply to this comment
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          }

          {/* === POLLS TAB === */}
          {
            activeTab === 'polls' && isAdmin && (
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <Vote className="text-primary-600" />
                      Polls Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Approve, reject, or delete user-submitted polls</p>
                  </div>
                </div>

                {/* Edit Poll Modal Overlay */}
                {editingPoll && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transform animate-in zoom-in duration-300">
                      <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
                            <PenTool size={24} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Edit Poll Context</h2>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Updating: {editingPoll.question.substring(0, 30)}...</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingPoll(null)}
                          className="p-3 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 hover:text-red-500 transition-all hover:rotate-90"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          {/* Left Column: Basic Info */}
                          <div className="space-y-8">
                            <div className="space-y-4">
                              <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600">
                                <FileText size={14} /> Poll Question
                              </label>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={pollForm.question || ''}
                                  onChange={(e) => {
                                    const newQuestion = e.target.value;
                                    const newSlug = newQuestion.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                    // If slug was empty or matched the old slugified question, update it
                                    const currentSlug = pollForm.slug || '';
                                    const oldSlug = (pollForm.question || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

                                    if (!currentSlug || currentSlug === oldSlug) {
                                      setPollForm({ ...pollForm, question: newQuestion, slug: newSlug });
                                    } else {
                                      setPollForm({ ...pollForm, question: newQuestion });
                                    }
                                  }}
                                  className="w-full p-5 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-primary-600 dark:focus:border-primary-500 rounded-3xl outline-none dark:text-white text-lg font-bold transition-all"
                                  placeholder="What's the question?"
                                />
                                <div className="flex items-center gap-2 group">
                                  <Globe size={12} className="text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                  <input
                                    type="text"
                                    value={pollForm.slug || ''}
                                    onChange={(e) => setPollForm({ ...pollForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                                    className="flex-1 bg-transparent text-[10px] font-mono text-gray-400 outline-none p-1 border-b border-transparent focus:border-primary-500/30"
                                    placeholder="poll-url-slug"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600">
                                <MessageSquare size={14} /> Description / Context
                              </label>
                              <textarea
                                value={pollForm.description || ''}
                                onChange={(e) => setPollForm({ ...pollForm, description: e.target.value })}
                                className="w-full p-5 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-primary-600 dark:focus:border-primary-500 rounded-3xl outline-none dark:text-white min-h-[140px] font-medium leading-relaxed transition-all"
                                placeholder="Explain the context of this poll..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600">
                                  <Tag size={14} /> Category
                                </label>
                                <select
                                  value={pollForm.category || ''}
                                  onChange={(e) => setPollForm({ ...pollForm, category: e.target.value as any })}
                                  className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-primary-600 dark:focus:border-primary-500 rounded-[1.5rem] outline-none dark:text-white font-bold"
                                >
                                  <option value="election">Elections</option>
                                  <option value="movies">Movies</option>
                                  <option value="gadgets">Gadgets</option>
                                  <option value="other">Others</option>
                                </select>
                              </div>
                              <div className="space-y-4">
                                <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600">
                                  <ImageIcon size={14} /> Hero Image URL
                                </label>
                                <input
                                  type="text"
                                  value={pollForm.questionImage || ''}
                                  onChange={(e) => setPollForm({ ...pollForm, questionImage: e.target.value })}
                                  className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-primary-600 dark:focus:border-primary-500 rounded-[1.5rem] outline-none dark:text-white font-mono text-xs"
                                  placeholder="https://..."
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600">
                                  <Sparkles size={14} /> Featured Status
                                </label>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-[1.5rem]">
                                  <button
                                    onClick={() => setPollForm({ ...pollForm, isFeatured: !pollForm.isFeatured })}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${pollForm.isFeatured ? 'bg-yellow-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                                  >
                                    {pollForm.isFeatured ? 'Featured' : 'Not Featured'}
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600">
                                  <TrendingUp size={14} /> Featured Order
                                </label>
                                <input
                                  type="number"
                                  value={pollForm.featuredOrder || ''}
                                  onChange={(e) => setPollForm({ ...pollForm, featuredOrder: parseInt(e.target.value) || 0 })}
                                  className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-primary-600 dark:focus:border-primary-500 rounded-[1.5rem] outline-none dark:text-white font-bold"
                                  placeholder="e.g. 1"
                                  disabled={!pollForm.isFeatured}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Options */}
                          <div className="space-y-6">
                            <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600">
                              <Users size={14} /> Option Configurations
                            </label>
                            <div className="space-y-4">
                              {pollForm.options?.map((opt, idx) => (
                                <div key={opt.id} className="p-6 border border-gray-100 dark:border-gray-700 rounded-[2rem] bg-gray-50/50 dark:bg-gray-900/30 flex gap-6 hover:shadow-lg hover:shadow-primary-600/5 transition-all group/opt">
                                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 flex-shrink-0 border border-gray-100 dark:border-gray-700 shadow-sm relative">
                                    {opt.image ? (
                                      <img src={opt.image} alt={opt.text} className="w-full h-full object-cover group-hover/opt:scale-110 transition-transform duration-500" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ImageIcon size={24} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <input
                                      type="text"
                                      value={opt.text}
                                      onChange={(e) => {
                                        const newOptions = [...pollForm.options!];
                                        newOptions[idx] = { ...opt, text: e.target.value };
                                        setPollForm({ ...pollForm, options: newOptions });
                                      }}
                                      className="w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary-600 dark:focus:border-primary-500 outline-none dark:text-white font-bold text-lg p-1 transition-all"
                                      placeholder={`Option ${idx + 1}`}
                                    />
                                    <input
                                      type="text"
                                      value={opt.image || ''}
                                      onChange={(e) => {
                                        const newOptions = [...pollForm.options!];
                                        newOptions[idx] = { ...opt, image: e.target.value };
                                        setPollForm({ ...pollForm, options: newOptions });
                                      }}
                                      className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none dark:text-white text-[10px] font-mono"
                                      placeholder="Option Image URL"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/10 flex justify-end gap-4">
                        <button
                          onClick={() => setEditingPoll(null)}
                          className="px-8 py-4 rounded-2xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                        >
                          Cancel Editing
                        </button>
                        <button
                          onClick={handleSavePollEdit}
                          disabled={isSaving}
                          className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-primary-500/20 active:scale-95 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                          Commit Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Poll Question</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Featured / Order</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Votes</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {allPolls.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No polls found</td>
                          </tr>
                        ) : (
                          allPolls.map(poll => (
                            <tr key={poll.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-900 dark:text-white">{poll.question}</p>
                                <p className="text-xs text-gray-500">{poll.slug}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                                  {poll.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${poll.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  poll.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>
                                  {poll.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {poll.totalVotes}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleFeaturedPoll(poll.id, !!poll.isFeatured)}
                                    className={`p-1 rounded-lg transition-colors ${poll.isFeatured ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    title={poll.isFeatured ? "Unfeature" : "Feature"}
                                  >
                                    <Sparkles size={18} fill={poll.isFeatured ? "currentColor" : "none"} />
                                  </button>
                                  {poll.isFeatured && (
                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                      #{poll.featuredOrder || 0}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                {poll.status !== 'approved' && (
                                  <button
                                    onClick={() => handleApprovePoll(poll.id)}
                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                )}
                                {poll.status === 'pending' && (
                                  <button
                                    onClick={() => handleRejectPoll(poll.id)}
                                    className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <X size={18} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditPoll(poll)}
                                  className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeletePoll(poll.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <Link
                                  href={`/voting/${poll.slug}`}
                                  target="_blank"
                                  className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg transition-colors inline-block"
                                >
                                  <ExternalLink size={18} />
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          }
        </div>
      </main>
    </div>
  );
};
export default Admin;