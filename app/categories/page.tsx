import { Suspense } from 'react';
import Categories from '../../pages/Categories';
import { Loader2 } from 'lucide-react';

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white dark:bg-gray-900 pt-16 pb-24 flex items-center justify-center">
                <Loader2 className="animate-spin" size={48} />
            </div>
        }>
            <Categories />
        </Suspense>
    );
}
