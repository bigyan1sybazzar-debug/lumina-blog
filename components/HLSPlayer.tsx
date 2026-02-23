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
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    const proxiedSrc = src.includes('/api/proxy') || src.startsWith('blob:') || src.startsWith('data:')
        ? src
        : `/api/proxy?url=${encodeURIComponent(src)}`;
    const errorRef = useRef<string | null>(null);
    useEffect(() => { errorRef.current = error; }, [error]);

    const onReadyRef = useRef(onReady);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setError(null);
        setIsLoading(true);
    };

    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current) return;

        let player: any = null;

        const initPlayer = async () => {
            try {
                // Dynamically import xgplayer and its HLS plugin
                const { default: Player } = await import('xgplayer');
                const { default: HlsPlugin } = await import('xgplayer-hls');
                // Import default theme
                // @ts-ignore
                await import('xgplayer/dist/index.min.css');

                if (playerRef.current) {
                    playerRef.current.destroy();
                }

                player = new Player({
                    el: containerRef.current!,
                    url: proxiedSrc,
                    isLive: true,
                    autoplay: autoPlay,
                    volume: muted ? 0 : 0.6,
                    width: '100%',
                    height: '100%',
                    playsinline: true,
                    videoAttributes: {
                        'webkit-playsinline': 'true',
                        'x5-playsinline': 'true',
                        'playsinline': 'true',
                        'tabindex': '2',
                        'mediatype': 'video'
                    },
                    plugins: [HlsPlugin],
                    hls: {
                        retryCount: 15,
                        retryDelay: 1000,
                        loadTimeout: 20000,
                        liveSyncDurationCount: 7, // Stable distance from live edge
                        maxBufferLength: 60,      // Constant safety buffer
                        initialLiveManifestSize: 3,
                        bufferBeforePlaying: 5,   // Wait for 5s of data
                        enableWorker: true,
                    },
                    commonStyle: {
                        progressColor: '#dc2626',
                        playedColor: '#dc2626',
                    },
                    ignores: ['playbackrate'],
                });

                playerRef.current = player;

                player.on('complete', () => {
                    setIsLoading(false);
                    setError(null);
                    if (onReadyRef.current) onReadyRef.current();
                });

                player.on('error', (err: any) => {
                    console.warn('[xgplayer] Playback error:', err);
                    // Silently ignore minor errors, only show fatal ones
                    if (err?.code === 4004 || err?.code === 4003) {
                        setError('The stream is currently unreachable.');
                    }
                });

                // The player's internal loading state is sufficient, no need for manual stall detection
                player.on('play', () => {
                    setIsLoading(false);
                    setError(null);
                });

                player.on('pause', () => {
                    setIsLoading(false);
                });

                player.on('waiting', () => {
                    setIsLoading(true);
                });

                player.on('playing', () => {
                    setIsLoading(false);
                    setError(null);
                });

            } catch (err) {
                console.error('Failed to init xgplayer:', err);
                setError('Player initialization failed.');
            }
        };

        initPlayer();

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [proxiedSrc, autoPlay, muted, retryCount, onReady]);

    return (
        <div className={`relative bg-black group transition-all duration-500 rounded-xl overflow-hidden shadow-2xl ${className}`}>
            {/* The xgplayer instance will mount here */}
            <div ref={containerRef} className="w-full h-full" id="mse" />

            {/* Premium Loading Overlay (Custom for branding) */}
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10 pointer-events-none">
                    <div className="relative mb-6">
                        <Loader2 className="w-14 h-14 text-red-600 animate-spin" />
                        <Radio className="w-6 h-6 text-white absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-white text-[10px] font-black tracking-[0.4em] uppercase opacity-80">
                            Synchronizing Stream
                        </span>
                        <div className="flex gap-2">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Overlay with Auto-Reconnect Logic */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-20 p-8 text-center backdrop-blur-xl">
                    <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-600/20 shadow-2xl shadow-red-600/10">
                        <AlertTriangle className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight italic">Connection Failed</h3>
                    <p className="text-gray-400 text-sm mb-8 max-w-xs">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="group flex items-center gap-3 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-2xl shadow-red-600/40"
                    >
                        <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                        RE-CONNECT PLAYER
                    </button>
                </div>
            )}

            {/* Live Indicator (Overlay) */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 px-3 py-1.5 bg-red-600 rounded-lg border border-white/20 shadow-xl pointer-events-none select-none">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-[10px] font-black uppercase text-white tracking-[0.1em]">Live Now</span>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .xgplayer {
                    background-color: transparent !important;
                }
                .xgplayer .xg-inner-controls {
                    background: linear-gradient(to top, rgba(0,0,0,0.9), transparent) !important;
                    height: 60px !important;
                }
                .xgplayer .xgplayer-loading {
                    display: none !important; /* Use our custom loader instead */
                }
                .xgplayer .xgplayer-start {
                    background: rgba(220, 38, 38, 0.9) !important;
                    width: 70px !important;
                    height: 70px !important;
                    border-radius: 50% !important;
                }
                .xgplayer .xgplayer-start svg {
                    width: 30px !important;
                    height: 30px !important;
                }
                .xgplayer .xg-tips {
                    background: rgba(0,0,0,0.8) !important;
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(255,255,255,0.1);
                }
            ` }} />
        </div>
    );
};

export default HLSPlayer;
