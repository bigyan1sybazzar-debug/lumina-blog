'use client';

import React from 'react';
import { LiveSection } from '../../../components/LiveSection';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LiveTVPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            <LiveSection />
        </div>
    );
}
