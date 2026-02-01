import React, { useState, useEffect } from 'react';
import { Tv, Save, Globe, Loader2, Link2, AlertCircle } from 'lucide-react';
import { getIPTVConfig, updateIPTVConfig } from '../../services/db';

interface IPTVManagerProps {
    onRefresh: () => Promise<void>;
}

export const IPTVManager: React.FC<IPTVManagerProps> = ({ onRefresh }) => {
    const [m3uUrl, setM3uUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await getIPTVConfig() as any;
                setM3uUrl(config?.m3uUrl || '');
            } catch (error) {
                console.error('Failed to load IPTV config:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            await updateIPTVConfig(m3uUrl);
            setMessage({ type: 'success', text: 'IPTV M3U URL updated successfully!' });
            await onRefresh();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update configuration.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-24">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary-500/10 rounded-2xl">
                        <Globe className="text-primary-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">External M3U Configuration</h2>
                        <p className="text-gray-500 text-sm">Set the primary M3U playlist URL to load channels automatically in the frontend.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">M3U Playlist URL</label>
                        <div className="relative group">
                            <Link2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type="url"
                                value={m3uUrl}
                                onChange={(e) => setM3uUrl(e.target.value)}
                                placeholder="https://example.com/playlist.m3u"
                                className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
                                required
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-200 ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                            }`}>
                            {message.type === 'success' ? <Tv size={18} /> : <AlertCircle size={18} />}
                            <p className="text-sm font-bold">{message.text}</p>
                        </div>
                    )}

                    <div className="pt-4 flex items-center justify-between gap-6">
                        <div className="flex-1 p-4 bg-orange-50 dark:bg-orange-500/5 rounded-2xl border border-orange-100 dark:border-orange-500/10 text-[11px] text-orange-600 dark:text-orange-400 font-medium italic">
                            💡 Tip: Use a reliable M3U link like IPTV-Org to ensure maximum uptime for your users.
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="shrink-0 flex items-center gap-3 bg-primary-600 hover:bg-primary-700 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-primary-600/25 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Save Configuration</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                        Live Loading
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Instead of storing channels in your database, the website will now fetch and parse the M3U link directly in the user's browser. This saves database space and ensures your channel list is always up-to-date with your source.
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Performance
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Data is fetched through a secure proxy to bypass CORS restrictions. Large M3U files are parsed instantly using an optimized client-side algorithm.
                    </p>
                </div>
            </div>
        </div>
    );
};
