'use client';
import React, { useEffect, useRef, useState, memo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface HLSPlayerProps {
    src: string;
    autoPlay?: boolean;
    muted?: boolean;
    className?: string;
    onReady?: () => void;
}

const HLSPlayer: React.FC<HLSPlayerProps> = memo(({
    src,
    autoPlay = true,
    muted = false,
    className = '',
    onReady,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<any>(null);
    const plyrRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const onReadyRef = useRef(onReady);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setError(null);
    };

    useEffect(() => {
        // Guard against SSR evaluation
        if (typeof window === 'undefined' || !videoRef.current || !src) return;

        let hlsInstance: any = null;
        let plyrInstance: any = null;

        const cleanup = () => {
            if (hlsInstance) {
                hlsInstance.destroy();
                hlsInstance = null;
            }
            if (plyrInstance) {
                plyrInstance.destroy();
                plyrInstance = null;
            }
        };

        const init = async () => {
            try {
                // EXTREMELY SAFE: Dynamic imports with fallback for default/namespace mismatch
                const [HlsModule, PlyrModule] = await Promise.all([
                    import('hls.js'),
                    import('plyr'),
                ]);

                // Get constructors safely
                const Hls = (HlsModule as any).default || HlsModule;
                const Plyr = (PlyrModule as any).default || PlyrModule;

                // Inject CSS via JS to be 100% sure it's client-side only and doesn't break bundler
                if (!document.getElementById('plyr-css')) {
                    const link = document.createElement('link');
                    link.id = 'plyr-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
                    document.head.appendChild(link);
                }

                const video = videoRef.current!;

                const initPlyrInternal = (availableQualities?: number[], hls?: any) => {
                    const plyrOptions: any = {
                        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
                        settings: ['quality', 'speed'],
                        autoplay: autoPlay,
                        muted: muted,
                    };

                    if (availableQualities && availableQualities.length > 0 && hls) {
                        const uniqueQualities = Array.from(new Set(availableQualities)).sort((a: number, b: number) => b - a);
                        plyrOptions.quality = {
                            default: uniqueQualities[0],
                            options: uniqueQualities,
                            forced: true,
                            onChange: (e: number) => {
                                hls.levels.forEach((level: any, levelIndex: number) => {
                                    if (level.height === e) {
                                        hls.currentLevel = levelIndex;
                                    }
                                });
                            }
                        };
                    }

                    // Constructor check
                    if (typeof Plyr === 'function') {
                        plyrInstance = new Plyr(video, plyrOptions);
                        plyrRef.current = plyrInstance;
                    } else if ((Plyr as any).setup) {
                        // Fallback for some versions or bundles
                        (Plyr as any).setup(video, plyrOptions);
                    }
                };

                if (Hls && Hls.isSupported && Hls.isSupported()) {
                    hlsInstance = new Hls({
                        maxMaxBufferLength: 100,
                        maxBufferLength: 30,
                        maxBufferSize: 60 * 1024 * 1024,
                        liveSyncDuration: 3,
                        liveMaxLatencyDuration: 10,
                        enableWorker: true,
                        lowLatencyMode: true,
                    });

                    hlsRef.current = hlsInstance;
                    hlsInstance.loadSource(src);
                    hlsInstance.attachMedia(video);

                    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                        const qualities = hlsInstance.levels.map((level: any) => level.height);
                        initPlyrInternal(qualities, hlsInstance);
                        if (autoPlay) {
                            video.play().catch(() => {
                                video.muted = true;
                                video.play().catch(() => { });
                            });
                        }
                        if (onReadyRef.current) onReadyRef.current();
                    });

                    hlsInstance.on(Hls.Events.ERROR, (_: any, data: any) => {
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    hlsInstance?.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    hlsInstance?.recoverMediaError();
                                    break;
                                default:
                                    setError('The stream is currently unreachable.');
                                    hlsInstance?.destroy();
                                    break;
                            }
                        }
                    });

                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = src;
                    video.addEventListener('loadedmetadata', () => {
                        initPlyrInternal();
                        if (autoPlay) video.play().catch(() => { });
                        if (onReadyRef.current) onReadyRef.current();
                    }, { once: true });
                    video.addEventListener('error', () => {
                        setError('The stream is currently unreachable.');
                    }, { once: true });
                } else {
                    setError('Streaming is not supported in this browser.');
                }
            } catch (err) {
                console.error('Player Init Error:', err);
                setError('Failed to load video player.');
            }
        };

        init();

        return () => {
            cleanup();
        };
    }, [src, retryCount]);

    useEffect(() => {
        if (plyrRef.current) plyrRef.current.muted = muted;
        else if (videoRef.current) videoRef.current.muted = muted;
    }, [muted]);

    return (
        <div className={`relative bg-black group rounded-xl overflow-hidden shadow-2xl ${className} [&_.plyr]:h-full [&_.plyr]:w-full [&_video]:object-cover min-h-[200px]`}>
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                crossOrigin="anonymous"
                muted={muted}
            />

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-40 p-8 text-center backdrop-blur-xl">
                    <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-600/20 shadow-2xl">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 uppercase italic tracking-tight">Connection Failed</h3>
                    <p className="text-gray-400 text-sm mb-8">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="flex items-center gap-3 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-black transition-all active:scale-95"
                    >
                        <RefreshCw size={18} /> RE-CONNECT PLAYER
                    </button>
                </div>
            )}

            <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg border border-white/20 select-none shadow-lg">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-[10px] font-black uppercase text-white tracking-widest">Live Now</span>
            </div>
        </div>
    );
});

export default HLSPlayer;
