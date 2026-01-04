'use client';

import React, { useState, useEffect } from 'react';
import { getPhoneListings } from '../../services/marketplaceService';
import { PhoneListing } from '../../types';
import { ListingCard } from './ListingCard';
import { Loader2 } from 'lucide-react';

interface SellerOffersProps {
    onContact?: (listing: PhoneListing) => void;
}

export const SellerOffers: React.FC<SellerOffersProps> = ({ onContact }) => {
    const [listings, setListings] = useState<PhoneListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLatestListings();
    }, []);

    const loadLatestListings = async () => {
        setLoading(true);
        // Fetch recently added items (already ordered by timestamp in service)
        const data = await getPhoneListings();
        setListings(data.slice(0, 8)); // Limit to latest 8 for "Quick Listings" feel
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Latest Seller Offers</h2>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary-600" /></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {listings.map(listing => (
                        <div key={listing.id} className="transform scale-90 origin-top-left sm:scale-100">
                            {/* Reusing ListingCard but perhaps in future a more compact version */}
                            <ListingCard listing={listing} onContact={onContact} />
                        </div>
                    ))}
                    {listings.length === 0 && (
                        <p className="col-span-full text-center text-gray-500 py-10">No recent offers.</p>
                    )}
                </div>
            )}
        </div>
    );
};
