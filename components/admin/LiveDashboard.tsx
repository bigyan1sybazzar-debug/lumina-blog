"use client";

import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Users, Clock, Zap, FileText, Eye, AlertTriangle
} from 'lucide-react';
import { getTrafficStats, getRealtimeTraffic } from '../../services/db';

export const LiveDashboard = () => {
    const [trafficStats, setTrafficStats] = useState<any>(null);
    const [realtimeTraffic, setRealtimeTraffic] = useState({ activeUsers: 0, activePages: [] as any[] });
    const [trafficPeriod, setTrafficPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        try {
            const [stats, realtime] = await Promise.all([
                getTrafficStats(trafficPeriod),
                getRealtimeTraffic()
            ]);
            setTrafficStats(stats);
            setRealtimeTraffic(realtime);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(async () => {
            const realtime = await getRealtimeTraffic();
            setRealtimeTraffic(realtime);
        }, 5000);

        return () => clearInterval(interval);
    }, [trafficPeriod]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <TrendingUp className="text-primary-500" />
                        Live Traffic Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time insights and performance metrics</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                        <button
                            key={period}
                            onClick={() => setTrafficPeriod(period)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${trafficPeriod === period
                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                }`}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Real-time Indicator */}
            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-primary-500/20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-400"></span>
                        </div>
                        <div>
                            <div className="text-primary-100 text-sm font-medium uppercase tracking-wider">Active Users Now</div>
                            <div className="text-4xl font-black mt-1">{realtimeTraffic.activeUsers}</div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-md w-full">
                        <div className="text-primary-100 text-xs font-medium mb-3 uppercase tracking-wider">Currently Viewed Pages</div>
                        <div className="space-y-2">
                            {realtimeTraffic.activePages.slice(0, 3).map((p, i) => (
                                <div key={i} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 text-sm backdrop-blur-sm border border-white/5">
                                    <span className="truncate max-w-[200px]">{p.title}</span>
                                    <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-xs">{p.count}</span>
                                </div>
                            ))}
                            {realtimeTraffic.activePages.length === 0 && (
                                <div className="text-white/60 text-sm italic">No active visitors right now</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Eye size={20} />
                        </div>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Page Views</div>
                    <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                        {trafficStats?.totalViews?.toLocaleString() || 0}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Session Time</div>
                    <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                        {Math.floor((trafficStats?.totalDuration || 0) / 60)}m {(trafficStats?.totalDuration || 0) % 60}s
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <Zap size={20} />
                        </div>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg. Time on Page</div>
                    <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                        {Math.floor((trafficStats?.averageTime || 0) / 60)}m {Math.floor(trafficStats?.averageTime || 0) % 60}s
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                            <FileText size={20} />
                        </div>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Active Pages</div>
                    <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{realtimeTraffic.activePages.length}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Performing Pages</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                    <th className="pb-3 font-medium">PAGE TITLE</th>
                                    <th className="pb-3 font-medium">VIEWS</th>
                                    <th className="pb-3 font-medium text-right">TOTAL TIME</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {trafficStats?.topPages?.map((page: any, i: number) => (
                                    <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <td className="py-4">
                                            <div className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-sm" title={page.title}>{page.title}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-1">{page.slug}</div>
                                        </td>
                                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 dark:text-white">{page.views}</span>
                                                <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary-500"
                                                        style={{ width: `${(page.views / (trafficStats.topPages[0]?.views || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-right text-gray-600 dark:text-gray-400 font-mono">
                                            {Math.floor(page.duration / 60)}m {page.duration % 60}s
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Device Distribution</h3>
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                    Desktop
                                </div>
                                <span className="font-bold">72%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: '72%' }} />
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                                    Mobile
                                </div>
                                <span className="font-bold">28%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: '28%' }} />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-2">
                                <AlertTriangle size={18} />
                                <span className="text-sm font-bold">Insights</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Most visitors are currently viewing your content from Desktop. Consider optimizing your "Write Post" editor for better desktop experience.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
