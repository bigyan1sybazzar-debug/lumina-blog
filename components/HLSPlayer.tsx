'use client';
import React, { useEffect, useRef, useState, memo } from 'react';
import Hls from 'hls.js';
// Plyr is imported dynamically in useEffect to avoid SSR issues and fix import errors
import 'plyr/dist/plyr.css';
import { AlertTriangle, Loader2, Radio } from 'lucide-react';

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
    const plyrRef = useRef<any>(null);
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

        let hls: Hls | null = null;
        let plyr: any = null;

        const initPlayer = async () => {
            try {
                // Dynamic import to avoid SSR issues and fix potential import errors
                const { default: PlyrJS } = await import('plyr');

                // Cleanup previous instances if they exist
                if (plyrRef.current) plyrRef.current.destroy();
                if (hlsRef.current) hlsRef.current.destroy();

                setError(null);
                setIsLoading(true);

                // Initialize Plyr
                plyr = new PlyrJS(video, {
                    controls: [
                        'play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen', 'settings'
                    ],
                    autoplay: autoPlay,
                    muted: muted,
                    hideControls: true,
                    tooltips: { controls: true, seek: true },
                });
                plyrRef.current = plyr;

                if (Hls.isSupported()) {
                    hls = new Hls({
                        maxMaxBufferLength: 100,
                        maxBufferLength: 30,
                        maxBufferSize: 60 * 1024 * 1024,
                        liveSyncDuration: 3,
                        liveMaxLatencyDuration: 10,
                        enableWorker: true,
                        lowLatencyMode: true,
                    });

                    hlsRef.current = hls;
                    hls.loadSource(src);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        setIsLoading(false);
                        if (autoPlay) {
                            plyr.play().catch(() => {
                                plyr.muted = true;
                                plyr.play().catch(() => { });
                            });
                        }
                        if (onReadyRef.current) onReadyRef.current();
                    });

                    hls.on(Hls.Events.ERROR, (_event, data) => {
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    hls?.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    hls?.recoverMediaError();
                                    break;
                                default:
                                    setError('The live stream is currently offline or unreachable.');
                                    hls?.destroy();
                                    break;
                            }
                        }
                    });

                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = src;
                    video.addEventListener('loadedmetadata', () => {
                        setIsLoading(false);
                        if (autoPlay) plyr.play().catch(() => { });
                        if (onReadyRef.current) onReadyRef.current();
                    }, { once: true });
                } else {
                    setError('HLS playback is not supported on this device.');
                }
            } catch (err) {
                console.error('Plyr initialization failed:', err);
                setError('Failed to initialize the media player.');
            }
        };

        initPlayer();

        return () => {
            if (plyrRef.current) {
                plyrRef.current.destroy();
                plyrRef.current = null;
            }
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [src, retryCount, autoPlay]);

    // Handle updates to muted prop
    useEffect(() => {
        if (plyrRef.current) {
            plyrRef.current.muted = muted;
        }
    }, [muted]);

    return (
        <div className={`relative bg-black group transition-all duration-500 rounded-xl overflow-hidden shadow-2xl ${className} ash-player-container`}>
            {/* Plyr Video Wrapper */}
            <video
                ref={videoRef}
                className="plyr-player w-full h-full"
                playsInline
                crossOrigin="anonymous"
            />

            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-[100] pointer-events-none">
                    <div className="relative mb-6">
                        <Loader2 className="w-14 h-14 text-red-600 animate-spin" />
                        <Radio className="w-6 h-6 text-white absolute inset-0 m-auto animate-pulse" />
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-[110] p-8 text-center backdrop-blur-xl">
                    <AlertTriangle className="w-10 h-10 text-red-600 mb-6" />
                    <h3 className="text-xl font-black text-white mb-2 uppercase italic">Stream Offline</h3>
                    <p className="text-gray-400 text-sm mb-8">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="px-8 py-3.5 bg-red-600 text-white rounded-2xl text-sm font-black transition-all hover:bg-red-700 active:scale-95 shadow-lg shadow-red-600/20"
                    >
                        RE-CONNECT PLAYER
                    </button>
                </div>
            )}

            {/* Live Indicator Over Plyr */}
            <div className="absolute top-4 left-4 z-[90] flex items-center gap-2.5 px-3 py-1.5 bg-red-600/90 rounded-lg border border-white/20 shadow-xl pointer-events-none transition-opacity duration-300 group-hover:opacity-100">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-[10px] font-black uppercase text-white tracking-[0.1em]">Live Now</span>
            </div>

            <style jsx global>{`
                .ash-player-container .plyr {
                    --plyr-color-main: #dc2626; /* Red-600 */
                    height: 100%;
                    width: 100%;
                    background: black;
                }
                .ash-player-container .plyr--video {
                    height: 100% !important;
                }
                .ash-player-container .plyr__video-wrapper {
                    height: 100% !important;
                    background: black !important;
                }
                .ash-player-container video {
                    height: 100% !important;
                    object-fit: contain;
                }
                /* Ensure controls are on top of our overlays if needed */
                .plyr__controls {
                    z-index: 105 !important;
                }
            `}</style>
        </div>
    );
});

HLSPlayer.displayName = 'HLSPlayer';
export default HLSPlayer;
