import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface GoogleAdSenseProps {
    client?: string;
    slot: string;
    format?: 'auto' | 'fluid' | 'autorelaxed' | 'rectangle';
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

    useEffect(() => {
        // Prevent double initialization for the same slot
        if (initialized.current === slot) return;

        const timer = setTimeout(() => {
            try {
                if (typeof window !== 'undefined' && window.adsbygoogle) {
                    // Push the ad
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    initialized.current = slot;
                }
            } catch (err) {
                console.error('AdSense error:', err);
            }
        }, 500); // 500ms delay for modal/animation stability

        return () => clearTimeout(timer);
    }, [slot]);

    return (
        <div
            className={`ad-container ${className || ''}`}
            style={{ minHeight: minHeight || 'auto' }}
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
        </div>
    );
};

export default GoogleAdSense;
