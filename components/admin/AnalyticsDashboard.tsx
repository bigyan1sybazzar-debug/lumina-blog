import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText } from 'lucide-react';
import { User, BlogPost } from '../../types';

interface AnalyticsProps {
    stats: {
        posts: number;
        views: number;
        users: number;
        comments: number;
        engagement: number;
    };
    pendingPostsCount: number;
    chartData: any[];
    isAdmin: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ stats, pendingPostsCount, chartData, isAdmin }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.views.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Posts</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.posts}</p>
                </div>
                {isAdmin && (
                    <>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
                            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{pendingPostsCount}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.users}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement Rate</p>
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.engagement}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Admin Analytics Chart */}
            {isAdmin && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Real-Time Content Performance (Views by Category)</h3>
                    <div className="h-64 md:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                                    itemStyle={{ color: '#F3F4F6' }}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                />
                                <Bar dataKey="views" name="Total Views" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
                                <Bar dataKey="posts" name="Total Posts" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};
