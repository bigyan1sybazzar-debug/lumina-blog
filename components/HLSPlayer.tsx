import React, { useEffect, useRef, useState } from 'react';
import 'video.js/dist/video-js.css';
import { AlertTriangle, RefreshCw, Loader2, Radio, Info, Settings } from 'lucide-react';

interface HLSPlayerProps {
    src: string;
    autoPlay?: boolean;
    muted?: boolean;
    className?: string;
    onReady?: (player: any) => void;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({
    src,
    autoPlay = true,
    muted = false,
    className = '',
    onReady
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [debugInfo, setDebugInfo] = useState<string>('');

    const proxiedSrc = src.startsWith('blob:') || src.startsWith('data:') || src.includes('/api/proxy')
        ? src
        : `/api/proxy?url=${encodeURIComponent(src)}`;

    const onReadyRef = useRef(onReady);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let stallTimeout: NodeJS.Timeout | null = null;

        const initPlayer = async () => {
            // Dynamically import all video.js dependencies
            const { default: videojs } = await import('video.js');
            await import('videojs-contrib-quality-levels');
            // @ts-ignore
            await import('videojs-hls-quality-selector');

            if (!playerRef.current && videoRef.current) {
                const useNative = videoRef.current.canPlayType('application/vnd.apple.mpegurl');
                setDebugInfo(useNative ? 'Engine: Hybrid Native' : 'Engine: VHS Core');

                const player: any = playerRef.current = videojs(videoRef.current, {
                    autoplay: autoPlay,
                    controls: true,
                    responsive: true,
                    fluid: true,
                    muted: muted,
                    liveui: true,
                    preload: 'auto',
                    html5: {
                        vhs: {
                            overrideNative: !useNative,
                            enableLowLatency: false,
                            fastQualityChange: false, // Prevent frequent quality jumping
                            backBufferLength: 120,
                            maxBufferLength: 180, // Allow up to 3 mins of total buffer
                            goalBufferLength: 120, // Aim for a steady 2 min buffer
                            bufferLowWaterLine: 30, // Start panic loading if buffer hits < 30s
                        },
                        nativeAudioTracks: useNative,
                        nativeVideoTracks: useNative,
                    }
                }, () => {
                    setIsLoading(false);
                    if (onReadyRef.current) onReadyRef.current(player);
                });

                // Initialize quality selector plugin
                if (typeof player.hlsQualitySelector === 'function') {
                    try {
                        player.hlsQualitySelector({
                            displayCurrentQuality: true,
                        });
                    } catch (e) {
                        console.warn('Quality selector failed to initialize:', e);
                    }
                }

                player.on('error', () => {
                    const err = player.error();
                    setError(err?.message || 'The stream could not be loaded.');
                    setIsLoading(false);
                });

                player.on('waiting', () => {
                    setIsLoading(true);
                    stallTimeout = setTimeout(() => {
                        // Check if still waiting using class check
                        if (player.hasClass('vjs-waiting') && !player.paused()) {
                            player.currentTime(player.currentTime() + 0.1);
                        }
                    }, 4000);
                });

                player.on('playing', () => {
                    setIsLoading(false);
                    if (stallTimeout) clearTimeout(stallTimeout);
                });

                player.on('loadedmetadata', () => setIsLoading(false));
            }

            if (playerRef.current) {
                playerRef.current.src({
                    src: proxiedSrc,
                    type: 'application/x-mpegURL'
                });
            }
        };

        initPlayer();

        return () => {
            if (stallTimeout) clearTimeout(stallTimeout);
        };
    }, [proxiedSrc, autoPlay, muted, retryCount]);

    useEffect(() => {
        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    const handleRetry = () => {
        setError(null);
        setIsLoading(true);
        setRetryCount(prev => prev + 1);
    };

    return (
        <div className={`video-player-container relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 ${className}`}>
            <div data-vjs-player>
                <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered vjs-theme-city"
                    playsInline
                />
            </div>

            {/* Quality Tooltip hint */}
            {!isLoading && !error && (
                <div className="absolute bottom-20 right-6 z-20 pointer-events-none group">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <Settings size={12} className="text-red-500 animate-spin-slow" />
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Quality Toggle Available</span>
                    </div>
                </div>
            )}

            {/* Premium Loading Overlay */}
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-2xl z-20">
                    <div className="relative mb-6 scale-125">
                        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                        <Radio className="w-5 h-5 text-white absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-white text-[10px] font-black tracking-[0.4em] uppercase opacity-70">
                            Buffering 120s Stability
                        </span>
                        <div className="flex gap-2">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Info */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <div className="flex items-center gap-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md border border-white/10 opacity-0 hover:opacity-100 transition-opacity">
                    <Info size={10} className="text-gray-400" />
                    <span className="text-[9px] text-gray-300 font-medium font-mono">{debugInfo}</span>
                </div>
            </div>

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-30 p-10 text-center backdrop-blur-md">
                    <AlertTriangle className="w-12 h-12 text-red-600 mb-6" />
                    <h3 className="text-xl font-black text-white mb-3 uppercase">Connection Problem</h3>
                    <p className="text-gray-400 text-sm mb-8">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="flex items-center gap-3 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-red-600/30"
                    >
                        <RefreshCw size={18} /> RE-CONNECT
                    </button>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .video-js { width: 100%; height: 100%; }
                .vjs-big-play-centered .vjs-big-play-button {
                    background-color: #dc2626 !important;
                    border: none !important;
                    border-radius: 50% !important;
                    width: 80px !important;
                    height: 80px !important;
                    line-height: 80px !important;
                    box-shadow: 0 0 40px rgba(220, 38, 38, 0.4) !important;
                }
                .vjs-control-bar {
                    background: linear-gradient(to top, rgba(0,0,0,0.9), transparent) !important;
                    height: 60px !important;
                }
                .vjs-live-display {
                    background: #dc2626 !important;
                    border-radius: 4px !important;
                    height: 24px !important;
                    line-height: 24px !important;
                    margin-top: 18px !important;
                    font-weight: 900 !important;
                    font-size: 10px !important;
                    padding: 0 8px !important;
                }
                /* Quality Selector Styling */
                .vjs-hls-quality-selector {
                    display: block !important;
                }
                .vjs-menu-button-popup .vjs-menu {
                    background: rgba(0,0,0,0.9) !important;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    bottom: 4em !important;
                }
                .animate-spin-slow { animation: spin 3s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            ` }} />
        </div>
    );
};

export default HLSPlayer;
