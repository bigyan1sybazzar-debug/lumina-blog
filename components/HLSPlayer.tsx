import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertTriangle, RefreshCw, Loader2, CheckCircle, Radio } from 'lucide-react';

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
    const hlsRef = useRef<Hls | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Always proxy the src through our server to avoid CORS issues
    const proxiedSrc = src.startsWith('blob:') || src.startsWith('data:') || src.includes('/api/proxy')
        ? src
        : `/api/proxy?url=${encodeURIComponent(src)}`;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        setError(null);
        setIsLoading(true);
        setIsLive(false);

        const initPlayer = () => {
            if (Hls.isSupported()) {
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                }

                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    // Ultra-robust buffer settings for live web stability (4 mins)
                    backBufferLength: 90,
                    maxBufferLength: 120,
                    maxMaxBufferLength: 240,
                    maxBufferSize: 200 * 1000 * 1000, // 200 MB
                    maxBufferHole: 0.5,
                    // Aggressive retry strategy for unreliable streams
                    manifestLoadingMaxRetry: 5,
                    manifestLoadingRetryDelay: 1000,
                    manifestLoadingMaxRetryTimeout: 15000,
                    levelLoadingMaxRetry: 5,
                    levelLoadingRetryDelay: 1000,
                    levelLoadingMaxRetryTimeout: 15000,
                    fragLoadingMaxRetry: 6,
                    fragLoadingRetryDelay: 1000,
                    // Since we proxy all URLs in the m3u8, no need to re-proxy in xhrSetup
                    // (all segment URLs in the playlist already point to /api/proxy)
                });

                hls.loadSource(proxiedSrc);
                hls.attachMedia(video);
                hlsRef.current = hls;

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setIsLoading(false);
                    // Treat as live by default since all our streams are live m3u8
                    setIsLive(true);
                    if (autoPlay) {
                        video.play().catch(e => {
                            console.log('Autoplay blocked, user interaction needed:', e);
                        });
                    }
                    if (onReady) onReady();
                });

                hls.on(Hls.Events.ERROR, (_event, data) => {
                    console.warn(`HLS Error (${data.type}):`, data.details, data);

                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                // Try to recover first
                                console.warn('Fatal network error, trying to recover...');
                                hls.startLoad();
                                // Only show error after some time if recovery fails
                                setTimeout(() => {
                                    if (hls && hlsRef.current === hls) {
                                        setError('Network error: Stream is unreachable or offline. Try refreshing.');
                                        setIsLoading(false);
                                    }
                                }, 8000);
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.warn('Fatal media error, trying to recover...');
                                hls.recoverMediaError();
                                break;
                            default:
                                setError('An error occurred while loading this stream.');
                                setIsLoading(false);
                                hls.destroy();
                                break;
                        }
                    }
                });

                // Detect live stream from level details
                hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
                    if (data.details?.live) setIsLive(true);
                });

            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari / iOS)
                video.src = proxiedSrc;
                video.addEventListener('loadedmetadata', () => {
                    setIsLoading(false);
                    // Safari can't reliably detect live, assume true for .m3u8
                    setIsLive(true);
                    if (autoPlay) {
                        video.play().catch(e => console.log('Autoplay blocked:', e));
                    }
                    if (onReady) onReady();
                });
                video.addEventListener('error', () => {
                    setError('This stream is incompatible with your browser or currently offline.');
                    setIsLoading(false);
                });
            } else {
                setError('Your browser does not support HLS playback.');
                setIsLoading(false);
            }
        };

        initPlayer();

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [proxiedSrc, autoPlay, retryCount]);

    // Sync muted state to video element
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = muted;
        }
    }, [muted]);

    const handleRetry = () => {
        setError(null);
        setIsLoading(true);
        setRetryCount(prev => prev + 1);
    };

    return (
        <div className={`relative group bg-black overflow-hidden ${className}`}>
            <video
                ref={videoRef}
                className="w-full h-full"
                controls
                playsInline
                muted={muted}
            />

            {/* Live Now indicator */}
            {isLive && !isLoading && !error && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 backdrop-blur-sm rounded-full shadow-lg z-20 pointer-events-none">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    <CheckCircle size={10} className="text-white" fill="white" />
                    <span className="text-white text-[9px] font-black uppercase tracking-wider">Live Now</span>
                </div>
            )}

            {/* Loading overlay */}
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
                    <div className="relative mb-3">
                        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                        <Radio className="w-4 h-4 text-white absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <span className="text-white text-xs font-bold tracking-widest uppercase">Connecting to Stream...</span>
                    <span className="text-gray-400 text-[10px] mt-1">Please wait a moment</span>
                </div>
            )}

            {/* Error overlay */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/95 z-20 p-6 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-white font-bold mb-2">Stream Unavailable</h3>
                    <p className="text-gray-400 text-xs mb-6 max-w-[260px] leading-relaxed">
                        {error}
                    </p>
                    <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-red-600/20"
                    >
                        <RefreshCw size={14} />
                        Retry Connection
                    </button>
                </div>
            )}
        </div>
    );
};

export default HLSPlayer;
