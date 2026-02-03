import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

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
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        setError(null);
        setIsLoading(true);

        const initPlayer = () => {
            if (Hls.isSupported()) {
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                }

                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    manifestLoadingMaxRetry: 2,
                    levelLoadingMaxRetry: 2,
                    xhrSetup: (xhr, url) => {
                        // Skip blobs, data URLs, and already proxied/local URLs
                        if (url.startsWith('blob:') || url.startsWith('data:')) return;

                        const isExternal = url.startsWith('http') &&
                            !url.includes(window.location.host) &&
                            !url.includes('/api/proxy');

                        if (isExternal) {
                            const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
                            xhr.open('GET', proxyUrl, true);
                        }
                    }
                });

                hls.loadSource(src);
                hls.attachMedia(video);
                hlsRef.current = hls;

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setIsLoading(false);
                    if (autoPlay) {
                        video.play().catch(e => {
                            console.log("Autoplay blocked:", e);
                        });
                    }
                    if (onReady) onReady();
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.warn(`HLS Error (${data.type}):`, data.details);

                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                setError('Network error: This stream is unreachable (CORS or Offline).');
                                setIsLoading(false);
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                setError('An error occurred while trying to play this stream.');
                                setIsLoading(false);
                                hls.destroy();
                                break;
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native support (Safari)
                video.src = src;
                video.addEventListener('loadedmetadata', () => {
                    setIsLoading(false);
                    if (autoPlay) {
                        video.play().catch(e => console.log("Autoplay blocked:", e));
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
            }
        };
    }, [src, autoPlay, onReady, retryCount]);

    const handleRetry = () => {
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

            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                    <Loader2 className="w-10 h-10 text-primary-light animate-spin mb-3" />
                    <span className="text-white text-xs font-medium tracking-widest uppercase">Loading Stream...</span>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 z-20 p-6 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-white font-bold mb-2">Streaming Error</h3>
                    <p className="text-gray-400 text-xs mb-6 max-w-[250px]">
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
