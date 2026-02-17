import React, { useState, useEffect } from 'react';
import { TrendingUp, Save, Edit3, Trash2, Loader2, GripVertical, CheckCircle, AlertCircle, Tv, Play } from 'lucide-react';
import { LiveLink, IPTVChannel } from '../../types';

interface TrendingManagerProps {
    liveLinks: LiveLink[];
    iptvChannels: IPTVChannel[];
    onUpdateLiveLink: (id: string, updates: Partial<LiveLink>) => Promise<void>;
    onUpdateIPTVChannel: (id: string, updates: Partial<IPTVChannel>) => Promise<void>;
    onRefresh: () => Promise<void>;
}

export const TrendingManager: React.FC<TrendingManagerProps> = ({
    liveLinks,
    iptvChannels,
    onUpdateLiveLink,
    onUpdateIPTVChannel,
    onRefresh
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Filter only trending items
    const trendingItems = [
        ...liveLinks.filter(l => l.isTrending).map(l => ({ ...l, itemType: 'sports' })),
        ...iptvChannels.filter(c => c.isTrending).map(c => ({
            id: c.id,
            heading: c.name,
            iframeUrl: c.url,
            isTrending: true,
            trendingOrder: c.trendingOrder,
            itemType: 'iptv'
        }))
    ].sort((a, b) => (a.trendingOrder || 0) - (b.trendingOrder || 0));

    const handleUpdateOrder = async (id: string, itemType: 'sports' | 'iptv', newOrder: number) => {
        setIsSaving(true);
        try {
            if (itemType === 'sports') {
                await onUpdateLiveLink(id, { trendingOrder: newOrder });
            } else {
                await onUpdateIPTVChannel(id, { trendingOrder: newOrder });
            }
            setMessage({ type: 'success', text: 'Order updated successfully!' });
            await onRefresh();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update order.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRename = async (id: string, itemType: 'sports' | 'iptv', newName: string) => {
        setIsSaving(true);
        try {
            if (itemType === 'sports') {
                await onUpdateLiveLink(id, { heading: newName });
            } else {
                await onUpdateIPTVChannel(id, { name: newName });
            }
            setMessage({ type: 'success', text: 'Renamed successfully!' });
            await onRefresh();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to rename.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveTrending = async (id: string, itemType: 'sports' | 'iptv') => {
        if (!confirm('Remove from Trending Now?')) return;
        setIsSaving(true);
        try {
            if (itemType === 'sports') {
                await onUpdateLiveLink(id, { isTrending: false });
            } else {
                await onUpdateIPTVChannel(id, { isTrending: false });
            }
            setMessage({ type: 'success', text: 'Removed from trending.' });
            await onRefresh();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to remove.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl">
                            <TrendingUp className="text-red-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Trending Now Manager</h2>
                            <p className="text-gray-500 text-sm">Organize and rename items in the trending slider.</p>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in shadow-sm ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                        }`}>
                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100/50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {trendingItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <TrendingUp size={32} className="text-gray-300" />
                                            <p className="text-gray-500 font-medium">No trending items selected.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                trendingItems.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    defaultValue={item.trendingOrder || 0}
                                                    onBlur={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (val !== (item.trendingOrder || 0)) {
                                                            handleUpdateOrder(item.id, item.itemType as any, val);
                                                        }
                                                    }}
                                                    className="w-16 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    defaultValue={item.heading}
                                                    key={`${item.id}-${item.heading}`}
                                                    onBlur={(e) => {
                                                        if (e.target.value && e.target.value !== item.heading) {
                                                            handleRename(item.id, item.itemType as any, e.target.value);
                                                        }
                                                    }}
                                                    className="flex-1 min-w-[200px] px-3 py-1.5 bg-white/50 dark:bg-gray-900/50 border border-transparent hover:border-gray-200 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 outline-none rounded-lg transition-all text-sm font-bold text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {item.itemType === 'sports' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded-md border border-blue-100 dark:border-blue-800">
                                                        <Play size={10} /> Live Sports
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase rounded-md border border-purple-100 dark:border-purple-800">
                                                        <Tv size={10} /> IPTV
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleRemoveTrending(item.id, item.itemType as any)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                    title="Remove from Trending"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                    <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                        Sorting is ascending (1, 2, 3...). Items with the same order will be sorted by their creation date.
                    </p>
                </div>
            </div>
        </div>
    );
};
