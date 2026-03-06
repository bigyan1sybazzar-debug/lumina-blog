import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface GoogleAdSenseProps {
    client?: string;
    slot: string;
    format?: 'auto' | 'fluid' | 'autorelaxed' | 'rectangle' | 'horizontal' | 'vertical';
    layoutKey?: string;
    layout?: 'in-article';
    responsive?: boolean;
    style?: React.CSSProperties;
    className?: string;
    minHeight?: string | number;
}

const GoogleAdSense: React.FC<GoogleAdSenseProps> = ({
    client = 'ca-pub-8714969386201280',
    slot,
    format = 'auto',
    layoutKey,
    layout,
    responsive = true,
    style,
    className,
    minHeight = '100px',
}) => {
    const adRef = useRef<HTMLModElement>(null);
    const [adStatus, setAdStatus] = useState<'loading' | 'loaded' | 'error' | 'blocked' | 'empty'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const pushAttempted = useRef(false);

    useEffect(() => {
        // We only want to push ONCE per mount of this component
        if (pushAttempted.current) return;

        const initAd = () => {
            try {
                if (typeof window === 'undefined') return;

                // Ensure the Google script is available
                if (!window.adsbygoogle) {
                    console.warn('AdSense: adsbygoogle script not detected');
                    setAdStatus('blocked');
                    return;
                }

                // Push the ad
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                pushAttempted.current = true;
                setAdStatus('loaded');

                // Optional: Check 5 seconds later if it was actually filled
                setTimeout(() => {
                    if (adRef.current) {
                        const status = adRef.current.getAttribute('data-ad-status');
                        if (status === 'unfilled') {
                            setAdStatus('empty');
                        }
                    }
                }, 5000);

            } catch (err: any) {
                console.error('AdSense Push Error:', err);
                setAdStatus('error');
                setErrorMessage(err?.message || 'Push failed');
            }
        };

        // Delay slightly to allow the DOM to settle
        const timer = setTimeout(initAd, 300);
        return () => clearTimeout(timer);
    }, [slot]); // Re-run if slot changes (though usually component remounts anyway)

    return (
        <div
            className={`adsense-wrapper ${className || ''}`}
            style={{
                minHeight: minHeight,
                width: '100%',
                display: 'block',
                overflow: 'hidden',
                clear: 'both',
                ...style
            }}
        >
            <ins
                className="adsbygoogle"
                style={{
                    display: 'block',
                    width: '100%',
                    minHeight: minHeight,
                    ...style
                }}
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? 'true' : 'false'}
                {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
                {...(layout ? { 'data-ad-layout': layout } : {})}
                ref={adRef}
            />

            {/* Debug/Fallback Info (Hidden by default, visible if blocked/empty) */}
            {adStatus === 'blocked' && (
                <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-xl" style={{ minHeight }}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                        Ads Blocked or Script Slow
                    </p>
                </div>
            )}

            {adStatus === 'empty' && (
                <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-xl" style={{ minHeight }}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                        Seeking Best Ad Placement...
                    </p>
                </div>
            )}
        </div>
    );
};

export default React.memo(GoogleAdSense);
