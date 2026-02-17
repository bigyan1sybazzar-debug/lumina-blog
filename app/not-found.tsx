import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '404 - Page Not Found | Bigyann',
    robots: {
        index: false,
        follow: true,
    },
};

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gray-50 dark:bg-gray-900">
            <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">Page Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                The link might be broken or the page has been moved.
            </p>
            <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-full transition-all">
                Return Home
            </Link>
        </div>
    );
}
