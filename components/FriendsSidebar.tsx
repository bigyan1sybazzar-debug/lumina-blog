'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { User } from '../types';
import { MessageSquare, X, Users, MessageCircle, ChevronRight, Search } from 'lucide-react';
import DirectChat from './DirectChat';
import Link from 'next/link';

const FriendsSidebar: React.FC = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState<User[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user) {
            setFriends([]);
            return;
        }

        // Fetch accepted friends
        const unsub1 = db.collection('friendRequests')
            .where('fromId', '==', user.id)
            .where('status', '==', 'accepted')
            .onSnapshot(async snapshot => {
                const ids = snapshot.docs.map(doc => doc.data().toId);
                fetchDetails(ids, 'sent');
            });

        const unsub2 = db.collection('friendRequests')
            .where('toId', '==', user.id)
            .where('status', '==', 'accepted')
            .onSnapshot(async snapshot => {
                const ids = snapshot.docs.map(doc => doc.data().fromId);
                fetchDetails(ids, 'received');
            });

        const friendDetails: Record<string, User> = {};

        const fetchDetails = async (ids: string[], type: 'sent' | 'received') => {
            if (ids.length === 0) return;
            // Fetch user details for these IDs
            const snapshot = await db.collection('users').where('__name__', 'in', ids.slice(0, 10)).get();
            snapshot.forEach(doc => {
                friendDetails[doc.id] = { id: doc.id, ...doc.data() } as User;
            });
            setFriends(Object.values(friendDetails));
        };

        return () => {
            unsub1();
            unsub2();
        };
    }, [user]);

    if (!user) return null;

    const filteredFriends = friends.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-24 right-6 p-4 bg-primary-600 text-white rounded-full shadow-2xl hover:bg-primary-700 transition-all z-40 group"
            >
                <div className="relative">
                    <MessageCircle size={24} />
                    {friends.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-900">
                            {friends.length}
                        </span>
                    )}
                </div>
                <span className="absolute right-full mr-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Chat with Friends
                </span>
            </button>

            {/* Sidebar Overlay */}
            <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 z-50 border-l border-gray-200 dark:border-gray-700 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-4 bg-primary-600 text-white flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Users size={20} />
                            <span className="font-bold">Friends</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search friends..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-700 dark:text-gray-200"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredFriends.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                                <Users size={40} className="mb-4 opacity-20" />
                                <p className="text-sm">No friends found.</p>
                                <Link href="/Profile" onClick={() => setIsOpen(false)} className="mt-4 text-primary-600 text-xs font-bold hover:underline">
                                    Find New Friends
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredFriends.map(friend => (
                                    <button
                                        key={friend.id}
                                        onClick={() => setSelectedFriend(friend)}
                                        className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group text-left"
                                    >
                                        <div className="relative">
                                            <img src={friend.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt={friend.name} />
                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{friend.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{friend.bio || 'Online'}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Float Chat Window */}
            {selectedFriend && (
                <DirectChat
                    currentUser={user}
                    friend={selectedFriend}
                    onClose={() => setSelectedFriend(null)}
                />
            )}
        </>
    );
};

export default FriendsSidebar;
