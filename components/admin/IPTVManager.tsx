import React, { useState, useEffect } from 'react';
import { Tv, Save, Globe, Loader2, Link2, AlertCircle, Clock, ShieldAlert, Search, Trash2, Power, TrendingUp, Filter, Plus, Upload, CheckCircle } from 'lucide-react';
import { getIPTVConfig, updateIPTVConfig, addIPTVCategory } from '../../services/db';
import { IPTVChannel, IPTVCategory } from '../../types';

interface IPTVManagerProps {
    onRefresh: () => Promise<void>;
    channels: IPTVChannel[];
    categories: IPTVCategory[];
    onUpdateChannel: (id: string, updates: Partial<IPTVChannel>) => Promise<void>;
    onDeleteChannel: (id: string) => Promise<void>;
    onCreateChannel: (channel: Omit<IPTVChannel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onBatchCreate: (channels: Omit<IPTVChannel, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

export const IPTVManager: React.FC<IPTVManagerProps> = ({
    onRefresh,
    channels,
    categories,
    onUpdateChannel,
    onDeleteChannel,
    onCreateChannel,
    onBatchCreate
}) => {
    const [m3uUrl, setM3uUrl] = useState('');
    const [guestLimitMinutes, setGuestLimitMinutes] = useState(5);
    const [enableSportsLimit, setEnableSportsLimit] = useState(false);
    const [adUrl, setAdUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await getIPTVConfig() as any;
                setM3uUrl(config?.m3uUrl || '');
                setGuestLimitMinutes(config?.guestLimitMinutes || 5);
                setEnableSportsLimit(config?.enableSportsLimit || false);
                setAdUrl(config?.adUrl || '');
            } catch (error) {
                console.error('Failed to load IPTV config:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            await updateIPTVConfig({
                m3uUrl,
                guestLimitMinutes: Number(guestLimitMinutes),
                enableSportsLimit,
                adUrl
            });
            setMessage({ type: 'success', text: 'IPTV configuration updated successfully!' });
            await onRefresh();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update configuration.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFetchM3U = async () => {
        if (!m3uUrl) {
            alert('Please provide an M3U URL first');
            return;
        }
        setIsImporting(true);
        try {
            const response = await fetch(m3uUrl);
            const text = await response.text();

            const lines = text.split('\n');
            const newChannels: Omit<IPTVChannel, 'id' | 'createdAt' | 'updatedAt'>[] = [];
            const newCats = new Set<string>();

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXTINF:')) {
                    const infoLine = lines[i];
                    const urlLine = lines[i + 1]?.trim();

                    if (urlLine && !urlLine.startsWith('#')) {
                        const nameMatch = infoLine.match(/,(.*)$/);
                        const logoMatch = infoLine.match(/tvg-logo="(.*?)"/);
                        const groupMatch = infoLine.match(/group-title="(.*?)"/);

                        const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
                        const logo = logoMatch ? logoMatch[1] : '';
                        const category = groupMatch ? groupMatch[1] : 'Uncategorized';

                        newChannels.push({
                            name,
                            url: urlLine,
                            logo,
                            category,
                            status: 'active',
                            isTrending: false
                        });
                        newCats.add(category);
                    }
                }
            }

            if (newChannels.length > 0) {
                // Add new categories first
                for (const cat of Array.from(newCats)) {
                    if (!categories.find(c => c.name === cat)) {
                        await addIPTVCategory(cat);
                    }
                }

                await onBatchCreate(newChannels);
                alert(`Successfully imported ${newChannels.length} channels!`);
                await onRefresh();
            } else {
                alert('No valid channels found in the M3U file.');
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import channels. Please check the URL and try again.');
        } finally {
            setIsImporting(false);
        }
    };

    const toggleTrending = async (channel: IPTVChannel) => {
        try {
            await onUpdateChannel(channel.id, { isTrending: !channel.isTrending });
        } catch (error) {
            console.error('Failed to toggle trending:', error);
        }
    };

    const toggleStatus = async (channel: IPTVChannel) => {
        try {
            await onUpdateChannel(channel.id, { status: channel.status === 'active' ? 'inactive' : 'active' });
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    const filteredChannels = channels.filter(channel => {
        const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            channel.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || channel.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-24">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            {/* CONFIGURATION SECTION */}
            <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary-500/10 rounded-2xl">
                        <Globe className="text-primary-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">IPTV & Access Settings</h2>
                        <p className="text-gray-500 text-sm">Configure your stream sources and guest viewing restrictions.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* M3U URL */}
                        <div className="lg:col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">M3U Playlist URL</label>
                            <div className="relative group flex gap-2">
                                <div className="relative flex-1">
                                    <Link2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                                    <input
                                        type="url"
                                        value={m3uUrl}
                                        onChange={(e) => setM3uUrl(e.target.value)}
                                        placeholder="https://example.com/playlist.m3u"
                                        className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
                                    />
                                </div>
                                <label className="flex items-center justify-center px-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Upload M3U File">
                                    <Upload size={20} className="text-gray-500" />
                                    <input
                                        type="file"
                                        accept=".m3u,.m3u8"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            try {
                                                setIsImporting(true);
                                                const filename = encodeURIComponent(file.name);
                                                const res = await fetch(`/api/upload?filename=${filename}`, {
                                                    method: 'POST',
                                                    body: file,
                                                });

                                                if (!res.ok) throw new Error('Upload failed');

                                                const data = await res.json();
                                                setM3uUrl(data.url);
                                                alert('File uploaded successfully! URL set.');
                                            } catch (error) {
                                                console.error('Upload error:', error);
                                                alert('Failed to upload file.');
                                            } finally {
                                                setIsImporting(false);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* IMPORT BUTTON */}
                        <div className="flex items-end">
                            <button
                                onClick={handleFetchM3U}
                                disabled={isImporting || !m3uUrl}
                                className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/25 active:scale-95 disabled:opacity-50"
                            >
                                {isImporting ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                                <span>Import Channels</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* TIMER SECTION */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <Clock size={12} />
                                Guest Preview Limit (Minutes)
                            </label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={guestLimitMinutes}
                                    onChange={(e) => setGuestLimitMinutes(parseInt(e.target.value))}
                                    className="w-full px-6 py-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">mins</div>
                            </div>
                            <p className="text-[10px] text-gray-400 italic">After this time, guests will see a login popup.</p>
                        </div>

                        {/* SPORTS LIMIT SECTION */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <ShieldAlert size={12} />
                                Live Sports Restrictions
                            </label>
                            <button
                                type="button"
                                onClick={() => setEnableSportsLimit(!enableSportsLimit)}
                                className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl border transition-all ${enableSportsLimit
                                    ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30 text-red-700 dark:text-red-400'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700 text-gray-500'
                                    }`}
                            >
                                <span className="font-bold text-sm">Apply limit to Live Sports?</span>
                                <div className={`w-12 h-6 rounded-full relative transition-colors ${enableSportsLimit ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enableSportsLimit ? 'right-1' : 'left-1'}`} />
                                </div>
                            </button>
                            <p className="text-[10px] text-gray-400 italic">When enabled, the same time limit applies to Live Sports matches.</p>
                        </div>

                        {/* AD URL SECTION */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <TrendingUp size={12} />
                                Unlock Page Ad URL (Opens in New Tab)
                            </label>
                            <div className="relative group">
                                <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="url"
                                    value={adUrl}
                                    onChange={(e) => setAdUrl(e.target.value)}
                                    placeholder="Paste the ad URL here (e.g. from hovering over the ad)"
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-xs"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 italic">This URL will be used for the 'Click to Unlock' feature. It opens in a new tab to keep your site active.</p>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-200 ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                            }`}>
                            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            <p className="text-sm font-bold">{message.text}</p>
                        </div>
                    )}

                    <div className="pt-4 flex items-center justify-end">
                        <button
                            onClick={handleSaveConfig}
                            disabled={isSaving}
                            className="shrink-0 flex items-center gap-3 bg-primary-600 hover:bg-primary-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-primary-600/25 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Apply All Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* CHANNELS MANAGEMENT SECTION */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                            <Tv className="text-indigo-500" size={20} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Channel Directory</h3>
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-lg text-xs font-bold">{channels.length} Total</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or category..."
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="relative min-w-[180px]">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-12 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm appearance-none font-medium capitalize"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Channel Info</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Trending</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {filteredChannels.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                                                    <Tv size={32} className="text-gray-300" />
                                                </div>
                                                <p className="text-gray-500 font-medium">No channels found matching your filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredChannels.map(channel => (
                                        <tr key={channel.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-900 overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                                                        {channel.logo ? (
                                                            <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                <Tv size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]" title={channel.name}>
                                                            {channel.name}
                                                        </h4>
                                                        <p className="text-[10px] font-mono text-gray-400 truncate max-w-[200px]" title={channel.url}>
                                                            {channel.url}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="text-xs font-bold px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg capitalize">
                                                    {channel.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => toggleStatus(channel)}
                                                        className={`p-2 rounded-xl border transition-all ${channel.status === 'active'
                                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                                                            : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-900/50 dark:border-gray-700'
                                                            }`}
                                                        title={channel.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <Power size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => toggleTrending(channel)}
                                                        className={`p-2 rounded-xl border transition-all ${channel.isTrending
                                                            ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 shadow-sm'
                                                            : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-900/50 dark:border-gray-700'
                                                            }`}
                                                        title={channel.isTrending ? 'Remove from Trending' : 'Add to Trending'}
                                                    >
                                                        <TrendingUp size={18} fill={channel.isTrending ? 'currentColor' : 'none'} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => onDeleteChannel(channel.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                        title="Delete Channel"
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
                </div>
            </div>
        </div>
    );
};
