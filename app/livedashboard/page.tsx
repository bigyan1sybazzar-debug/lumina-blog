"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LiveDashboard } from '../../components/admin/LiveDashboard';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LiveDashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics Center</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <img
                            src={user?.avatar}
                            alt={user?.name}
                            className="w-8 h-8 rounded-full border border-gray-200"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <LiveDashboard />
            </main>
        </div>
    );
}
