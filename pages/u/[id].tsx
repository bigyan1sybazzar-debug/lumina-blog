import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { User, FriendRequest } from '../../types';
import { db } from '../../services/firebase';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getUserProfile } from '../../services/chatService';
import { User as UserIcon, MessageCircle, UserPlus, Clock, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import DirectChat from '../../components/DirectChat';

const PublicProfile: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;
    const { user: currentUser } = useAuth();

    const [targetUser, setTargetUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self'>('none');
    const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProfile();
        }
    }, [id, currentUser]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const profile = await getUserProfile(id as string);
            if (!profile) {
                setTargetUser(null);
            } else {
                setTargetUser(profile);

                if (currentUser) {
                    if (currentUser.id === id) {
                        setFriendStatus('self');
                    } else {
                        // Check for accepted or pending requests
                        const [sentReq, receivedReq] = await Promise.all([
                            db.collection('friendRequests')
                                .where('fromId', '==', currentUser.id)
                                .where('toId', '==', id)
                                .get(),
                            db.collection('friendRequests')
                                .where('fromId', '==', id)
                                .where('toId', '==', currentUser.id)
                                .get()
                        ]);

                        const accepted = [...sentReq.docs, ...receivedReq.docs].find(doc => doc.data().status === 'accepted');

                        if (accepted) {
                            setFriendStatus('friends');
                        } else if (!receivedReq.empty) {
                            setFriendStatus('pending_received');
                            setPendingRequestId(receivedReq.docs[0].id);
                        } else if (!sentReq.empty) {
                            setFriendStatus('pending_sent');
                            setPendingRequestId(sentReq.docs[0].id);
                        } else {
                            setFriendStatus('none');
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching public profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!pendingRequestId) return;
        try {
            await acceptFriendRequest(pendingRequestId);
            setFriendStatus('friends');
            alert('Friend request accepted!');
        } catch (error) {
            alert('Action failed');
        }
    };

    const handleReject = async () => {
        if (!pendingRequestId) return;
        try {
            await rejectFriendRequest(pendingRequestId);
            setFriendStatus('none');
            alert('Friend request ignored');
        } catch (error) {
            alert('Action failed');
        }
    };

    const handleAddFriend = async () => {
        if (!currentUser || !id) return;
        try {
            await sendFriendRequest(currentUser, id as string);
            setRequestSent(true);
            setFriendStatus('pending_sent');
        } catch (error) {
            alert('Failed to send friend request. Check your permissions.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="animate-spin text-primary-600" size={40} />
                </div>
                <Footer />
            </div>
        );
    }

    if (!targetUser) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <h1 className="text-2xl font-bold dark:text-white">User not found</h1>
                    <Link href="/" className="mt-4 text-primary-600 hover:underline inline-block">Back to home</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-12">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center text-gray-500 hover:text-primary-600 transition-colors"
                >
                    <ChevronLeft size={20} /> Back
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Cover Section */}
                    <div className="h-48 relative">
                        {targetUser.coverImage ? (
                            <img src={targetUser.coverImage} className="w-full h-full object-cover" alt="Cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-primary-600 to-indigo-600"></div>
                        )}
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>

                    <div className="px-8 pb-8">
                        <div className="relative -mt-20 mb-6 flex justify-between items-end">
                            <img
                                src={targetUser.avatar || 'https://ui-avatars.com/api/?name=User'}
                                alt={targetUser.name}
                                className="w-40 h-40 rounded-2xl border-4 border-white dark:border-gray-800 object-cover shadow-xl"
                            />

                            <div className="flex space-x-3 mb-2">
                                {friendStatus === 'none' && (
                                    <button
                                        onClick={handleAddFriend}
                                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all flex items-center"
                                    >
                                        <UserPlus size={18} className="mr-2" /> Add Friend
                                    </button>
                                )}
                                {friendStatus === 'pending_sent' && (
                                    <button
                                        disabled
                                        className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl font-bold flex items-center"
                                    >
                                        <Clock size={18} className="mr-2" /> Request Sent
                                    </button>
                                )}
                                {friendStatus === 'pending_received' && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleAccept()}
                                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all flex items-center"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleReject()}
                                            className="px-6 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-all"
                                        >
                                            Ignore
                                        </button>
                                    </div>
                                )}
                                {friendStatus === 'friends' && (
                                    <button
                                        onClick={() => setShowChat(true)}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center"
                                    >
                                        <MessageCircle size={18} className="mr-2" /> Message
                                    </button>
                                )}
                                {friendStatus === 'self' && (
                                    <Link
                                        href="/Profile"
                                        className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-all"
                                    >
                                        Edit My Profile
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                                    {targetUser.name}
                                    <span className="ml-3 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2.5 py-0.5 rounded-full capitalize">
                                        {targetUser.role}
                                    </span>
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                                    {targetUser.bio || "This user hasn't added a bio yet."}
                                </p>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-1">Friends</p>
                                    <p className="text-xl font-bold dark:text-white">Social Profile</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-1">Member Since</p>
                                    <p className="text-xl font-bold dark:text-white">Dec 2025</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {showChat && currentUser && (
                <DirectChat
                    currentUser={currentUser}
                    friend={targetUser}
                    onClose={() => setShowChat(false)}
                />
            )}

            <Footer />
        </div>
    );
};

export default PublicProfile;
