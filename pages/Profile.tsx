import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { User, FriendRequest, BlogPostReview, BlogPostComment, BlogPost } from '../types';
import { db } from '../services/firebase';
import firebase from 'firebase/compat/app';
import { sendFriendRequest, acceptFriendRequest, getUserProfile, updateUserProfile, rejectFriendRequest } from '../services/chatService';
import { getReviewsByUserId, getCommentsByUserId, getUserPosts, deletePost } from '../services/db';
import { User as UserIcon, Settings, Users, MessageSquare, Search, Check, X, UserPlus, Loader2, MessageCircle, Star as StarIcon, Camera, Image as ImageIcon, Star, MessageCircle as DiscussionIcon, FileText, Plus, Edit2, Trash2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import DirectChat from '../components/DirectChat';

const Profile: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'requests' | 'discover' | 'reviews' | 'posts'>('profile');
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
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setBio(user.bio || '');
            setAvatar(user.avatar);
            setCoverImage(user.coverImage || '');

            // Listen for friend requests
            const unsub = db.collection('friendRequests')
                .where('toId', '==', user.id)
                .where('status', '==', 'pending')
                .onSnapshot(snapshot => {
                    setIncomingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest)));
                }, error => {
                    console.error("Firestore Snapshot Error (friendRequests):", error);
                });
            return () => unsub();
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            if (activeTab === 'friends' || activeTab === 'profile') fetchFriends();
            if (activeTab === 'reviews') fetchUserActivity();
            if (activeTab === 'posts') fetchUserPosts();
        }
    }, [user, activeTab]);

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
        } catch (error) {
            console.error("Error fetching user posts:", error);
        } finally {
            setIsLoadingPosts(false);
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

    if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
    if (!user) return <div className="p-20 text-center">Please login to view profile.</div>;

    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen transition-colors duration-200">
            <Header />
            <main className="max-w-5xl mx-auto px-4 py-8 md:py-16 relative">
                {/* Modern Background Decorations */}
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary-500/10 blur-[120px] rounded-full -z-10"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -z-10"></div>

                <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/20 dark:border-gray-800/50 overflow-hidden">
                    {/* Cover Section */}
                    <div className="relative h-64 md:h-80 group">
                        {coverImage ? (
                            <img src={coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cover" />
                        ) : (
                            <div className="h-full bg-gradient-to-br from-primary-600 via-purple-600 to-indigo-600"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent"></div>

                        {isEditing && (
                            <button
                                className="absolute top-4 right-4 p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all z-10"
                                onClick={() => {
                                    const newCover = prompt('Enter cover image URL', coverImage);
                                    if (newCover) setCoverImage(newCover);
                                }}
                            >
                                <ImageIcon size={20} />
                            </button>
                        )}
                    </div>

                    {/* Header Details */}
                    <div className="px-6 md:px-12 pb-8">
                        <div className="relative -mt-20 md:-mt-24 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="relative group">
                                <div className="p-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-[2rem] shadow-2xl">
                                    <img
                                        src={avatar || 'https://ui-avatars.com/api/?name=User'}
                                        alt={name}
                                        className="w-32 h-32 md:w-40 md:h-40 rounded-[1.8rem] object-cover"
                                    />
                                </div>
                                {isEditing && (
                                    <button
                                        className="absolute bottom-2 right-2 p-3 bg-primary-600 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform"
                                        onClick={() => {
                                            const newAvatar = prompt('Enter image URL', avatar);
                                            if (newAvatar) setAvatar(newAvatar);
                                        }}
                                    >
                                        <Camera size={20} />
                                    </button>
                                )}
                            </div>
                            <div className="flex space-x-3">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold flex items-center"
                                        >
                                            {isSaving && <Loader2 size={16} className="animate-spin mr-2" />}
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!isEditing ? (
                            <div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">{name}</h1>
                                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">{bio || 'No bio yet.'}</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar Image URL</label>
                                        <input
                                            type="text"
                                            value={avatar}
                                            onChange={(e) => setAvatar(e.target.value)}
                                            placeholder="https://example.com/photo.jpg"
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image URL</label>
                                        <input
                                            type="text"
                                            value={coverImage}
                                            onChange={(e) => setCoverImage(e.target.value)}
                                            placeholder="https://example.com/banner.jpg"
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modern Pill Tabs */}
                    <div className="px-6 md:px-12 py-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex overflow-x-auto space-x-2 py-4 scrollbar-hide">
                            {[
                                { id: 'profile', label: 'Overview', icon: UserIcon },
                                { id: 'posts', label: 'My Posts', icon: FileText },
                                { id: 'friends', label: 'Friends', icon: Users },
                                { id: 'requests', label: 'Requests', icon: UserPlus, count: incomingRequests.length },
                                { id: 'discover', label: 'Discover', icon: Search },
                                { id: 'reviews', label: 'Activity', icon: StarIcon },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-primary-600 text-white shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)] scale-105'
                                        : 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    <span>{tab.label}</span>
                                    {tab.count ? (
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'}`}>
                                            {tab.count}
                                        </span>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="px-6 md:px-12 py-8">
                        {activeTab === 'profile' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-semibold mb-6">
                                    <Sparkles className="w-4 h-4" /> Welcome to the Bigyann
                                </div>
                                <div className="md:col-span-2 space-y-6">
                                    <div className="p-8 bg-gradient-to-br from-primary-500/10 to-purple-500/10 dark:from-primary-900/20 dark:to-purple-900/20 rounded-[2.5rem] border border-primary-500/20 relative overflow-hidden group">
                                        <div className="relative z-10 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                                            Welcome back, <br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">{name}!</span>
                                        </div>
                                        <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-sm text-lg md:text-xl font-medium">
                                            Everything looks great today. You have {friends.length} active connections and {userPosts.length} published stories.
                                        </p>
                                        <ImageIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-primary-500/10 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group scale-100 hover:scale-[1.02]">
                                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 text-primary-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Users size={24} />
                                            </div>
                                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Friends</p>
                                            <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">{friends.length}</p>
                                        </div>
                                        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group scale-100 hover:scale-[1.02]">
                                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <MessageSquare size={24} />
                                            </div>
                                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Comments</p>
                                            <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">{userComments.length}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-6 bg-gray-950 text-white rounded-[2rem] shadow-2xl relative overflow-hidden group">
                                        <h3 className="font-bold tracking-tight flex items-center gap-2 mb-4">
                                            <Star size={18} className="text-yellow-400" />
                                            Recent Reviews
                                        </h3>
                                        {userReviews.slice(0, 2).map(r => (
                                            <div key={r.id} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-0 border-white/10">
                                                <div className="flex gap-1 mb-1">
                                                    {[1, 2, 3, 4, 5].slice(0, r.rating).map(s => <Star key={s} size={10} className="fill-yellow-400 text-yellow-400" />)}
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-2">"{r.content}"</p>
                                            </div>
                                        ))}
                                        {userReviews.length === 0 && <p className="text-xs text-gray-500 italic">No reviews yet...</p>}
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Star size={64} className="animate-pulse" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('posts')}
                                        className="w-full p-6 bg-primary-600 text-white rounded-[2rem] font-bold shadow-lg hover:shadow-primary-500/40 hover:-translate-y-1 transition-all flex items-center justify-between group"
                                    >
                                        <span>Create Post</span>
                                        <Plus className="group-hover:rotate-90 transition-transform duration-500" />
                                    </button>
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
                                        href="/admin?tab=editor"
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
                                                                href={`/admin?edit=${post.id}`}
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
                                                href="/admin?tab=editor"
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
