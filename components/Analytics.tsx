'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { notifyIndexNow } from '../services/indexingService';

export const Analytics = () => {
    const pathname = usePathname();

    useEffect(() => {
        // Only notify IndexNow for actual content pages, not /login or /admin
        if (pathname && !pathname.startsWith('/admin') && !pathname.startsWith('/login')) {
            notifyIndexNow([pathname]);
        }
        // Scroll to top is handled by Next.js automatically, but sometimes needed for edge cases
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};
