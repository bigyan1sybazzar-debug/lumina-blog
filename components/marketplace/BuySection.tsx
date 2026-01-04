'use client';

import React, { useState, useEffect } from 'react';
import { PhoneListing } from '../../types';
import { getPhoneListings } from '../../services/marketplaceService';
import { ListingCard } from './ListingCard';
import { Search, Filter, Loader2 } from 'lucide-react';

interface BuySectionProps {
    onContact?: (listing: PhoneListing) => void;
}

export const BuySection: React.FC<BuySectionProps> = ({ onContact }) => {
    const [listings, setListings] = useState<PhoneListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        brand: 'All',
        priceRange: 'All',
        condition: 'All'
    });

    useEffect(() => {
        fetchListings();
    }, [filters]); // Re-fetch when filters change (optimization: client-side filter if small dataset)

    const fetchListings = async () => {
        setLoading(true);
        try {
            // Mapping filters to service params
            const serviceFilters: any = {};
            if (filters.brand !== 'All') serviceFilters.brand = filters.brand;
            if (filters.condition !== 'All') serviceFilters.condition = filters.condition;
            // Price parsing logic could go here or in service

            const data = await getPhoneListings(serviceFilters);
            setListings(data);
        } catch (error) {
            console.error("Failed to load listings", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
                <div className="flex items-center text-gray-500"><Filter size={18} className="mr-2" /> Filters:</div>

                <select
                    value={filters.brand}
                    onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                >
                    <option value="All">All Brands</option>
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="Google">Google</option>
                </select>

                <select
                    value={filters.condition}
                    onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                >
                    <option value="All">Any Condition</option>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used">Used</option>
                </select>

                <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                >
                    <option value="All">Any Price</option>
                    <option value="Low">Under 20k</option>
                    <option value="Mid">20k - 50k</option>
                    <option value="High">Above 50k</option>
                </select>

                <button
                    onClick={fetchListings}
                    className="ml-auto bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                    Apply
                </button>
            </div>

            {/* Listings Grid */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" /></div>
            ) : listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listings.map(listing => (
                        <ListingCard key={listing.id} listing={listing} onContact={onContact} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No phones found matching your criteria.</p>
                </div>
            )}
        </div>
    );
};
