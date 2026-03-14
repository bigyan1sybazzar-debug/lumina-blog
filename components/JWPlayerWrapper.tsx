'use client';
import React, { useEffect, useRef, useState, memo } from 'react';
import { AlertTriangle, RefreshCw, Loader2, Radio } from 'lucide-react';

// ---------------------------------------------------------------------------
// JW Player CDN script URL.
// The key below is the FREE / "demo" cloud key provided by JWX for evaluation.
// Replace it with your own library URL from https://dashboard.jwplayer.com
// if you have a paid account, e.g. "https://cdn.jwplayer.com/libraries/YOUR_KEY.js"
// ---------------------------------------------------------------------------
const JW_PLAYER_CDN = 'https://cdn.jwplayer.com/libraries/SABBzBqc.js';

let scriptLoaded = false;
let scriptLoading = false;
const scriptCallbacks: Array<() => void> = [];

function loadJWScript(onReady: () => void) {
    if (scriptLoaded) { onReady(); return; }
    scriptCallbacks.push(onReady);
    if (scriptLoading) return;
    scriptLoading = true;

    const script = document.createElement('script');
    script.src = JW_PLAYER_CDN;
    script.async = true;
    script.onload = () => {
        scriptLoaded = true;
        scriptLoading = false;
        scriptCallbacks.forEach(cb => cb());
        scriptCallbacks.length = 0;
    };
    script.onerror = () => {
        scriptLoaded = false;
        scriptLoading = false;
        scriptCallbacks.forEach(cb => cb()); // trigger anyway — will show error
        scriptCallbacks.length = 0;
    };
    document.head.appendChild(script);
}

interface JWPlayerWrapperProps {
    src: string;
    autoPlay?: boolean;
    muted?: boolean;
    className?: string;
    onReady?: () => void;
    /** Title shown in the player's header bar */
    title?: string;
}

declare global {
    interface Window {
        jwplayer?: any;
    }
}

let instanceCounter = 0;

const JWPlayerWrapper: React.FC<JWPlayerWrapperProps> = memo(({
    src,
    autoPlay = true,
    muted = false,
    className = '',
    onReady,
    title,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const instanceId = useRef(`jw-player-${++instanceCounter}`);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    const onReadyRef = useRef(onReady);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

    const destroyPlayer = () => {
        try {
            if (playerRef.current) {
                playerRef.current.remove();
                playerRef.current = null;
            }
        } catch (_) { /* ignore */ }
    };

    const handleRetry = () => {
        setError(null);
        setIsLoading(true);
        setRetryKey(k => k + 1);
    };

    useEffect(() => {
        if (!src) return;
        setIsLoading(true);
        setError(null);

        loadJWScript(() => {
            if (!window.jwplayer) {
                setError('JW Player failed to load. Check your network or CDN key.');
                setIsLoading(false);
                return;
            }

            // Make sure the container still exists (component might have unmounted)
            if (!containerRef.current) return;

            destroyPlayer();

            // Assign a fresh unique id so jwplayer can find the DOM node
            const id = instanceId.current;
            containerRef.current.id = id;

            try {
                const isHLS = src.toLowerCase().includes('.m3u8');
                const isDASH = src.toLowerCase().includes('.mpd');

                const sources: any[] = [{ file: src }];

                const player = window.jwplayer(id).setup({
                    sources,
                    autostart: autoPlay,
                    mute: muted,
                    stretching: 'fill',
                    width: '100%',
                    height: '100%',
                    controls: true,
                    displaytitle: false,
                    primary: 'html5',
                    // HLS / DASH native via jwplayer
                    hlshtml: true,
                    skin: {
                        name: 'six',
                    },
                    // Color theming to match the site's red accent
                    skinConfig: {
                        controlbar: {
                            background: 'rgba(0,0,0,0.75)',
                            iconsActive: '#ef4444',
                            icons: '#ffffff',
                        },
                    },
                    // Live stream config
                    liveTimeout: 0,
                });

                playerRef.current = player;

                player.on('ready', () => {
                    setIsLoading(false);
                    if (onReadyRef.current) onReadyRef.current();
                });

                player.on('firstFrame', () => {
                    setIsLoading(false);
                    setError(null);
                });

                player.on('error', (e: any) => {
                    console.error('[JWPlayer] Error:', e);
                    const code = e?.code || '';
                    // Error 232011 = network error (often geo-blocked or CORS)
                    // Error 232000 = stream not available
                    if (String(code).startsWith('23')) {
                        setError('Stream unavailable. The source may be geo-blocked or offline.');
                    } else {
                        setError('Playback error. Please refresh or try another channel.');
                    }
                    setIsLoading(false);
                });

                player.on('setupError', (e: any) => {
                    console.error('[JWPlayer] Setup error:', e);
                    setError('Player setup failed. Try refreshing the page.');
                    setIsLoading(false);
                });

                player.on('bufferFull', () => setIsLoading(false));
                player.on('play', () => { setIsLoading(false); setError(null); });
                player.on('buffer', () => setIsLoading(true));

            } catch (err: any) {
                console.error('[JWPlayer] Init error:', err);
                setError('Could not initialise the player.');
                setIsLoading(false);
            }
        });

        return destroyPlayer;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, retryKey]);

    // Sync muted without reinitialising
    useEffect(() => {
        try { playerRef.current?.setMute(muted); } catch (_) { }
    }, [muted]);

    return (
        <div className={`relative bg-black group transition-all duration-500 rounded-xl overflow-hidden shadow-2xl ${className}`}>
            {/* JW Player mounts inside this div */}
            <div ref={containerRef} className="w-full h-full" />

            {/* Premium Loading Overlay */}
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-10 pointer-events-none">
                    <div className="relative mb-6">
                        <Loader2 className="w-14 h-14 text-red-600 animate-spin" />
                        <Radio className="w-6 h-6 text-white absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-white text-[10px] font-black tracking-[0.4em] uppercase opacity-80">
                            Loading Stream
                        </span>
                        <div className="flex gap-2">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" />
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
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight italic">
                        Connection Failed
                    </h3>
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
            <div className="absolute top-4 left-4 z-30 flex items-center gap-2.5 px-3 py-1.5 bg-red-600 rounded-lg border border-white/20 shadow-xl pointer-events-none select-none">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <span className="text-[10px] font-black uppercase text-white tracking-[0.1em]">Live Now</span>
            </div>
        </div>
    );
});

JWPlayerWrapper.displayName = 'JWPlayerWrapper';
export default JWPlayerWrapper;
