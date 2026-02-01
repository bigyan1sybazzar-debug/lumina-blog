import React, { useState, useEffect } from 'react';
import { Tv, Save, Globe, Loader2, Link2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { getIPTVConfig, updateIPTVConfig } from '../../services/db';

interface IPTVManagerProps {
    onRefresh: () => Promise<void>;
}

export const IPTVManager: React.FC<IPTVManagerProps> = ({ onRefresh }) => {
    const [m3uUrl, setM3uUrl] = useState('');
    const [guestLimitMinutes, setGuestLimitMinutes] = useState(5);
    const [enableSportsLimit, setEnableSportsLimit] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await getIPTVConfig() as any;
                setM3uUrl(config?.m3uUrl || '');
                setGuestLimitMinutes(config?.guestLimitMinutes || 5);
                setEnableSportsLimit(config?.enableSportsLimit || false);
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
            await updateIPTVConfig({
                m3uUrl,
                guestLimitMinutes: Number(guestLimitMinutes),
                enableSportsLimit
            });
            setMessage({ type: 'success', text: 'IPTV configuration updated successfully!' });
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
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">IPTV & Access Settings</h2>
                        <p className="text-gray-500 text-sm">Configure your stream sources and guest viewing restrictions.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* M3U URL SECTION */}
                    <div className="space-y-3">
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

                    <div className="pt-4 flex items-center justify-end">
                        <button
                            type="submit"
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
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                        Dynamic Guard
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        The "Login Wall" acts as a powerful conversion tool. By offering a free preview, you build trust while encouraging users to create an account for uninterrupted viewing.
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Zero Latency
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Changes applied here are synchronized instantly with the frontend. Users will immediately be subject to the new time limits you set.
                    </p>
                </div>
            </div>
        </div>
    );
};
