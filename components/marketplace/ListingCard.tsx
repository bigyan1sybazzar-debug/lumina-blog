'use client';

import React from 'react';
import { PhoneListing } from '../../types';
import { User, MapPin, Phone, MessageCircle } from 'lucide-react';

interface ListingCardProps {
    listing: PhoneListing;
    onContact?: (listing: PhoneListing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onContact }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full">
            <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700">
                <img
                    src={listing.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={`${listing.brand} ${listing.model}`}
                    className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-bold">
                    {listing.condition}
                </span>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{listing.brand} {listing.model}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{listing.storage}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-primary-600 dark:text-primary-400 text-lg">
                            {listing.currency} {listing.price.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4 space-x-3">
                    <span className="flex items-center"><MapPin size={12} className="mr-1" /> {listing.location}</span>
                    <span className="flex items-center"><User size={12} className="mr-1" /> {listing.sellerName}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex space-x-2">
                    <button
                        onClick={() => onContact && onContact(listing)}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors"
                    >
                        <MessageCircle size={16} className="mr-2" /> Contact
                    </button>
                    {/* Placeholder for future specific contact actions like direct Call */}
                    {/* <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Phone size={18} />
                    </button> */}
                </div>
            </div>
        </div>
    );
};
