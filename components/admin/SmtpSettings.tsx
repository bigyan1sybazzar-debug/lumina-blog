'use client';

import React, { useState, useEffect } from 'react';
import { getSmtpSettings, updateSmtpSettings } from '../../services/db';
import { Mail, Shield, Server, User, Key, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const SmtpSettings: React.FC = () => {
    const [settings, setSettings] = useState({
        host: 'smtp.zoho.com',
        port: '465',
        user: '',
        password: '',
        senderName: 'Lumina Blog'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const data = await getSmtpSettings();
        if (data) {
            setSettings({
                host: data.host || 'smtp.zoho.com',
                port: data.port || '465',
                user: data.user || '',
                password: data.password || '',
                senderName: data.senderName || 'Lumina Blog'
            });
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await updateSmtpSettings(settings);
            setMessage({ type: 'success', text: 'Settings saved successfully' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Error saving SMTP settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 flex justify-center">
                <RefreshCw className="animate-spin text-primary-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Zoho SMTP Configuration</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure your email delivery settings here.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Server size={14} /> SMTP Host
                            </label>
                            <input
                                type="text"
                                value={settings.host}
                                onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-gray-900 dark:text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Shield size={14} /> SMTP Port
                            </label>
                            <input
                                type="text"
                                value={settings.port}
                                onChange={(e) => setSettings({ ...settings, port: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-gray-900 dark:text-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <User size={14} /> SMTP User (Email)
                        </label>
                        <input
                            type="email"
                            value={settings.user}
                            onChange={(e) => setSettings({ ...settings, user: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-gray-900 dark:text-white"
                            placeholder="your-name@your-domain.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Key size={14} /> SMTP Password
                        </label>
                        <input
                            type="password"
                            value={settings.password}
                            onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-gray-900 dark:text-white"
                            placeholder="Your application-specific password"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <User size={14} /> Sender Display Name
                        </label>
                        <input
                            type="text"
                            value={settings.senderName}
                            onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                            } animate-in fade-in slide-in-from-top-2`}>
                            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xl shadow-primary-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/10">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-blue-500 mt-0.5 shrink-0" size={18} />
                        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
                            <p className="font-bold">Important for Zoho Users:</p>
                            <ul className="list-disc pl-4 space-y-1 opacity-80">
                                <li>Use <b>smtp.zoho.com</b> and port <b>465</b> (SSL) or <b>587</b> (TLS).</li>
                                <li>We recommend using an <b>Application-Specific Password</b> if you have Two-Factor Authentication enabled.</li>
                                <li>Ensure the "From" address matches your Zoho user email.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
