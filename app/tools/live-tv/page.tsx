'use client';

import React from 'react';
import { LiveSection } from '../../../components/LiveSection';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LiveTVPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Home
                    </Link>
                </div>

                <LiveSection />
            </div>
        </div>
    );
}
