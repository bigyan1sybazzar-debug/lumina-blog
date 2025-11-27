import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, FileText, Settings, Sparkles, Loader2, Save, LogOut, Home, Database, PenTool, Image as ImageIcon, Menu, X, ArrowLeft, Plus, Edit3, Wand2, RefreshCw, Users, CheckCircle, Clock, Shield, Tag } from 'lucide-react';
import { ANALYTICS_DATA } from '../constants';
import { getPosts, createPost, seedDatabase, getAllUsers, updateUserRole, getPendingPosts, updatePostStatus, getUserPosts, getCategories, createCategory } from '../services/db';
import { generateBlogOutline, generateFullPost } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BlogPost, User, Category } from '../types';

// New Imports for Markdown Rendering with HTML Support
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // <-- Enables HTML rendering

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'users' | 'categories' | 'approvals'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [stats, setStats] = useState({ posts: 0, views: 0 });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [pendingPosts, setPendingPosts] = useState<BlogPost[]>([]);
  const [myPosts, setMyPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Editor State
  const [editorMode, setEditorMode] = useState<'ai' | 'manual'>('manual');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [outline, setOutline] = useState('');
  
  // Post Data State
  const [title, setTitle] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('https://picsum.photos/800/400?random=1');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Topic, 2: Outline, 3: Final

  // Category creation
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Hash');

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;

  const refreshData = async () => {
    if (isAdmin) {
      // Admin specific data
      const allPosts = await getPosts();
      const totalViews = allPosts.reduce((acc, curr) => acc + (curr.views || 0), 0);
      setStats({ posts: allPosts.length, views: totalViews });
      
      const pPending = await getPendingPosts();
      setPendingPosts(pPending);

      const allUsers = await getAllUsers();
      setUsersList(allUsers);
    }

    // User specific data
    if (user) {
      const mine = await getUserPosts(user.id);
      setMyPosts(mine);
    }
    
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    refreshData();
  }, [user, activeTab]);

  const handleGenerateOutline = async () => {
    if (!topic) return;
    setIsGenerating(true);
    const result = await generateBlogOutline(topic);
    setOutline(result);
    // Rough extraction of a title
    const lines = result.split('\n');
    const possibleTitle = lines.find(l => l.startsWith('#'))?.replace('#', '').trim() || `Post about ${topic}`;
    setTitle(possibleTitle);
    setIsGenerating(false);
    setStep(2);
  };

  const handleGenerateFull = async () => {
    setIsGenerating(true);
    const result = await generateFullPost(title, outline);
    setFullContent(result);
    setIsGenerating(false);
    setStep(3);
  };

  const handleSavePost = async () => {
    if (!title || !fullContent || !user) {
      alert("Please fill in the Title and Content fields.");
      return;
    }
    setIsSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      if (editorMode === 'ai' && tags.length === 0) tags.push('AI Generated');

      // Regular users post as pending, Admin as published
      const status = isAdmin ? 'published' : 'pending';

      await createPost({
        title: title,
        content: fullContent,
        excerpt: fullContent.substring(0, 150).replace(/[#*`]/g, '') + "...",
        author: { name: user.name, avatar: user.avatar, id: user.id },
        readTime: `${Math.ceil(fullContent.split(' ').length / 200)} min read`,
        category: category, 
        tags: tags,
        coverImage: coverImage,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: status
      });
      
      alert(isAdmin ? 'Post published successfully!' : 'Post submitted for approval!');
      
      // Reset form
      setStep(1); setTopic(''); setTitle(''); setOutline(''); setFullContent(''); setTagsInput('');
      setEditorMode('manual'); 
      setActiveTab('dashboard');
      refreshData();
    } catch (e) {
      alert('Failed to save post. Check console for details.');
      console.error(e);
    }
    setIsSaving(false);
  };

  const handleApprovePost = async (postId: string) => {
    await updatePostStatus(postId, 'published');
    refreshData();
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    await updateUserRole(userId, newRole);
    refreshData();
  };

  const handleCreateCategory = async () => {
    if(!newCatName) return;
    await createCategory({ name: newCatName, description: newCatDesc, icon: newCatIcon });
    setNewCatName(''); setNewCatDesc('');
    refreshData();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const setRandomImage = () => setCoverImage(`https://picsum.photos/800/400?random=${Math.floor(Math.random() * 1000)}`);
  const goToEditor = (mode: 'manual' | 'ai') => { setEditorMode(mode); setActiveTab('editor'); setIsSidebarOpen(false); };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              Lumina
            </span>
            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 uppercase">{user?.role}</span>
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
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <LayoutDashboard size={18} className="mr-3" />
                Dashboard
              </button>
              
              <button
                onClick={() => goToEditor('manual')}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'editor' 
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <PenTool size={18} className="mr-3" />
                Write Post
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => { setActiveTab('approvals'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'approvals' 
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <CheckCircle size={18} className="mr-3" />
                    Pending ({pendingPosts.length})
                  </button>
                  <button
                    onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'users' 
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Users size={18} className="mr-3" />
                    Users
                  </button>
                  <button
                    onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'categories' 
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Tag size={18} className="mr-3" />
                    Categories
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
            <Link to="/" className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Home size={16} className="mr-3" />
              Back to Site
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:hover:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <LogOut size={16} className="mr-3" />
              Sign Out
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
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
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
                    <button 
                        onClick={async () => { if(confirm("Seed DB?")) await seedDatabase(); refreshData(); }}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                        <Database size={16} />
                        <span className="hidden sm:inline">Seed Data</span>
                    </button>
                    )}
                  </div>
              </div>

              {/* Admin Stats Grid */}
              {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.views}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Posts</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.posts}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{pendingPosts.length}</p>
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
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">AI Assistant</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Generate outlines and full articles using Gemini AI.</p>
                </button>
              </div>
              
              {/* My Posts Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">My Recent Stories</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Title</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Views</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {myPosts.length > 0 ? myPosts.map(post => (
                        <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">{post.title}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{post.date}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              post.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              post.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {post.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">{post.views || 0}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-sm text-gray-500">You haven't written any posts yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Admin Analytics Chart */}
              {isAdmin && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Traffic Analytics</h3>
                  <div className="h-64 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ANALYTICS_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                          itemStyle={{ color: '#F3F4F6' }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                        />
                        <Bar dataKey="views" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
                        <Bar dataKey="visitors" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* APPROVALS TAB (Admin) */}
          {activeTab === 'approvals' && isAdmin && (
            <div className="max-w-6xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Approvals</h1>
              <div className="space-y-4">
                {pendingPosts.length > 0 ? pendingPosts.map(post => (
                  <div key={post.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{post.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">By {post.author.name} • {post.date}</p>
                      <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => window.open(`#/blog/${post.id}`, '_blank')} className="btn-secondary text-sm">Preview</button>
                       <button onClick={() => handleApprovePost(post.id)} className="btn-primary bg-green-600 hover:bg-green-700 text-sm">Approve</button>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500">No pending posts to review.</p>
                )}
              </div>
            </div>
          )}

          {/* USERS TAB (Admin) */}
          {activeTab === 'users' && isAdmin && (
              <div className="max-w-6xl mx-auto space-y-6">
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
               <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {usersList.map(u => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img className="h-10 w-10 rounded-full" src={u.avatar} alt="" />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</div>
                                <div className="text-sm text-gray-500">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                              u.role === 'moderator' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <select 
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
              </div>
          )}

          {/* CATEGORIES TAB (Admin) */}
          {activeTab === 'categories' && isAdmin && (
            <div className="max-w-4xl mx-auto space-y-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Categories</h1>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h3 className="font-bold text-lg">Add New Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input 
                    placeholder="Name (e.g. AI Trends)" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="input-field"
                   />
                   <input 
                    placeholder="Icon Name (Lucide)" 
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="input-field"
                   />
                </div>
                <input 
                  placeholder="Description" 
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="input-field"
                />
                <button onClick={handleCreateCategory} className="btn-primary">Create Category</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{cat.name}</h4>
                      <p className="text-sm text-gray-500">{cat.description}</p>
                    </div>
                    <div className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{cat.count} posts</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDITOR TAB */}
          {activeTab === 'editor' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
              
              {/* Editor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                   <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    {editorMode === 'ai' ? <Sparkles className="text-primary-500" /> : <PenTool className="text-green-500" />}
                    {editorMode === 'ai' ? 'AI Assistant' : 'Post Editor'}
                  </h1>
                </div>
                
                <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg self-start sm:self-auto">
                  <button
                    onClick={() => {setEditorMode('manual'); setStep(3)}} // Go straight to manual editing stage
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      editorMode === 'manual' 
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-300'
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => {setEditorMode('ai'); setStep(1)}} // Reset AI flow to step 1
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      editorMode === 'ai' 
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-300'
                    }`}
                  >
                    AI Write
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-8">
                
                {/* === AI FLOW === */}
                {editorMode === 'ai' && (
                  <>
                    {/* Step 1: Topic */}
                    <div className={`space-y-4 ${step !== 1 ? 'hidden' : ''}`}>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What should we write about?</h2>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-200">
                        Enter a topic or prompt:
                      </label>
                      <div className="flex flex-col md:flex-row gap-3">
                        <input 
                          type="text" 
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g., The future of JavaScript frameworks..."
                          className="input-field flex-1"
                        />
                        <button 
                          onClick={handleGenerateOutline}
                          disabled={isGenerating || !topic}
                          className="btn-primary flex items-center justify-center min-w-[150px]"
                        >
                            {isGenerating ? <Loader2 size={20} className="animate-spin mr-2" /> : <Wand2 size={20} className="mr-2" />}
                            {isGenerating ? 'Generating...' : 'Generate Outline'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Step 2: Outline */}
                    <div className={`space-y-6 ${step !== 2 ? 'hidden' : ''}`}>
                        <button onClick={() => setStep(1)} className="text-sm flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-600">
                          <ArrowLeft size={16} className="mr-1" /> Back to Topic
                        </button>
                        
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Outline & Title</h2>
                        
                        <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Post Title"
                            className="input-field text-xl font-bold"
                        />
                        
                        <textarea
                            value={outline}
                            onChange={(e) => setOutline(e.target.value)}
                            placeholder="Edit the generated outline here..."
                            className="input-field min-h-[300px] font-mono text-sm"
                        />
                        
                        <button 
                          onClick={handleGenerateFull}
                          disabled={isGenerating || !outline}
                          className="btn-primary w-full flex items-center justify-center"
                        >
                            {isGenerating ? <Loader2 size={20} className="animate-spin mr-2" /> : <Sparkles size={20} className="mr-2" />}
                            {isGenerating ? 'Generating Full Post...' : 'Generate Full Post from Outline'}
                        </button>
                    </div>

                    {/* Step 3: Final Review (AI) */}
                    <div className={`space-y-6 ${step !== 3 ? 'hidden' : ''}`}>
                      <button onClick={() => setStep(2)} className="text-sm flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-600">
                        <ArrowLeft size={16} className="mr-1" /> Back to Outline
                      </button>
                      
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Final Review</h2>
                      <p className="text-gray-500 dark:text-gray-400">Review and refine the AI-generated content before saving.</p>

                      <input 
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Post Title"
                          className="input-field text-xl font-bold"
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <select 
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="input-field"
                          >
                              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                          <input 
                              type="text"
                              value={tagsInput}
                              onChange={(e) => setTagsInput(e.target.value)}
                              placeholder="Tags (comma-separated, e.g. react, webdev)"
                              className="input-field"
                          />
                      </div>
                      
                      <div className="flex items-center gap-2">
                          <input 
                              type="text"
                              value={coverImage}
                              onChange={(e) => setCoverImage(e.target.value)}
                              placeholder="Cover Image URL (e.g. https://picsum.photos/800/400)"
                              className="input-field flex-1"
                          />
                          <button onClick={setRandomImage} className="btn-secondary flex-shrink-0">
                            <RefreshCw size={16} className="mr-2" /> Random
                          </button>
                      </div>

                      <label htmlFor="content" className="block text-base font-medium text-gray-700 dark:text-gray-200 mt-6">
                          Post Content (Markdown)
                      </label>
                      <textarea
                          id="content"
                          value={fullContent}
                          onChange={(e) => setFullContent(e.target.value)}
                          className="input-field min-h-[300px] font-mono text-sm"
                          placeholder="Your fully generated blog post content in Markdown..."
                      />
                      
                      {/* Content Preview with HTML Enabled */}
                      <div className="border border-gray-200 dark:border-gray-700 p-6 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Live Preview:</h3>
                          <div className="prose dark:prose-invert max-w-none">
                              <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeRaw]} // <-- HTML enabled here!
                              >
                                  {fullContent}
                              </ReactMarkdown>
                          </div>
                      </div>

                      <button 
                          onClick={handleSavePost}
                          disabled={isSaving || !title || !fullContent}
                          className="btn-primary w-full flex items-center justify-center mt-6"
                      >
                          {isSaving ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                          {isSaving ? 'Saving...' : isAdmin ? 'Publish Post' : 'Submit for Review'}
                      </button>
                    </div>
                  </>
                )}

                {/* === MANUAL FLOW === */}
                {editorMode === 'manual' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Post</h2>
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Post Title"
                        className="input-field text-xl font-bold"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="input-field"
                        >
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <input 
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="Tags (comma-separated, e.g. react, webdev)"
                            className="input-field"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input 
                            type="text"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            placeholder="Cover Image URL (e.g. https://picsum.photos/800/400)"
                            className="input-field flex-1"
                        />
                        <button onClick={setRandomImage} className="btn-secondary flex-shrink-0">
                            <RefreshCw size={16} className="mr-2" /> Random
                        </button>
                    </div>
                    
                    <label htmlFor="content-manual" className="block text-base font-medium text-gray-700 dark:text-gray-200 mt-6">
                        Post Content (Markdown & HTML)
                    </label>
                    <textarea
                        id="content-manual"
                        value={fullContent}
                        onChange={(e) => setFullContent(e.target.value)}
                        className="input-field min-h-[300px] font-mono text-sm"
                        placeholder="Start writing your post using Markdown (and optional HTML tags)..."
                    />
                    
                    {/* Content Preview with HTML Enabled */}
                    <div className="border border-gray-200 dark:border-gray-700 p-6 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Live Preview:</h3>
                        <div className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]} // <-- HTML enabled here!
                            >
                                {fullContent}
                            </ReactMarkdown>
                        </div>
                    </div>

                    <button 
                        onClick={handleSavePost}
                        disabled={isSaving || !title || !fullContent}
                        className="btn-primary w-full flex items-center justify-center mt-6"
                    >
                        {isSaving ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                        {isSaving ? 'Saving...' : isAdmin ? 'Publish Post' : 'Submit for Review'}
                    </button>
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