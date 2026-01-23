'use client';

import React, { useState, useEffect } from 'react';
import { getSubscribers, unsubscribeFromNewsletter } from '../../services/db';
import { Mail, UserMinus, Search, Download, RefreshCw, Send, CheckCircle, Settings, List } from 'lucide-react';
import { SmtpSettings } from './SmtpSettings';

export const SubscriberManager: React.FC = () => {
    const [view, setView] = useState<'list' | 'settings'>('list');
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadSubscribers();
    }, []);

    const loadSubscribers = async () => {
        setLoading(true);
        const data = await getSubscribers();
        setSubscribers(data);
        setLoading(false);
    };

    const handleUnsubscribe = async (id: string) => {
        if (!confirm('Are you sure you want to unsubscribe this user?')) return;
        setIsProcessing(id);
        try {
            await unsubscribeFromNewsletter(id);
            await loadSubscribers();
            setMessage('Subscriber updated successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update subscriber');
        } finally {
            setIsProcessing(null);
        }
    };

    const exportCSV = () => {
        const headers = ['Email', 'Subscribed At', 'Status'];
        const rows = subscribers.map(s => [s.email, s.subscribedAt, s.status]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const filteredSubscribers = subscribers.filter(s =>
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Send className="text-primary-500" size={24} />
                        Newsletter Audience
                    </h2>
                    <div className="flex items-center gap-1 mt-1 p-1 bg-gray-100 dark:bg-white/5 rounded-lg w-fit">
                        <button
                            onClick={() => setView('list')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'list'
                                ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <List size={14} /> Subscribers
                        </button>
                        <button
                            onClick={() => setView('settings')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'settings'
                                ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Settings size={14} /> SMTP Settings
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadSubscribers}
                        className="p-2.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                        title="Refresh"
                        disabled={view === 'settings'}
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50"
                        disabled={view === 'settings'}
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {message && (
                <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center gap-2 border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle size={18} />
                    {message}
                </div>
            )}

            {view === 'list' ? (
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden backdrop-blur-xl">
                    <div className="p-4 border-b border-gray-100 dark:border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-black/40 text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Subscriber</th>
                                    <th className="px-6 py-4">Joined Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-48"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-8 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : filteredSubscribers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No subscribers found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubscribers.map((subscriber) => (
                                        <tr key={subscriber.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                                        <Mail size={18} />
                                                    </div>
                                                    <span className="font-bold text-gray-900 dark:text-white">{subscriber.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(subscriber.subscribedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${subscriber.status === 'active'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {subscriber.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {subscriber.status === 'active' && (
                                                    <button
                                                        onClick={() => handleUnsubscribe(subscriber.id)}
                                                        disabled={isProcessing === subscriber.id}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                                        title="Unsubscribe"
                                                    >
                                                        {isProcessing === subscriber.id ? (
                                                            <RefreshCw size={18} className="animate-spin" />
                                                        ) : (
                                                            <UserMinus size={18} />
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <SmtpSettings />
            )}
        </div>
    );
};
