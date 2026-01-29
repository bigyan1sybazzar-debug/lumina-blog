'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        google: any;
    }
}

interface IMAAdPlayerProps {
    adTagUrl: string;
    onAdEnded: () => void;
    onAdStarted?: () => void;
    onAdError?: () => void;
}

const IMAAdPlayer: React.FC<IMAAdPlayerProps> = ({ adTagUrl, onAdEnded, onAdStarted, onAdError }) => {
    const adContainerRef = useRef<HTMLDivElement>(null);
    const adsLoaderRef = useRef<any>(null);
    const adsManagerRef = useRef<any>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const loadIMASDK = () => {
            if (window.google && window.google.ima) {
                initializeIMA();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
            script.async = true;
            script.onload = () => {
                initializeIMA();
            };
            document.body.appendChild(script);
        };

        const initializeIMA = () => {
            const adDisplayContainer = new window.google.ima.AdDisplayContainer(
                adContainerRef.current,
                // We can pass a video element here if needed for mobile web
            );

            // Must be called on a user gesture on some mobile devices
            adDisplayContainer.initialize();

            const adsLoader = new window.google.ima.AdsLoader(adDisplayContainer);
            adsLoaderRef.current = adsLoader;

            adsLoader.addEventListener(
                window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
                onAdsManagerLoaded,
                false
            );

            adsLoader.addEventListener(
                window.google.ima.AdErrorEvent.Type.AD_ERROR,
                onAdErrorOccurred,
                false
            );

            const adsRequest = new window.google.ima.AdsRequest();
            adsRequest.adTagUrl = adTagUrl;

            // Specify the linear and nonlinear slot sizes. This helps the SDK to
            // select the correct creative if multiple are returned in the VAST response.
            adsRequest.linearAdSlotWidth = adContainerRef.current?.clientWidth || 640;
            adsRequest.linearAdSlotHeight = adContainerRef.current?.clientHeight || 360;
            adsRequest.nonLinearAdSlotWidth = adContainerRef.current?.clientWidth || 640;
            adsRequest.nonLinearAdSlotHeight = adContainerRef.current?.clientHeight || 360;

            adsLoader.requestAds(adsRequest);
        };

        const onAdsManagerLoaded = (adsManagerLoadedEvent: any) => {
            const adsRenderingSettings = new window.google.ima.AdsRenderingSettings();
            adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

            const adsManager = adsManagerLoadedEvent.getAdsManager(
                {}, // Generic video player object
                adsRenderingSettings
            );
            adsManagerRef.current = adsManager;

            adsManager.addEventListener(window.google.ima.AdErrorEvent.Type.AD_ERROR, onAdErrorOccurred);
            adsManager.addEventListener(window.google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => { });
            adsManager.addEventListener(window.google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onAdEnded);
            adsManager.addEventListener(window.google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdEnded);
            adsManager.addEventListener(window.google.ima.AdEvent.Type.STARTED, onAdStarted || (() => { }));

            try {
                adsManager.init(
                    adContainerRef.current?.clientWidth || 640,
                    adContainerRef.current?.clientHeight || 360,
                    window.google.ima.ViewMode.NORMAL
                );
                adsManager.start();
            } catch (adError) {
                console.error('AdsManager error:', adError);
                onAdEnded();
            }
        };

        const onAdErrorOccurred = (adErrorEvent: any) => {
            console.error('Ad Error:', adErrorEvent.getError());
            if (adsManagerRef.current) {
                adsManagerRef.current.destroy();
            }
            if (onAdError) onAdError();
            onAdEnded();
        };

        loadIMASDK();

        return () => {
            if (adsManagerRef.current) {
                adsManagerRef.current.destroy();
                adsManagerRef.current = null;
            }
        };
    }, [adTagUrl, onAdEnded, onAdStarted, onAdError]);

    return (
        <div
            ref={adContainerRef}
            className="w-full h-full relative bg-black"
            style={{ minHeight: '250px' }}
        />
    );
};

export default IMAAdPlayer;
