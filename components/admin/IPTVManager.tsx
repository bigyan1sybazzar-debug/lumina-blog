import React, { useState } from 'react';
import { Tv, Plus, Trash2, Power, Play, X, Search, Globe, Loader2, Link2, Download, Check, Tag } from 'lucide-react';
import { IPTVChannel, IPTVCategory } from '../../types';
import HLSPlayer from '../HLSPlayer';
import { parseM3U, M3UChannel } from '../../lib/m3uParser';

interface IPTVManagerProps {
    channels: IPTVChannel[];
    categories: IPTVCategory[];
    onCreateChannel: (channel: Omit<IPTVChannel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onUpdateChannel: (id: string, updates: Partial<IPTVChannel>) => Promise<void>;
    onDeleteChannel: (id: string) => Promise<void>;
    onCreateCategory: (name: string) => Promise<void>;
    onDeleteCategory: (id: string) => Promise<void>;
}

export const IPTVManager: React.FC<IPTVManagerProps> = ({ channels, categories, onCreateChannel, onUpdateChannel, onDeleteChannel, onCreateCategory, onDeleteCategory }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState('Entertainment');
    const [logo, setLogo] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [testUrl, setTestUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Bulk Import state
    const [importUrl, setImportUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importPreview, setImportPreview] = useState<M3UChannel[]>([]);
    const [isFetchingImport, setIsFetchingImport] = useState(false);
    const [showManageCategories, setShowManageCategories] = useState(false);
    const [newCatName, setNewCatName] = useState('');

    const categoriesList = ['All', ...Array.from(new Set(channels.map(c => c.category)))];

    const handleCreate = async () => {
        if (!name || !url) {
            alert('Name and Stream URL are required');
            return;
        }
        setIsSubmitting(true);
        try {
            await onCreateChannel({ name, url, category, logo, status: 'active' });
            setName('');
            setUrl('');
            setLogo('');
            setCategory('Entertainment');
            setIsAdding(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkImport = async () => {
        if (!importUrl) return;
        setIsFetchingImport(true);
        try {
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(importUrl)}`;
            const res = await fetch(proxyUrl);
            const content = await res.text();
            const parsedChannels = parseM3U(content);
            setImportPreview(parsedChannels);
        } catch (error) {
            alert('Failed to fetch/parse M3U from URL.');
        } finally {
            setIsFetchingImport(false);
        }
    };

    const handleConfirmImport = async () => {
        if (importPreview.length === 0) return;
        setIsImporting(true);
        try {
            let count = 0;
            for (const item of importPreview) {
                // To avoid overloading, we could batch but let's do sequential for simplicity (Firebase handles well)
                await onCreateChannel({
                    name: item.name,
                    url: item.url,
                    category: item.group || 'Imported',
                    logo: item.logo || '',
                    status: 'active'
                });
                count++;
            }
            alert(`Successfully imported ${count} channels!`);
            setShowImportModal(false);
            setImportPreview([]);
            setImportUrl('');
        } catch (error) {
            alert('Error during import process.');
        } finally {
            setIsImporting(false);
        }
    };

    const filteredChannels = channels.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search your channels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 font-bold text-sm"
                    >
                        {categoriesList.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowManageCategories(true)}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95"
                    >
                        <Tag size={18} />
                        Categories
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
                    >
                        <Download size={18} />
                        Import
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary-600/20 active:scale-95"
                    >
                        <Plus size={18} />
                        Add New
                    </button>
                </div>
            </div>

            {/* Test Player Overlay */}
            {testUrl && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-8 animate-in fade-in duration-300 backdrop-blur-sm">
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10">
                        <button
                            onClick={() => setTestUrl(null)}
                            className="absolute top-6 right-6 z-50 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md active:scale-90"
                        >
                            <X size={24} />
                        </button>
                        <HLSPlayer src={testUrl} className="w-full h-full" />
                        <div className="absolute bottom-8 left-8 pointer-events-none">
                            <div className="bg-emerald-500/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-emerald-500/30 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest">Live Preview Mode</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Categories Modal */}
            {showManageCategories && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg p-8 rounded-[32px] border border-gray-200 dark:border-gray-700 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-2xl flex items-center gap-3 text-gray-900 dark:text-white">
                                <Tag className="text-primary-500" />
                                IPTV Categories
                            </h3>
                            <button onClick={() => setShowManageCategories(false)}>
                                <X />
                            </button>
                        </div>

                        <div className="flex gap-3 mb-8">
                            <input
                                type="text"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                placeholder="New category name..."
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none"
                            />
                            <button
                                onClick={async () => {
                                    if (!newCatName) return;
                                    await onCreateCategory(newCatName);
                                    setNewCatName('');
                                }}
                                className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold"
                            >
                                <Plus />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                    <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{cat.name}</span>
                                    <button onClick={() => onDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <p className="text-center text-gray-400 py-8">No categories defined yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl p-8 rounded-[32px] border border-gray-200 dark:border-gray-700 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-8 flex-shrink-0">
                            <div>
                                <h3 className="font-black text-2xl flex items-center gap-3 text-gray-900 dark:text-white">
                                    <div className="p-2 bg-zinc-900 text-white rounded-xl">
                                        <Download />
                                    </div>
                                    Bulk Import Channels
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Paste an M3U link to process and import multiple channels.</p>
                            </div>
                            <button onClick={() => setShowImportModal(false)} className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex gap-4 mb-8 flex-shrink-0">
                            <div className="flex-1 relative">
                                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={importUrl}
                                    onChange={(e) => setImportUrl(e.target.value)}
                                    placeholder="https://iptv-org.github.io/iptv/index.m3u"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
                                />
                            </div>
                            <button
                                onClick={handleBulkImport}
                                disabled={isFetchingImport || !importUrl}
                                className="px-8 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50"
                            >
                                {isFetchingImport ? <Loader2 className="animate-spin" /> : 'Fetch List'}
                            </button>
                        </div>

                        {importPreview.length > 0 && (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-bold text-gray-500">
                                        Detected {importPreview.length} items
                                    </span>
                                    <button
                                        onClick={handleConfirmImport}
                                        disabled={isImporting}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                    >
                                        {isImporting ? <Loader2 className="animate-spin" /> : <><Check size={16} /> Import All Into DB</>}
                                    </button>
                                </div>
                                <div className="overflow-y-auto pr-2 space-y-2 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4 bg-gray-50 dark:bg-gray-900/30">
                                    {importPreview.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700/20">
                                                {item.logo ? <img src={item.logo} className="w-full h-full object-contain" /> : <Tv className="text-gray-300" size={16} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono truncate">{item.url}</p>
                                            </div>
                                            <span className="text-[9px] font-black text-primary-500 bg-primary-500/10 px-2 py-1 rounded-md uppercase">{item.group}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!importPreview.length && !isFetchingImport && (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400">
                                <Link2 size={48} className="mb-4 opacity-10" />
                                <p>Enter a URL and click 'Fetch List' to start</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add/Edit Form Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl p-8 rounded-[32px] border border-gray-200 dark:border-gray-700 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-black text-2xl flex items-center gap-3 text-gray-900 dark:text-white">
                                    <div className="p-2 bg-primary-500/10 rounded-xl">
                                        <Tv className="text-primary-500" />
                                    </div>
                                    Manage Channel
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Fill in the details to add a new selected stream.</p>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Channel Name</label>
                                <input
                                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
                                    placeholder="e.g. ESPN HD"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stream URL (.m3u8)</label>
                                <input
                                    type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
                                    placeholder="https://.../playlist.m3u8"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Category</label>
                                <select
                                    value={category} onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                    {categories.length === 0 && <option value="Entertainment">Entertainment</option>}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Logo URL (Optional)</label>
                                <input
                                    type="text" value={logo} onChange={(e) => setLogo(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="https://.../logo.png"
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            <button
                                onClick={() => {
                                    if (url) setTestUrl(url);
                                    else alert('Enter a URL to test');
                                }}
                                className="px-8 py-4 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white font-black rounded-2xl transition-all flex items-center gap-2 hover:opacity-90 active:scale-95"
                            >
                                <Play size={18} fill="currentColor" />
                                Test Now
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isSubmitting}
                                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-black py-4 rounded-2xl transition-all shadow-[0_10px_20px_rgba(255,59,48,0.2)] disabled:opacity-50 active:scale-95"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm & Save Channel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Channels List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChannels.map(channel => (
                    <div key={channel.id} className="group relative bg-white dark:bg-gray-800 rounded-[32px] border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700/50">
                                        {channel.logo ? (
                                            <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <Tv className="text-gray-300" size={28} />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors uppercase tracking-tight antialiased">{channel.name}</h4>
                                        <span className="text-[10px] font-black text-primary-500 bg-primary-500/10 px-3 py-1.5 rounded-full inline-block mt-2 uppercase tracking-widest">{channel.category}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onUpdateChannel(channel.id, { status: channel.status === 'active' ? 'inactive' : 'active' })}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${channel.status === 'active' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
                                >
                                    <Power size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 mb-6 group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors">
                                <Globe size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-mono font-medium">{channel.url}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setTestUrl(channel.url)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-emerald-600 text-white py-3.5 rounded-2xl transition-all text-xs font-black uppercase tracking-widest antialiased active:scale-95"
                                >
                                    <Play size={14} fill="currentColor" />
                                    Test
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to remove this channel?')) onDeleteChannel(channel.id);
                                    }}
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredChannels.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-[40px] border-4 border-dashed border-gray-100 dark:border-gray-800 group hover:border-primary-500/20 transition-all">
                        <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl mx-auto flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform">
                            <Tv className="text-gray-200 group-hover:text-primary-500 transition-colors" size={40} />
                        </div>
                        <p className="text-gray-400 font-bold text-lg">No custom channels found.</p>
                        <p className="text-gray-400 text-sm mt-1 mb-8">Click 'Add New' to populate your selected IPTV list.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-primary-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30 active:scale-95"
                        >
                            Create First Channel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
