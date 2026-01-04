'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBuyerRequests, createBuyerRequest } from '../../services/marketplaceService';
import { BuyerRequest } from '../../types';
import { Loader2, Plus, User, MessageCircle } from 'lucide-react';

interface BuyerRequestsProps {
    onContact?: (request: BuyerRequest) => void;
}

export const BuyerRequests: React.FC<BuyerRequestsProps> = ({ onContact }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<BuyerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        model: '',
        budgetRange: '',
        condition: 'Used',
        location: '',
        description: ''
    });

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        const data = await getBuyerRequests();
        setRequests(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert("Please login to post a request");

        try {
            await createBuyerRequest({
                buyerId: user.id,
                buyerName: user.name,
                buyerAvatar: user.avatar,
                model: formData.model,
                budgetRange: formData.budgetRange,
                condition: formData.condition,
                location: formData.location,
                description: formData.description
            });
            setShowForm(false);
            setFormData({ model: '', budgetRange: '', condition: 'Used', location: '', description: '' });
            loadRequests();
        } catch (error) {
            console.error(error);
            alert("Failed to post request");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Buyer Requests</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                >
                    <Plus size={16} className="mr-2" /> Post Requirement
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-primary-100 dark:border-primary-900/20 animate-in slide-in-from-top-4">
                    <h3 className="font-bold mb-4">What are you looking for?</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                required placeholder="Phone Model (e.g. iPhone 12)"
                                value={formData.model}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                className="input-field"
                            />
                            <input
                                required placeholder="Budget (e.g. Under 40k)"
                                value={formData.budgetRange}
                                onChange={e => setFormData({ ...formData, budgetRange: e.target.value })}
                                className="input-field"
                            />
                            <select
                                value={formData.condition}
                                onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                className="input-field"
                            >
                                <option value="New">New</option>
                                <option value="Used">Used</option>
                            </select>
                            <input
                                required placeholder="Location"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <textarea
                            placeholder="Additional details..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="input-field w-full"
                            rows={2}
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary">Post Request</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map(req => (
                    <div key={req.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex gap-4">
                        <img src={req.buyerAvatar} alt={req.buyerName} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Looking for: <span className="text-primary-600">{req.model}</span></p>
                            <p className="text-xs text-gray-500 mb-2">Budget: {req.budgetRange} • {req.condition}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">{req.description}</p>
                            <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                                <span className="flex items-center"><User size={12} className="mr-1" /> {req.buyerName} • {req.location}</span>
                                {user && user.id !== req.buyerId && (
                                    <button
                                        onClick={() => onContact && onContact(req)}
                                        className="text-primary-600 hover:text-primary-700 font-bold text-xs flex items-center"
                                    >
                                        <MessageCircle size={14} className="mr-1" /> Message Buyer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .input-field {
                    @apply w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-sm;
                }
                .btn-primary {
                    @apply bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700;
                }
                .btn-secondary {
                    @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold;
                }
            `}</style>
        </div>
    );
};
