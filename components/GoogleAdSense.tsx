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
    format,
    layoutKey,
    layout,
    responsive = true,
    style,
    className,
    minHeight,
}) => {
    const adRef = useRef<HTMLModElement>(null);
    const initialized = useRef<string | null>(null);
    const [adStatus, setAdStatus] = useState<'loading' | 'loaded' | 'error' | 'blocked'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        // Prevent double initialization for the same slot
        if (initialized.current === slot) return;

        const timer = setTimeout(() => {
            try {
                if (typeof window === 'undefined') {
                    setAdStatus('error');
                    setErrorMessage('Window is undefined');
                    return;
                }

                // Check if AdSense script is loaded
                if (!window.adsbygoogle) {
                    setAdStatus('blocked');
                    setErrorMessage('AdSense script not loaded. Ad blocker may be active.');
                    console.warn('AdSense script not loaded. Please check if ad blocker is enabled.');
                    return;
                }

                // Check if the ad element exists
                if (!adRef.current) {
                    setAdStatus('error');
                    setErrorMessage('Ad element not found');
                    return;
                }

                // Push the ad
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                initialized.current = slot;

                // Set a timeout to check if ad loaded
                setTimeout(() => {
                    if (adRef.current) {
                        const adFilled = adRef.current.getAttribute('data-ad-status') === 'filled';
                        if (adFilled) {
                            setAdStatus('loaded');
                        } else {
                            // Ad might still be loading or not filled
                            setAdStatus('loaded'); // Assume loaded, Google will handle display
                        }
                    }
                }, 2000);

            } catch (err: any) {
                console.error('AdSense error:', err);
                setAdStatus('error');
                setErrorMessage(err?.message || 'Unknown error occurred');
            }
        }, 500); // 500ms delay for modal/animation stability

        return () => clearTimeout(timer);
    }, [slot]);

    return (
        <div
            className={`ad-container ${className || ''}`}
            style={{
                minHeight: minHeight || '100px',
                display: 'block',
                overflow: 'hidden',
                width: '100%',
                position: 'relative'
            }}
        >
            <ins
                className="adsbygoogle"
                style={{ display: 'block', ...style }}
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
                data-ad-layout-key={layoutKey}
                data-ad-layout={layout}
                ref={adRef}
            />

            {/* Fallback content when ads don't load */}
            {adStatus === 'blocked' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            📢 Ad content unavailable
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {errorMessage}
                        </p>
                    </div>
                </div>
            )}

            {adStatus === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/10 rounded-lg p-4">
                    <div className="text-center">
                        <p className="text-sm text-red-600 dark:text-red-400">
                            ⚠️ Ad loading error
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                            {errorMessage}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoogleAdSense;
