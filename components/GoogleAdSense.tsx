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
}) => {
    const adRef = useRef<HTMLModElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        // Prevent double initialization in React Strict Mode or fast navigation
        if (initialized.current) return;

        try {
            if (typeof window !== 'undefined') {
                // Push the ad
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                initialized.current = true;
            }
        } catch (err) {
            console.error('AdSense error:', err);
        }
    }, []);

    return (
        <div className={`ad-container ${className || ''} my-4 overflow-hidden`}>
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
