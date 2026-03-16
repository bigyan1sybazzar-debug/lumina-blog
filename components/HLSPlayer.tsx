'use client';
import React, { useEffect, useRef, useState, memo } from 'react';
import Hls from 'hls.js';
import { AlertTriangle, RefreshCw, Loader2, Radio } from 'lucide-react';

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
    const hlsRef = useRef<Hls | null>(null);
    const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    const showLoadingDebounced = () => {
        if (loadingTimerRef.current) return;
        loadingTimerRef.current = setTimeout(() => {
            loadingTimerRef.current = null;
            setIsLoading(true);
        }, 800);
    };

    const cancelLoading = () => {
        if (loadingTimerRef.current) {
            clearTimeout(loadingTimerRef.current);
            loadingTimerRef.current = null;
        }
        setIsLoading(false);
    };

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

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        setError(null);
        setIsLoading(true);

        if (Hls.isSupported()) {
            const hls = new Hls({
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
                    video.play().catch(() => {
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
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            setError('The stream is currently unreachable.');
                            hls.destroy();
                            break;
                    }
                }
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                if (autoPlay) video.play().catch(() => { });
                if (onReadyRef.current) onReadyRef.current();
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
    }, [src, retryCount, autoPlay]);

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
                onWaiting={() => showLoadingDebounced()}
                onPlaying={() => { cancelLoading(); setError(null); }}
                onPause={() => cancelLoading()}
            />

            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10 pointer-events-none">
                    <div className="relative mb-6">
                        <Loader2 className="w-14 h-14 text-red-600 animate-spin" />
                        <Radio className="w-6 h-6 text-white absolute inset-0 m-auto animate-pulse" />
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-20 p-8 text-center backdrop-blur-xl">
                    <AlertTriangle className="w-10 h-10 text-red-600 mb-6" />
                    <h3 className="text-xl font-black text-white mb-2 uppercase italic">Connection Failed</h3>
                    <p className="text-gray-400 text-sm mb-8">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="px-8 py-3.5 bg-red-600 text-white rounded-2xl text-sm font-black transition-all"
                    >
                        RE-CONNECT PLAYER
                    </button>
                </div>
            )}

            <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 px-3 py-1.5 bg-red-600 rounded-lg border border-white/20 shadow-xl pointer-events-none">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-[10px] font-black uppercase text-white tracking-[0.1em]">Live Now</span>
            </div>
        </div>
    );
});

HLSPlayer.displayName = 'HLSPlayer';
export default HLSPlayer;
