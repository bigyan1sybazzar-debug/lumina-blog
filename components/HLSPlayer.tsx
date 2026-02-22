'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Loader2, Radio } from 'lucide-react';

interface HLSPlayerProps {
    src: string;
    autoPlay?: boolean;
    muted?: boolean;
    className?: string;
    onReady?: () => void;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({
    src,
    autoPlay = true,
    muted = false,
    className = '',
    onReady
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    const proxiedSrc = src.includes('/api/proxy') || src.startsWith('blob:') || src.startsWith('data:')
        ? src
        : `/api/proxy?url=${encodeURIComponent(src)}`;

    const onReadyRef = useRef(onReady);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        setError(null);
        setIsLoading(true);

        let hls: any = null;
        let stallInterval: ReturnType<typeof setInterval> | null = null;

        const loadStream = async (streamUrl: string) => {
            // Clean up any existing instance
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            const Hls = (await import('hls.js')).default;

            if (!Hls.isSupported()) {
                // Native HLS (Safari)
                video.src = streamUrl;
                video.addEventListener('loadedmetadata', () => {
                    setIsLoading(false);
                    if (onReadyRef.current) onReadyRef.current();
                    if (autoPlay) video.play().catch(() => { });
                }, { once: true });
                return;
            }

            hls = new Hls({
                // === DIRECT URL, NO PROXY - same as browser ===
                enableWorker: true,
                lowLatencyMode: false,       // Off = prioritize stability

                // === 120s BUFFER SHIELD ===
                backBufferLength: 120,
                maxBufferLength: 120,
                maxMaxBufferLength: 180,
                maxBufferSize: 300 * 1000 * 1000, // 300MB
                maxBufferHole: 0.5,
                highBufferWatchdogPeriod: 2,

                // === LIVE SYNC ===
                liveSyncDurationCount: 5,
                liveMaxLatencyDurationCount: 15,

                // === FAST RECOVERY ===
                manifestLoadingMaxRetry: 10,
                manifestLoadingRetryDelay: 500,  // Retry fast after 502
                levelLoadingMaxRetry: 10,
                levelLoadingRetryDelay: 500,
                fragLoadingMaxRetry: 8,
                fragLoadingRetryDelay: 300,
            });

            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on('hlsManifestParsed', () => {
                setIsLoading(false);
                if (onReadyRef.current) onReadyRef.current();
                if (autoPlay) video.play().catch(() => { });
            });

            hls.on('hlsError', (_: any, data: any) => {
                if (!data.fatal) return;

                if (data.type === 'networkError') {
                    hls.startLoad();
                } else if (data.type === 'mediaError') {
                    hls.recoverMediaError();
                } else {
                    setError('Stream connection lost. Please retry.');
                    setIsLoading(false);
                    hls.destroy();
                }
            });

            // Stall detector: nudge forward if stuck for >3s
            stallInterval = setInterval(() => {
                if (!video.paused && video.readyState < 3) {
                    video.currentTime += 0.1;
                }
            }, 3000);
        };

        // Start with DIRECT URL — no proxy overhead
        loadStream(proxiedSrc);

        return () => {
            if (hls) hls.destroy();
            if (hlsRef.current) hlsRef.current = null;
            if (stallInterval) clearInterval(stallInterval);
        };
    }, [proxiedSrc, autoPlay, muted, retryCount]);

    // Sync muted
    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = muted;
    }, [muted]);

    return (
        <div className={`relative bg-black overflow-hidden ${className}`}>
            <video
                ref={videoRef}
                className="w-full h-full"
                playsInline
                muted={muted}
                controls
            />

            {/* LIVE Badge */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg border border-white/20 shadow-lg pointer-events-none">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-[10px] font-black uppercase text-white tracking-widest">Live</span>
            </div>

            {/* Loading */}
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
                    <div className="relative mb-4">
                        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                        <Radio className="w-4 h-4 text-white absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">Connecting...</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-30 p-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-600 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Stream Unavailable</h3>
                    <p className="text-gray-400 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => setRetryCount(p => p + 1)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all"
                    >
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            )}
        </div>
    );
};

export default HLSPlayer;
