import { Admin } from '../../components/AdminDashboard';
import { Suspense } from 'react';

export default function Page() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        }>
            <Admin />
        </Suspense>
    );
}
