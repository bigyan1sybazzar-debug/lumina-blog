'use client';
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertTriangle, RefreshCw, Loader2, Radio } from 'lucide-react';

interface HLSPlayerProps {
    src: string;
    autoPlay?: boolean;
    muted?: boolean;
    className?: string;
    onReady?: () => void;
}

/**
 * Turn any external URL into a /api/proxy?url=...&ref=... URL.
 * This ensures EVERY request (manifest, sub-manifest, and segment)
 * goes through our server proxy, which sets the correct Origin/Referer
 * headers that CDNs require.
 */
function toProxyUrl(url: string): string {
    if (!url) return url;
    url = url.trim();
    // Already a local/proxied URL — leave it alone
    if (url.startsWith('/') || url.includes('/api/proxy')) return url;

    try {
        const parsed = new URL(url);
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
        // Carry the CDN origin as `ref` so the server proxy uses it as Referer
        return `${proxyUrl}&ref=${encodeURIComponent(parsed.origin)}`;
    } catch {
        return url;
    }
}

/**
 * Build a custom hls.js loader that intercepts EVERY network request
 * before it fires and rewrites the URL through our proxy.
 *
 * This is the core fix for cross-CDN streams like live.inplyr.com →
 * pull.niues.live: xgplayer was fetching absolute segment URLs directly
 * from the CDN (bypassing the proxy), causing CORS failures. hls.js
 * custom loaders intercept at the XHR/fetch level, so nothing escapes.
 */
function buildProxyLoader(HlsLib: typeof Hls) {
    const DefaultLoader = HlsLib.DefaultConfig.loader as any;

    return class ProxyLoader extends DefaultLoader {
        constructor(config: any) {
            super(config);
        }

        load(context: any, config: any, callbacks: any) {
            context.url = toProxyUrl(context.url);
            super.load(context, config, callbacks);
        }
    };
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({
    src,
    autoPlay = true,
    muted = false,
    className = '',
    onReady,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    const onReadyRef = useRef(onReady);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setError(null);
        setIsLoading(true);
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        // Destroy any existing hls.js instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        setError(null);
        setIsLoading(true);

        const proxiedSrc = toProxyUrl(src);

        if (Hls.isSupported()) {
            const hls = new Hls({
                // Custom loader: EVERY request (manifest + segment) goes via /api/proxy
                loader: buildProxyLoader(Hls) as any,

                // Live stream config
                liveSyncDurationCount: 3,
                liveMaxLatencyDurationCount: 10,
                maxBufferLength: 60,
                maxMaxBufferLength: 120,
                enableWorker: true,
                lowLatencyMode: false,

                // Retry config
                fragLoadingMaxRetry: 6,
                manifestLoadingMaxRetry: 4,
                levelLoadingMaxRetry: 4,
                fragLoadingRetryDelay: 1000,
                manifestLoadingRetryDelay: 1000,
            });

            hlsRef.current = hls;
            hls.loadSource(proxiedSrc);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                if (autoPlay) {
                    video.play().catch(() => {
                        // Autoplay blocked by browser — mute and retry
                        video.muted = true;
                        video.play().catch(() => { });
                    });
                }
                if (onReadyRef.current) onReadyRef.current();
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.warn('[hls.js] Network error, recovering...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.warn('[hls.js] Media error, recovering...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.error('[hls.js] Fatal error:', data);
                            setError('The stream is currently unreachable.');
                            hls.destroy();
                            break;
                    }
                }
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari: native HLS support — still proxy the src
            video.src = proxiedSrc;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                if (autoPlay) video.play().catch(() => { });
                if (onReadyRef.current) onReadyRef.current();
            }, { once: true });
            video.addEventListener('error', () => {
                setError('The stream is currently unreachable.');
            }, { once: true });
        } else {
            setError('HLS is not supported in this browser.');
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [src, autoPlay, muted, retryCount]);

    // Sync muted state without recreating the player
    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = muted;
    }, [muted]);

    return (
        <div className={`relative bg-black group transition-all duration-500 rounded-xl overflow-hidden shadow-2xl ${className}`}>
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted={muted}
                controls={false}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => { setIsLoading(false); setError(null); }}
                onPause={() => setIsLoading(false)}
            />

            {/* Premium Loading Overlay */}
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

            {/* Error Overlay */}
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

            {/* Live Indicator */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 px-3 py-1.5 bg-red-600 rounded-lg border border-white/20 shadow-xl pointer-events-none select-none">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-[10px] font-black uppercase text-white tracking-[0.1em]">Live Now</span>
            </div>
        </div>
    );
};

export default HLSPlayer;
