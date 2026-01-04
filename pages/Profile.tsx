import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { User, FriendRequest, BlogPostReview, BlogPostComment, BlogPost } from '../types';
import { db } from '../services/firebase';
import firebase from 'firebase/compat/app';
import { sendFriendRequest, acceptFriendRequest, getUserProfile, updateUserProfile, rejectFriendRequest } from '../services/chatService';
import { getReviewsByUserId, getCommentsByUserId, getUserPosts, deletePost } from '../services/db';
import { User as UserIcon, Settings, Users, MessageSquare, Search, Check, X, UserPlus, Loader2, MessageCircle, Star as StarIcon, Camera, Image as ImageIcon, Star, MessageCircle as DiscussionIcon, FileText, Plus, Edit2, Trash2, Sparkles, LayoutDashboard, BarChart2, Heart, TrendingUp, Zap, Radio, Activity, Eye, Bell, Wifi, Cpu, Tag, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import DirectChat from '../components/DirectChat';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { UserManagement } from '../components/admin/UserManagement';
import { ContentApprovals } from '../components/admin/ContentApprovals';
import { AutomationPanel } from '../components/admin/AutomationPanel';
import { FeaturedManager } from '../components/admin/FeaturedManager';
import { CategoriesManager } from '../components/admin/CategoriesManager';
import {
    getPosts, getPendingPosts, getAllUsers, updateUserRole, updatePostStatus,
    getCategories, createCategory, deleteCategory, createPost, getPolls,
    updatePollStatus, getLatestPosts
} from '../services/db';
import { generateNewsPost, generateBlogImage } from '../services/geminiService';
import { getMyListings, updateListingStatus, deleteListing } from '../services/marketplaceService';
import { MarketplaceManager } from '../components/admin/MarketplaceManager';
import { ListingCard } from '../components/marketplace/ListingCard';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Category, Poll } from '../types'; // Ensure Poll is imported


const Profile: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'chat' | 'requests' | 'discover' | 'reviews' | 'posts' | 'listings' | 'dashboard' | 'users' | 'approvals' | 'automation' | 'featured' | 'categories' | 'marketplace'>('profile');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<User[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);
    const [userReviews, setUserReviews] = useState<BlogPostReview[]>([]);
    const [userComments, setUserComments] = useState<BlogPostComment[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [userPosts, setUserPosts] = useState<BlogPost[]>([]);
    const [userListings, setUserListings] = useState<any[]>([]); // Using any for now to avoid strict typing issues during fetch
    const [latestPosts, setLatestPosts] = useState<BlogPost[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [isLoadingListings, setIsLoadingListings] = useState(false);
    const [userStats, setUserStats] = useState({ totalViews: 0, totalLikes: 0, totalPosts: 0, popularPost: null as BlogPost | null });
    const [latestMessages, setLatestMessages] = useState<any[]>([]);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Sci-fi notification sound
    }, []);

    // Admin/Mod State
    const [adminStats, setAdminStats] = useState({ posts: 0, views: 0, users: 0, comments: 0, engagement: 0 });
    const [usersList, setUsersList] = useState<User[]>([]);
    const [pendingPosts, setPendingPosts] = useState<BlogPost[]>([]);
    const [pendingPolls, setPendingPolls] = useState<Poll[]>([]);
    const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
    const [availablePosts, setAvailablePosts] = useState<BlogPost[]>([]);
    const [isSavingFeatured, setIsSavingFeatured] = useState(false);

    // Automation State
    const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);
    const [autoLogs, setAutoLogs] = useState<{ id: string; timestamp: string; message: string; type: 'info' | 'success' | 'error' | 'warning'; }[]>([]);



    useEffect(() => {
        if (user) {
            setName(user.name);
            setBio(user.bio || '');
            setAvatar(user.avatar);
            setCoverImage(user.coverImage || '');
        }
    }, [user]);

    // Realtime Listeners
    // Realtime Listeners
    // Ref to track if it's the initial load to prevent sound spam
    const isInitialLoad = React.useRef(true);
    // Ref to track known message IDs to prevent duplicate alerts
    const knownMessageIds = React.useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!user) return;

        // 1. Friend Requests Listener
        const unsubRequests = db.collection('friendRequests')
            .where('toId', '==', user.id)
            .where('status', '==', 'pending')
            .onSnapshot(snapshot => {
                const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));

                // Check if this is a real update (not initial)
                if (!isInitialLoad.current && snapshot.docChanges().some(change => change.type === 'added')) {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(e => console.error("Audio playback failed:", e));
                }
                setIncomingRequests(requests);
            });

        // 2. Global Latest Posts Listener (Live Feed)
        const unsubPosts = db.collection('posts')
            .where('status', '==', 'published')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .onSnapshot(snapshot => {
                const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
                setLatestPosts(posts);
            });

        // 3. Unread Messages Listener
        const unsubMessages = db.collection('direct_messages')
            .where('participants', 'array-contains', user.id)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .onSnapshot(snapshot => {
                const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Robust Sound Trigger
                if (!isInitialLoad.current) {
                    const newChanges = snapshot.docChanges().filter(c => c.type === 'added');
                    if (newChanges.length > 0) {
                        // Check if any new message is NOT from me AND not previously known
                        const hasIncoming = newChanges.some(change => {
                            const data = change.doc.data();
                            const isIncoming = data.senderId !== user.id;
                            const isNew = !knownMessageIds.current.has(change.doc.id);
                            return isIncoming && isNew;
                        });

                        if (hasIncoming) {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                            audio.play().catch(e => console.error("Audio playback failed:", e));
                        }
                    }
                }

                // Update known IDs
                snapshot.docs.forEach(doc => knownMessageIds.current.add(doc.id));
                setLatestMessages(msgs);
            });

        // Allow sound after 2 seconds (assuming initial load settles)
        setTimeout(() => { isInitialLoad.current = false; }, 2000);

        return () => {
            unsubRequests();
            unsubPosts();
            unsubMessages();
        };
    }, [user]);

    useEffect(() => {
        if (user) {
            if (activeTab === 'friends' || activeTab === 'profile' || activeTab === 'chat') fetchFriends();
            if (activeTab === 'reviews') fetchUserActivity();
            if (activeTab === 'posts' || activeTab === 'profile') fetchUserPosts();
            if (activeTab === 'listings') fetchUserListings();
            if (['dashboard', 'users', 'approvals', 'automation', 'featured', 'categories', 'marketplace'].includes(activeTab)) {
                fetchAdminData();
            }
        }
    }, [user, activeTab]);

    const isAdmin = user?.role === 'admin';
    const isModerator = user?.role === 'moderator' || isAdmin;

    const fetchAdminData = async () => {
        if (!isModerator) return;
        try {
            const [posts, pending, users, cats, polls] = await Promise.all([
                getPosts(),
                getPendingPosts(),
                getAllUsers(),
                getCategories(),
                getPolls() // Ensure getPolls is imported/available
            ]);

            setAllPosts(posts);
            setPendingPosts(pending);
            setUsersList(users);
            setCategories(cats);

            // Filter pending polls if getPolls returns all
            const pPolls = polls.filter((p: any) => p.status === 'pending');
            setPendingPolls(pPolls);

            if (isAdmin) {
                const totalViews = posts.reduce((acc, curr) => acc + (curr.views || 0), 0);
                setAdminStats({
                    posts: posts.length,
                    views: totalViews,
                    users: users.length,
                    comments: 0,
                    engagement: Math.round((totalViews / Math.max(posts.length, 1)) * 100) / 100
                });

                // Chart Data
                const categoryStats = posts.reduce((acc: any, post) => {
                    const cat = post.category || 'Uncategorized';
                    if (!acc[cat]) acc[cat] = { name: cat, views: 0, posts: 0 };
                    acc[cat].views += (post.views || 0);
                    acc[cat].posts += 1;
                    return acc;
                }, {});
                setChartData(Object.values(categoryStats));
            }

            // Featured posts logic would act similarly to AdminDashboard
            if (activeTab === 'featured') {
                const configDoc = await getDoc(doc(db, 'config', 'featured'));
                if (configDoc.exists()) {
                    const ids: string[] = configDoc.data().postIds || [];
                    const ordered: BlogPost[] = [];
                    ids.forEach(id => {
                        const post = posts.find(p => p.id === id);
                        if (post) ordered.push(post);
                    });
                    setFeaturedPosts(ordered);
                    setAvailablePosts(posts.filter(p => !ids.includes(p.id)));
                } else {
                    setFeaturedPosts([]);
                    setAvailablePosts(posts);
                }
            }

        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
    };

    // --- Admin Action Handlers ---

    const handleApprovePost = async (postId: string) => {
        await updatePostStatus(postId, 'published');
        fetchAdminData();
    };

    const handleRejectPost = async (postId: string) => {
        await updatePostStatus(postId, 'draft');
        fetchAdminData();
    };

    const handleApprovePoll = async (pollId: string) => {
        await updatePollStatus(pollId, 'approved');
        fetchAdminData();
    };

    const handleRejectPoll = async (pollId: string) => {
        await updatePollStatus(pollId, 'rejected'); // Or rejected
        fetchAdminData();
    };

    const handleChangeRole = async (userId: string, newRole: string) => {
        await updateUserRole(userId, newRole as any);
        fetchAdminData();
    };

    const handleApproveUser = async (userId: string) => {
        // Assuming there's a status field on users, if not this might need adjustment
        // For now, implementing placeholders or if you have a service for it
        console.log("Approve user", userId);
    };

    const handleRejectUser = async (userId: string) => {
        console.log("Reject user", userId);
    };

    // Featured Handlers
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

    // Category Handlers
    const handleCreateCategory = async (name: string, description: string, icon: string) => {
        await createCategory({ name, description, icon });
        fetchAdminData();
    };

    const handleDeleteCategory = async (id: string) => {
        if (confirm("Are you sure?")) {
            await deleteCategory(id);
            fetchAdminData();
        }
    };

    // Automation Handlers (Simplified)
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
            addLog('No categories found.', 'error');
            return;
        }
        addLog('Starting automation...', 'info');
        try {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            addLog(`Selected: ${randomCategory.name}`, 'info');
            const { title: aiTitle, content: aiContent } = await generateNewsPost(randomCategory.name);
            addLog(`Generated: "${aiTitle}"`, 'success');
            const aiImage = await generateBlogImage(aiTitle);

            await createPost({
                title: aiTitle,
                content: aiContent,
                excerpt: aiContent.substring(0, 150) + '...',
                author: { name: 'BIGGS', avatar: '/images/biggs-avatar.png', id: 'ai-bot' },
                readTime: '5 min read',
                category: randomCategory.name,
                tags: [randomCategory.name, 'AI'],
                coverImage: aiImage,
                date: new Date().toLocaleDateString(),
                status: 'published'
            });
            addLog('Published!', 'success');
            fetchAdminData();
        } catch (e: any) {
            addLog(`Failed: ${e.message}`, 'error');
        }
    };


    const fetchUserActivity = async () => {
        if (!user) return;
        setIsLoadingReviews(true);
        try {
            const [reviews, comments] = await Promise.all([
                getReviewsByUserId(user.id),
                getCommentsByUserId(user.id)
            ]);
            setUserReviews(reviews);
            setUserComments(comments);
        } catch (error) {
            console.error("Error fetching user activity:", error);
        } finally {
            setIsLoadingReviews(false);
        }
    };

    const fetchUserPosts = async () => {
        if (!user) return;
        setIsLoadingPosts(true);
        try {
            const posts = await getUserPosts(user.id);
            setUserPosts(posts);

            // Calculate Stats
            const views = posts.reduce((acc, curr) => acc + (curr.views || 0), 0);
            const likes = posts.reduce((acc, curr) => acc + (curr.likes?.length || 0), 0);
            const popular = posts.length > 0 ? posts.reduce((prev, current) => (prev.views > current.views) ? prev : current) : null;

            setUserStats({
                totalViews: views,
                totalLikes: likes,
                totalPosts: posts.length,
                popularPost: popular
            });

            // Fetch global latest posts for Hub
            const globalPosts = await getLatestPosts(5);
            setLatestPosts(globalPosts);

        } catch (error) {
            console.error("Error fetching user posts:", error);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    const fetchUserListings = async () => {
        if (!user) return;
        setIsLoadingListings(true);
        try {
            const listings = await getMyListings(user.id);
            setUserListings(listings);
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setIsLoadingListings(false);
        }
    };

    const handleListingAction = async (id: string, action: 'delete' | 'sold') => {
        if (!confirm(`Are you sure you want to ${action === 'delete' ? 'delete' : 'mark as sold'} this listing?`)) return;
        try {
            if (action === 'delete') {
                await deleteListing(id);
                setUserListings(prev => prev.filter(l => l.id !== id));
            } else {
                await updateListingStatus(id, 'sold');
                setUserListings(prev => prev.map(l => l.id === id ? { ...l, status: 'sold' } : l));
            }
        } catch (error) {
            alert('Action failed');
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await deletePost(postId);
                setUserPosts(userPosts.filter(p => p.id !== postId));
            } catch (error) {
                console.error("Error deleting post:", error);
            }
        }
    };

    const fetchFriends = async () => {
        if (!user) return;
        setIsLoadingFriends(true);
        try {
            const [sent, received] = await Promise.all([
                db.collection('friendRequests')
                    .where('fromId', '==', user.id)
                    .where('status', '==', 'accepted')
                    .get(),
                db.collection('friendRequests')
                    .where('toId', '==', user.id)
                    .where('status', '==', 'accepted')
                    .get()
            ]);

            const friendIds = [
                ...sent.docs.map(doc => doc.data().toId),
                ...received.docs.map(doc => doc.data().fromId)
            ];

            if (friendIds.length === 0) {
                setFriends([]);
                return;
            }

            const friendList: User[] = [];
            const chunks = [];
            for (let i = 0; i < friendIds.length; i += 10) {
                chunks.push(friendIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
                const snapshot = await db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get();
                snapshot.forEach(doc => friendList.push({ id: doc.id, ...doc.data() } as User));
            }
            setFriends(friendList);
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setIsLoadingFriends(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await updateUserProfile(user.id, { name, bio, avatar, coverImage });
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSearchUsers = async () => {
        if (!searchQuery.trim()) return;
        const snapshot = await db.collection('users')
            .where('name', '>=', searchQuery)
            .where('name', '<=', searchQuery + '\uf8ff')
            .limit(10)
            .get();

        const results = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as User))
            .filter(u => u.id !== user?.id);
        setSearchResults(results);
    };

    const handleSendRequest = async (receiverId: string) => {
        if (!user) return;
        try {
            await sendFriendRequest(user, receiverId);
            alert('Friend request sent!');
        } catch (error) {
            alert('Friend request failed');
        }
    };

    const handleAcceptRequest = async (req: FriendRequest) => {
        try {
            await acceptFriendRequest(req.id);
            alert('Friend request accepted!');
            setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
            fetchFriends();
        } catch (error) {
            alert('Action failed');
        }
    };

    const handleRejectRequest = async (req: FriendRequest) => {
        try {
            await rejectFriendRequest(req.id);
            alert('Friend request rejected!');
            setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
        } catch (error) {
            alert('Action failed');
        }
    };

    const navItems = React.useMemo(() => [
        { id: 'profile', label: 'Overview', icon: UserIcon },
        { id: 'posts', label: 'My Posts', icon: FileText },
        { id: 'listings', label: 'My Listings', icon: Tag },
        { id: 'friends', label: 'Friends', icon: Users },
        { id: 'chat', label: 'Chat', icon: MessageCircle },
        { id: 'requests', label: 'Requests', icon: UserPlus, count: incomingRequests.length },
        { id: 'discover', label: 'Discover', icon: Search },
        { id: 'reviews', label: 'Activity', icon: StarIcon },
        ...(isAdmin ? [
            { id: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
            { id: 'automation', label: 'Auto-Pilot', icon: Sparkles },
            { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
            { id: 'featured', label: 'Featured', icon: Star },
            { id: 'categories', label: 'Categories', icon: Settings },
        ] : []),
        ...(isModerator ? [
            { id: 'approvals', label: 'Approvals', icon: Check, count: pendingPosts.length + pendingPolls.length },
            { id: 'users', label: 'Users', icon: Users },
        ] : [])
    ], [incomingRequests.length, isAdmin, isModerator, pendingPosts.length, pendingPolls.length]);

    if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
    if (!user) return <div className="p-20 text-center">Please login to view profile.</div>;

    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-200 font-sans selection:bg-primary-500/30">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Background Decorations */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
                </div>

                {/* Cover Image Banner */}
                <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden shadow-lg mb-8 group">
                    {coverImage ? (
                        <img src={coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cover" />
                    ) : (
                        <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    {isEditing && (
                        <button
                            className="absolute bottom-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all z-10"
                            onClick={() => {
                                const newCover = prompt('Enter cover image URL', coverImage);
                                if (newCover) setCoverImage(newCover);
                            }}
                        >
                            <ImageIcon size={18} />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT SIDEBAR (Profile info + Nav) */}
                    <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
                        {/* Profile Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 relative z-20 -mt-20 lg:mt-0">
                            <div className="relative mx-auto w-32 h-32 md:w-32 md:h-32 mb-4 -mt-20 lg:mt-0 rounded-2xl p-1 bg-white dark:bg-gray-900 shadow-lg">
                                <img
                                    src={avatar || 'https://ui-avatars.com/api/?name=User'}
                                    alt={name}
                                    className="w-full h-full rounded-xl object-cover border-2 border-gray-100 dark:border-gray-800"
                                />
                                {isEditing && (
                                    <button
                                        className="absolute bottom-[-10px] right-[-10px] p-2 bg-primary-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                                        onClick={() => {
                                            const newAvatar = prompt('Enter image URL', avatar);
                                            if (newAvatar) setAvatar(newAvatar);
                                        }}
                                    >
                                        <Camera size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="text-center mb-6">
                                {!isEditing ? (
                                    <>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{name}</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{bio || 'No bio yet.'}</p>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            placeholder="Display Name"
                                        />
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            placeholder="Bio"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={isSaving}
                                            className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold flex items-center justify-center"
                                        >
                                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                            <nav className="space-y-1">
                                {navItems.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeTab === tab.id
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <tab.icon size={18} className={activeTab === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} />
                                            <span>{tab.label}</span>
                                        </div>
                                        {tab.count ? (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id
                                                ? 'bg-primary-600 text-white shadow-sm'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                                                }`}>
                                                {tab.count}
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* RIGHT CONTENT AREA */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* Mobile Navigation (Horizontal Scroll) */}
                        <div className="lg:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide pb-2">
                            <div className="flex space-x-2">
                                {navItems.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${activeTab === tab.id
                                            ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30'
                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        <tab.icon size={16} />
                                        <span>{tab.label}</span>
                                        {tab.count ? (
                                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                                                }`}>
                                                {tab.count}
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Container */}
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 min-h-[500px] border border-white/50 dark:border-gray-800/50 shadow-sm">
                            {activeTab === 'profile' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-500/20">
                                                <Radio className="w-3 h-3 animate-pulse" /> Live Signal
                                            </div>
                                            <h1 className="text-3xl font-bold text-white tracking-tight">Activity Hub</h1>
                                            <p className="text-gray-500">Realtime network monitoring and communications.</p>
                                        </div>
                                        <div className="text-right hidden md:block">
                                            <div className="text-xs text-gray-500 font-mono uppercase">System Status</div>
                                            <div className="text-green-500 font-bold tracking-widest text-lg drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">OPERATIONAL</div>
                                        </div>
                                    </div>

                                    {/* --- REALTIME ACTIVITY HUB --- */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* 1. LIVE SIGNALS (Network & Requests) */}
                                        <div className="space-y-6">
                                            {/* Incoming Requests Panel */}
                                            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <div>
                                                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><UserPlus size={14} /> Connection Requests</h3>
                                                    </div>
                                                    <span className="bg-gray-800 text-gray-400 text-[10px] font-mono px-2 py-0.5 rounded">NET-REQ-01</span>
                                                </div>

                                                <div className="space-y-3 relative z-10">
                                                    {incomingRequests.length > 0 ? (
                                                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between group/req">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover/req:text-white transition-colors">
                                                                    <UserPlus size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-white font-bold text-sm">{incomingRequests.length} Pending Invites</p>
                                                                    <p className="text-blue-400 text-xs">Authorization required</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => setActiveTab('requests')} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                                                                Review
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 bg-gray-800/30 border border-gray-800 rounded-2xl flex items-center gap-3 border-dashed">
                                                            <Check size={16} className="text-gray-600" />
                                                            <p className="text-gray-500 text-sm font-medium">All incoming requests processed.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* COMMS STREAM (Messages) */}
                                            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 relative min-h-[300px] flex flex-col">
                                                <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4">
                                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                        <MessageSquare size={14} /> Comms Stream
                                                    </h3>
                                                    {latestMessages.length > 0 && <span className="text-[10px] text-green-500 font-mono animate-pulse">● LIVE DATA</span>}
                                                </div>

                                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-800">
                                                    {latestMessages.length > 0 ? latestMessages.map((msg, i) => (
                                                        <div
                                                            key={msg.id || i}
                                                            onClick={() => setActiveTab('chat')}
                                                            className="group p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-gray-700"
                                                        >
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className={`text-[10px] font-bold tracking-wider ${msg.senderId === user?.id ? 'text-gray-500' : 'text-cyan-400'}`}>
                                                                    {msg.senderId === user?.id ? 'You' : (friends.find(f => f.id === msg.senderId)?.name || 'User')}
                                                                </span>
                                                                <span className="text-[10px] text-gray-600 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                            </div>
                                                            <p className="text-gray-300 text-sm font-medium line-clamp-2 pl-2 border-l-2 border-gray-800 group-hover:border-cyan-500/50 transition-colors">
                                                                {msg.content}
                                                            </p>
                                                        </div>
                                                    )) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-gray-700 opacity-50">
                                                            <Wifi size={32} className="mb-2" />
                                                            <p className="text-xs font-mono">WAITING FOR SIGNAL...</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-gray-800">
                                                    <button onClick={() => setActiveTab('chat')} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                                                        Open Comm Channel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. GLOBAL FEED (Right Column) */}
                                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 h-full flex flex-col">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <Activity size={14} /> Global Feed
                                                </h3>
                                                <Zap size={14} className="text-yellow-500" />
                                            </div>

                                            <div className="space-y-0 relative">
                                                {/* Timeline Line */}
                                                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-800"></div>

                                                {latestPosts.map((post, i) => (
                                                    <div key={post.id || i} className="relative pl-8 py-3 group">
                                                        <div className={`absolute left-[7px] top-5 w-2.5 h-2.5 rounded-full border-2 border-gray-900 z-10 ${i === 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-600 group-hover:bg-gray-400'}`}></div>

                                                        <div className="bg-gray-800/40 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 p-4 rounded-2xl transition-all">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full">{post.category || 'System'}</span>
                                                                <span className="text-[10px] text-gray-500 font-mono">{new Date(post.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <Link href={`/blog/${post.slug || post.id}`} className="block">
                                                                <h4 className="text-white font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{post.title}</h4>
                                                                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{post.excerpt}</p>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                                {latestPosts.length === 0 && <div className="text-center py-10 text-gray-600 font-mono text-xs">Synchronizing global feed...</div>}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {activeTab === 'posts' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div>
                                            <h2 className="text-xl font-bold tracking-tight dark:text-white">Your Blog Posts</h2>
                                            <p className="text-gray-500 text-sm">Manage your published and pending content</p>
                                        </div>
                                        <Link
                                            href="/write"
                                            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm"
                                        >
                                            <Plus size={18} />
                                            <span>Create New Post</span>
                                        </Link>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {isLoadingPosts ? (
                                            <div className="col-span-full flex justify-center py-10"><Loader2 className="animate-spin text-primary-600" /></div>
                                        ) : userPosts.length > 0 ? (
                                            userPosts.map(post => (
                                                <div key={post.id} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all">
                                                    <div className="aspect-video relative overflow-hidden">
                                                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        <div className="absolute top-2 right-2">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${post.status === 'published' ? 'bg-green-500 text-white' :
                                                                post.status === 'pending' ? 'bg-yellow-500 text-white' :
                                                                    'bg-gray-500 text-white'
                                                                }`}>
                                                                {post.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="font-bold tracking-tight text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">{post.title}</h3>
                                                        <div className="flex items-center justify-between mt-4">
                                                            <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                            <div className="flex space-x-2">
                                                                <Link
                                                                    href={`/write?edit=${post.id}`}
                                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleDeletePost(post.id)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                                <Link
                                                                    href={`/${post.slug || post.id}`}
                                                                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors text-xs font-bold"
                                                                >
                                                                    View
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                                <FileText className="mx-auto mb-4 text-gray-200" size={48} />
                                                <h3 className="text-lg font-bold text-gray-400">No posts yet</h3>
                                                <p className="text-gray-500 text-sm mb-6">Start sharing your thoughts with the community!</p>
                                                <Link
                                                    href="/write"
                                                    className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-bold"
                                                >
                                                    <Plus size={20} />
                                                    <span>Write Your First Post</span>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'discover' && (
                                <div className="space-y-6">
                                    <div className="flex space-x-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search people to add..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none dark:text-white"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSearchUsers}
                                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                                        >
                                            Search
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {searchResults.map(result => (
                                            <div key={result.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Link href={`/u/${result.id}`} className="flex items-center space-x-3 group">
                                                        <img src={result.avatar} className="w-12 h-12 rounded-lg object-cover group-hover:opacity-80 transition-opacity" />
                                                        <div>
                                                            <p className="font-bold dark:text-white group-hover:text-primary-600 transition-colors">{result.name}</p>
                                                            <p className="text-xs text-gray-500">{result.role}</p>
                                                        </div>
                                                    </Link>
                                                </div>
                                                <button
                                                    onClick={() => handleSendRequest(result.id)}
                                                    className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                                                >
                                                    <UserPlus size={20} />
                                                </button>
                                            </div>
                                        ))}
                                        {searchResults.length === 0 && searchQuery && <p className="text-gray-500">No users found.</p>}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'requests' && (
                                <div className="space-y-4">
                                    {incomingRequests.map(req => (
                                        <div key={req.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Link href={`/u/${req.fromId}`} className="flex items-center space-x-3 group">
                                                    <img src={req.senderAvatar} className="w-12 h-12 rounded-lg object-cover group-hover:opacity-80 transition-opacity" />
                                                    <div>
                                                        <p className="font-bold dark:text-white group-hover:text-primary-600 transition-colors">{req.senderName} <span className="text-xs font-normal text-gray-500">sent you a request</span></p>
                                                        <p className="text-xs text-gray-400">{new Date(req.timestamp).toLocaleDateString()}</p>
                                                    </div>
                                                </Link>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleAcceptRequest(req)}
                                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                                                >
                                                    <Check size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(req)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {incomingRequests.length === 0 && <p className="text-gray-500 text-center py-4">No pending requests.</p>}
                                </div>
                            )}

                            {activeTab === 'friends' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {isLoadingFriends ? (
                                        <div className="col-span-2 flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                                    ) : friends.length > 0 ? (
                                        friends.map(friend => (
                                            <div key={friend.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-between hover:shadow-sm transition-shadow">
                                                <div className="flex items-center space-x-3">
                                                    <Link href={`/u/${friend.id}`} className="flex items-center space-x-3 group">
                                                        <img src={friend.avatar} className="w-12 h-12 rounded-lg object-cover group-hover:opacity-80 transition-opacity" />
                                                        <div>
                                                            <p className="font-bold dark:text-white group-hover:text-primary-600 transition-colors">{friend.name}</p>
                                                            <p className="text-xs text-gray-500">{friend.role}</p>
                                                        </div>
                                                    </Link>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedFriend(friend)}
                                                    className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                                                    title="Chat"
                                                >
                                                    <MessageCircle size={20} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 text-center py-10 text-gray-500">
                                            <Users className="mx-auto mb-2 opacity-20" size={40} />
                                            You haven't added any friends yet.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'chat' && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                                        <MessageCircle className="mr-2 text-primary-600" size={24} />
                                        Your Conversations
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {isLoadingFriends ? (
                                            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                                        ) : friends.length > 0 ? (
                                            friends.map(friend => (
                                                <button
                                                    key={friend.id}
                                                    onClick={() => setSelectedFriend(friend)}
                                                    className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900 transition-all group text-left"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className="relative">
                                                            <img src={friend.avatar} className="w-14 h-14 rounded-2xl object-cover group-hover:scale-105 transition-transform" alt={friend.name} />
                                                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors text-lg">{friend.name}</h4>
                                                            <p className="text-gray-500 text-sm line-clamp-1">Click to start chatting...</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-10 w-10 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                        <MessageCircle size={20} />
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                                <MessageCircle className="mx-auto mb-4 text-gray-300" size={48} />
                                                <h3 className="text-lg font-bold text-gray-400">No conversations yet</h3>
                                                <p className="text-gray-500 text-sm mt-2">Add friends to start chatting!</p>
                                                <button onClick={() => setActiveTab('discover')} className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors">
                                                    Find Friends
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-8">
                                    {isLoadingReviews ? (
                                        <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                                    ) : (
                                        <>
                                            {/* Reviews Section */}
                                            <div>
                                                <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center text-gray-900 dark:text-white">
                                                    <StarIcon className="mr-2 text-yellow-400 fill-yellow-400" size={24} /> My Reviews
                                                </h3>
                                                <div className="space-y-4">
                                                    {userReviews.length > 0 ? userReviews.map(review => (
                                                        <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex space-x-1">
                                                                    {[1, 2, 3, 4, 5].map(s => (
                                                                        <StarIcon key={s} size={14} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                                                    ))}
                                                                </div>
                                                                <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{review.content}</p>
                                                            <Link href={`/${review.postId}`} className="text-xs text-primary-600 font-medium hover:underline">
                                                                View Post
                                                            </Link>
                                                        </div>
                                                    )) : <p className="text-gray-500 text-sm italic">You haven't posted any reviews yet.</p>}
                                                </div>
                                            </div>

                                            {/* Discussions Section */}
                                            <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                                                <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center text-gray-900 dark:text-white">
                                                    <DiscussionIcon className="mr-2 text-primary-600" size={24} /> My Discussions
                                                </h3>
                                                <div className="space-y-4">
                                                    {userComments.length > 0 ? userComments.map(comment => (
                                                        <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-xs font-bold text-primary-600">Comment</span>
                                                                <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{comment.content}</p>
                                                            <Link href={`/${comment.postId}`} className="text-xs text-primary-600 font-medium hover:underline">
                                                                View Conversation
                                                            </Link>
                                                        </div>
                                                    )) : <p className="text-gray-500 text-sm italic">No discussions found.</p>}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Admin Tabs Rendering */}
                            {activeTab === 'dashboard' && isAdmin && (
                                <AnalyticsDashboard
                                    stats={adminStats}
                                    pendingPostsCount={pendingPosts.length}
                                    chartData={chartData}
                                    isAdmin={true}
                                />
                            )}

                            {activeTab === 'users' && isModerator && (
                                <UserManagement
                                    users={usersList}
                                    onChangeRole={handleChangeRole}
                                    onApproveUser={handleApproveUser}
                                    onRejectUser={handleRejectUser}
                                />
                            )}

                            {activeTab === 'approvals' && isModerator && (
                                <ContentApprovals
                                    pendingPosts={pendingPosts}
                                    pendingPolls={pendingPolls}
                                    onApprovePost={handleApprovePost}
                                    onRejectPost={handleRejectPost}
                                    onApprovePoll={handleApprovePoll}
                                    onRejectPoll={handleRejectPoll}
                                />
                            )}

                            {activeTab === 'automation' && isAdmin && (
                                <AutomationPanel
                                    isAutoPilotOn={isAutoPilotOn}
                                    toggleAutoPilot={() => setIsAutoPilotOn(!isAutoPilotOn)}
                                    runAutomationCycle={runAutomationCycle}
                                    autoLogs={autoLogs}
                                    setAutoLogs={setAutoLogs}
                                    categories={categories}
                                />
                            )}

                            {activeTab === 'featured' && isAdmin && (
                                <FeaturedManager
                                    featuredPosts={featuredPosts}
                                    availablePosts={availablePosts}
                                    isSavingFeatured={isSavingFeatured}
                                    onSave={saveFeaturedOrder}
                                    setFeaturedPosts={setFeaturedPosts}
                                    setAvailablePosts={setAvailablePosts}
                                />
                            )}

                            {activeTab === 'categories' && isAdmin && (
                                <CategoriesManager
                                    categories={categories}
                                    onCreateCategory={handleCreateCategory}
                                    onDeleteCategory={handleDeleteCategory}
                                />
                            )}

                            {activeTab === 'marketplace' && isAdmin && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <MarketplaceManager />
                                </div>
                            )}

                            {activeTab === 'listings' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Listings</h2>
                                        <Link href="/tools/phone-marketplace" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold">
                                            Create New
                                        </Link>
                                    </div>
                                    {isLoadingListings ? (
                                        <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {userListings.map(listing => (
                                                <div key={listing.id} className="relative group">
                                                    <ListingCard listing={listing} />
                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold rounded">
                                                        {listing.status.toUpperCase()}
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                                                        {listing.status !== 'sold' && (
                                                            <button
                                                                onClick={() => handleListingAction(listing.id, 'sold')}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm"
                                                            >
                                                                Mark Sold
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleListingAction(listing.id, 'delete')}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {userListings.length === 0 && (
                                                <div className="col-span-full text-center py-10 text-gray-500">
                                                    You haven't listed any phones yet.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            {/* Direct Chat Overlay */}
            {selectedFriend && user && (
                <DirectChat
                    currentUser={user}
                    friend={selectedFriend}
                    onClose={() => setSelectedFriend(null)}
                />
            )}
            <Footer />
        </div>
    );
};

export default Profile;
