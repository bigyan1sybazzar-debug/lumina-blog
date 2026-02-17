"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { recordPageView, updatePageHeartbeat } from '../services/db';
import { useAuth } from '../context/AuthContext';

export const Analytics = () => {
    const rawPathname = usePathname();
    const searchParams = useSearchParams();
    const pathname = rawPathname || '/';
    // Create a full path including search params for granular tracking
    const fullPath = searchParams && searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

    const { user } = useAuth();
    const sessionIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number>(0);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Scroll to top
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }

        // Tracking logic
        const initTracking = async () => {
            // Clean up previous session if it exists
            if (sessionIdRef.current) {
                const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
                updatePageHeartbeat(sessionIdRef.current, duration, false);
                if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            }

            // Start new session
            startTimeRef.current = Date.now();
            const title = (typeof document !== 'undefined' ? document.title : '') || pathname;

            const sessionId = await recordPageView({
                slug: fullPath,
                title: title,
                userId: user?.id || undefined,
                device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'
            });

            sessionIdRef.current = sessionId;

            // Start heartbeat
            heartbeatIntervalRef.current = setInterval(() => {
                if (sessionIdRef.current) {
                    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
                    updatePageHeartbeat(sessionIdRef.current, duration, true);
                }
            }, 30000); // Every 30 seconds
        };

        if (fullPath) {
            initTracking();
        }

        return () => {
            if (sessionIdRef.current) {
                const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
                updatePageHeartbeat(sessionIdRef.current, duration, false);
            }
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        };
    }, [fullPath, user?.id]);

    return null;
};
