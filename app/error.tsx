'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console
        console.error('Error boundary caught:', error);

        // Check for ChunkLoadError (common after new deployments)
        if (
            error.message?.includes('chunk') ||
            error.message?.includes('loading') ||
            error.name === 'ChunkLoadError'
        ) {
            console.log('ChunkLoadError detected. Attempting automatic reload...');
            // Optional: You could use a small timeout to avoid infinite reload loop
            window.location.reload();
        }
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm m-4">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 className="text-3xl font-black mb-4 text-gray-900 dark:text-white uppercase tracking-tight">Something went wrong!</h2>
            <p className="mb-8 text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                {error.message?.includes('chunk')
                    ? 'A newer version of the site is available. We need to reload the page to sync.'
                    : 'An unexpected error occurred while loading this section.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => reset()}
                    className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg active:scale-95"
                >
                    Try again
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                    Hard Refresh
                </button>
            </div>
        </div>
    );
}
