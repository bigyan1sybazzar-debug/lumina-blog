'use client';

import React, { useState, useEffect } from 'react';
import { getPendingListings, getPhoneListings, updateListingStatus, deleteListing } from '../../services/marketplaceService';
import { PhoneListing } from '../../types';
import { Loader2, Check, X, Trash2, Shield, Eye } from 'lucide-react';
import { ListingCard } from '../marketplace/ListingCard';

export const MarketplaceManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    const [pendingListings, setPendingListings] = useState<PhoneListing[]>([]);
    const [allListings, setAllListings] = useState<PhoneListing[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'pending') fetchPending();
        else fetchAll();
    }, [activeTab]);

    const fetchPending = async () => {
        setLoading(true);
        const data = await getPendingListings();
        setPendingListings(data);
        setLoading(false);
    };

    const fetchAll = async () => {
        setLoading(true);
        const data = await getPhoneListings(); // This gets 'approved' ones
        // Ideally we'd want literally *all* including rejected/sold for admin, but let's start with approved
        setAllListings(data);
        setLoading(false);
    };

    const handleAction = async (id: string, action: 'approved' | 'rejected' | 'delete') => {
        if (!confirm(`Are you sure you want to ${action} this listing?`)) return;

        try {
            if (action === 'delete') {
                await deleteListing(id);
                setPendingListings(prev => prev.filter(l => l.id !== id));
                setAllListings(prev => prev.filter(l => l.id !== id));
            } else {
                await updateListingStatus(id, action);
                setPendingListings(prev => prev.filter(l => l.id !== id));
                if (activeTab === 'all' && action === 'approved') fetchAll(); // Refresh
            }
        } catch (error) {
            alert(`Failed to ${action} listing`);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Shield className="text-primary-600" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Marketplace Moderation</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Pending ({pendingListings.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all'
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Active Listings
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-500" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(activeTab === 'pending' ? pendingListings : allListings).map(listing => (
                        <div key={listing.id} className="relative group">
                            <ListingCard listing={listing} />

                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                                {activeTab === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(listing.id, 'approved')}
                                            className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all"
                                            title="Approve"
                                        >
                                            <Check size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleAction(listing.id, 'rejected')}
                                            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all"
                                            title="Reject"
                                        >
                                            <X size={20} />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => handleAction(listing.id, 'delete')}
                                    className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            {/* Badges for status if viewing all */}
                            {activeTab === 'all' && (
                                <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 dark:bg-black/80 rounded-md text-xs font-bold shadow-sm">
                                    {listing.status.toUpperCase()}
                                </div>
                            )}
                        </div>
                    ))}
                    {(activeTab === 'pending' ? pendingListings : allListings).length === 0 && (
                        <p className="col-span-full text-center py-10 text-gray-500">No listings found.</p>
                    )}
                </div>
            )}
        </div>
    );
};
