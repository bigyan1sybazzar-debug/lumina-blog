'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LiveFootballRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/tools/live-score');
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-100 dark:border-primary-900/30 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Redirecting to Live Score...</p>
      </div>
    </div>
  );
}