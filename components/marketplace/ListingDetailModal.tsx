'use client';

import React from 'react';
import { PhoneListing } from '../../types';
import { X, MapPin, User, MessageCircle, Phone, Calendar, ShieldCheck } from 'lucide-react';

interface ListingDetailModalProps {
    listing: PhoneListing;
    isOpen: boolean;
    onClose: () => void;
    onContact: (listing: PhoneListing) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({ listing, isOpen, onClose, onContact }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">

                {/* Header / Image Area */}
                <div className="relative h-64 md:h-72 bg-gray-100 dark:bg-gray-900 shrink-0">
                    <img
                        src={listing.images[0] || 'https://via.placeholder.com/600x400?text=No+Image'}
                        alt={`${listing.brand} ${listing.model}`}
                        className="w-full h-full object-contain p-4"
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        <span className="px-3 py-1 bg-white/90 dark:bg-black/80 backdrop-blur text-sm font-bold rounded-lg shadow-sm">
                            {listing.condition}
                        </span>
                        <span className="px-3 py-1 bg-primary-600 text-white text-sm font-bold rounded-lg shadow-sm">
                            {listing.currency} {listing.price.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{listing.brand} {listing.model}</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{listing.storage} Storage</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Posted {new Date(listing.timestamp).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-primary-600">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Location</p>
                                <p className="text-sm font-semibold truncate">{listing.location}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-green-600">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Contact Info</p>
                                <p className="text-sm font-semibold truncate">{listing.contactInfo}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <ShieldCheck size={18} className="text-primary-600" />
                            Description & Details
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap border border-gray-100 dark:border-gray-800">
                            {listing.description || "No description provided."}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <img
                                src={listing.sellerAvatar || '/default-avatar.png'}
                                alt={listing.sellerName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                            />
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{listing.sellerName}</p>
                                <p className="text-xs text-gray-500">Seller</p>
                            </div>
                        </div>

                        <button
                            onClick={() => onContact(listing)}
                            className="ml-auto flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-primary-500/30"
                        >
                            <MessageCircle size={18} />
                            Chat with Seller
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
