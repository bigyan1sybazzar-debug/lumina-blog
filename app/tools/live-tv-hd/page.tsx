import { Suspense } from 'react';

import { LiveSection } from '../../../components/LiveSection';

export default function LiveTVPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            }>
                <LiveSection />
            </Suspense>
        </div>
    );
}
