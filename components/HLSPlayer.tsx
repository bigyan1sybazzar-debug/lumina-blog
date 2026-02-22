import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
    AlertTriangle, RefreshCw, Loader2, CheckCircle, Radio,
    Play, Pause, Volume2, Volume1, VolumeX, Maximize
} from 'lucide-react';

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
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(muted);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(false);
    const [liveGap, setLiveGap] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

    // Always proxy the src through our server to avoid CORS issues
    const proxiedSrc = src.startsWith('blob:') || src.startsWith('data:') || src.includes('/api/proxy')
        ? src
        : `/api/proxy?url=${encodeURIComponent(src)}`;

    const onReadyRef = useRef(onReady);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        setError(null);
        setIsLoading(true);
        setIsLive(false);

        let hls: Hls | null = null;
        let stallCheckInterval: NodeJS.Timeout | null = null;

        const initPlayer = () => {
            if (Hls.isSupported()) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    maxBufferLength: 120,
                    maxMaxBufferLength: 240,
                    maxBufferSize: 250 * 1000 * 1000,
                    maxBufferHole: 0.5,
                    liveSyncDurationCount: 3,
                    liveMaxLatencyDurationCount: 8,
                    manifestLoadingMaxRetry: 10,
                    manifestLoadingRetryDelay: 2000,
                    levelLoadingMaxRetry: 10,
                    levelLoadingRetryDelay: 2000,
                    fragLoadingMaxRetry: 10,
                    fragLoadingRetryDelay: 1000,
                });

                hls.loadSource(proxiedSrc);
                hls.attachMedia(video);
                hlsRef.current = hls;

                stallCheckInterval = setInterval(() => {
                    if (video.paused || video.ended) return;
                    if (video.readyState < 3 && !isLoading) {
                        video.currentTime += 0.5;
                    }
                    if (isLive && hls && hls.liveSyncPosition) {
                        const gap = hls.liveSyncPosition - video.currentTime;
                        setLiveGap(Math.floor(gap));
                        if (gap > 20) {
                            video.currentTime = hls.liveSyncPosition - 3;
                        }
                    }
                }, 2000);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setIsLoading(false);
                    setIsLive(true);
                    if (autoPlay) {
                        video.play().catch(() => setIsPlaying(false));
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
                                setError('Connection lost. Source might be offline.');
                                setIsLoading(false);
                                hls?.destroy();
                                break;
                        }
                    }
                });

                hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
                    if (data.details?.live) setIsLive(true);
                });

            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = proxiedSrc;
                const handleMetadata = () => {
                    setIsLoading(false);
                    setIsLive(true);
                    if (autoPlay) video.play().catch(() => setIsPlaying(false));
                    if (onReadyRef.current) onReadyRef.current();
                };
                video.addEventListener('loadedmetadata', handleMetadata);
                video.addEventListener('error', () => {
                    setError('Stream incompatible or offline.');
                    setIsLoading(false);
                });
                return () => video.removeEventListener('loadedmetadata', handleMetadata);
            }
        };

        const cleanupResult = initPlayer();

        return () => {
            if (hls) hls.destroy();
            if (stallCheckInterval) clearInterval(stallCheckInterval);
            if (typeof cleanupResult === 'function') cleanupResult();
        };
    }, [proxiedSrc, autoPlay, retryCount]);

    const togglePlay = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const toggleMute = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!videoRef.current) return;
        const newMute = !isMuted;
        videoRef.current.muted = newMute;
        setIsMuted(newMute);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const val = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
        }
        setVolume(val);
        setIsMuted(val === 0);
    };

    const toggleFullscreen = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!containerRef.current) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else containerRef.current.requestFullscreen();
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    };

    const jumpToLive = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hlsRef.current?.liveSyncPosition && videoRef.current) {
            videoRef.current.currentTime = hlsRef.current.liveSyncPosition - 1;
        }
    };

    const handleRetry = () => {
        setError(null);
        setIsLoading(true);
        setRetryCount(prev => prev + 1);
    };

    return (
        <div
            ref={containerRef}
            className={`relative group bg-black overflow-hidden select-none ${className} rounded-xl`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setShowControls(false)}
        >
            <video
                ref={videoRef}
                className="w-full h-full cursor-pointer"
                playsInline
                onClick={() => togglePlay()}
                onContextMenu={(e) => e.preventDefault()}
            />

            {/* Premium Control Overlay */}
            <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-black/90 via-transparent to-black/20 ${showControls || !isPlaying || isLoading ? 'opacity-100' : 'opacity-0'}`}>

                {/* Top Info Bar */}
                <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start pointer-events-auto">
                    {isLive && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase text-white tracking-[0.15em]">Live Now</span>
                            </div>
                            {liveGap > 5 && (
                                <button
                                    onClick={jumpToLive}
                                    className="text-[9px] font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-md border border-white/10 transition-all active:scale-95"
                                >
                                    SYNC TO LIVE ({liveGap}s behind)
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Center Play/Pause Button (Large) */}
                {!isPlaying && !isLoading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                        <button onClick={() => togglePlay()} className="w-20 h-20 bg-red-600/90 hover:bg-red-600 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl shadow-red-600/40 transition-all hover:scale-110 active:scale-90 group/play">
                            <Play fill="white" className="w-8 h-8 text-white ml-1 group-hover/play:scale-110 transition-transform" />
                        </button>
                    </div>
                )}

                {/* Bottom Control Bar */}
                <div className="absolute bottom-0 inset-x-0 p-5 lg:p-7 pointer-events-auto">
                    <div className="flex items-center justify-between gap-6">
                        {/* Left Controls */}
                        <div className="flex items-center gap-5 lg:gap-8">
                            <button onClick={() => togglePlay()} className="text-white hover:text-red-500 transition-all transform active:scale-75">
                                {isPlaying ? <Pause size={26} fill="white" /> : <Play size={26} fill="white" />}
                            </button>

                            <div className="flex items-center gap-3 group/volume">
                                <button onClick={() => toggleMute()} className="text-white hover:text-red-500 transition-colors">
                                    {isMuted || volume === 0 ? <VolumeX size={22} /> : volume < 0.5 ? <Volume1 size={22} /> : <Volume2 size={22} />}
                                </button>
                                <input
                                    type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-0 group-hover/volume:w-24 transition-all duration-500 accent-red-600 cursor-pointer h-1 rounded-full bg-white/20"
                                />
                            </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-5">
                            <button onClick={() => toggleFullscreen()} className="text-white hover:text-red-500 transition-all transform active:scale-75">
                                <Maximize size={22} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading / Stall UI */}
            {(isLoading || (videoRef.current && videoRef.current.readyState < 3 && isPlaying)) && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[3px] z-10 transition-all duration-700">
                    <div className="relative mb-5 scale-125">
                        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                        <Radio className="w-5 h-5 text-white absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-white text-[10px] font-black tracking-[0.3em] uppercase opacity-80">Smooth-Sync Active</span>
                        <div className="flex gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-30 p-8 text-center">
                    <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-600/20">
                        <AlertTriangle className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Stream Connection Lost</h3>
                    <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed font-medium">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="group flex items-center gap-3 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-2xl shadow-red-600/40"
                    >
                        <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                        RE-CONNECT NOW
                    </button>
                </div>
            )}
        </div>
    );
};

export default HLSPlayer;
