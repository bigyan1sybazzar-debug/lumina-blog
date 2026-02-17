'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const LiveSection = dynamic(
    () => import('../../../components/LiveSection').then((mod) => mod.LiveSection),
    { ssr: false }
);

export default function LiveTVPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            <LiveSection />
        </div>
    );
}
