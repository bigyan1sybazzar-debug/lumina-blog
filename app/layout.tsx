import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { Providers } from '../components/Providers';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Analytics } from '../components/Analytics';
import FriendsSidebar from '../components/FriendsSidebar';
import Script from 'next/script';

export const revalidate = 3600; // revalidate every hour by default

export const viewport: Viewport = {
    themeColor: '#1C64F2',
    width: 'device-width',
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL('https://bigyann.com.np'),
    title: {
        default: 'AI Powered Tech and Science - Bigyann | Reviews & Discussions',
        template: '%s | Bigyann'
    },
    description: 'AI powered Articles, Reviews & Discussions on latest tech, design, and AI technology. Explore Articles.',
    keywords: ['Technology', 'AI', 'Artificial Intelligence', 'Gadgets', 'Mobile Prices', 'Nepal', 'Tech News', 'Science', 'Reviews'],
    authors: [{ name: 'Bigyann' }],
    creator: 'Bigyann',
    publisher: 'Bigyann',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
        ],
        apple: [
            { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://bigyann.com.np',
        siteName: 'Bigyann',
        title: 'AI Powered Tech and Science - Bigyann',
        description: 'AI powered Articles, Reviews & Discussions on latest tech, design, and AI technology. Explore Articles.',
        images: [
            {
                url: 'https://bigyann.com.np/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Bigyann',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AI Powered Tech and Science - Bigyann',
        description: 'AI powered Articles, Reviews & Discussions on latest tech, design, and AI technology. Explore Articles.',
        creator: '@bigyann',
        images: ['https://bigyann.com.np/og-image.png'],
    },
    alternates: {
        canonical: './',
    },
    verification: {
        google: 'your-google-verification-code', // Placeholder if needed
        other: {
            'msvalidate.01': '79CB5F780A824FA1F4111194F951AFB0',
            'google-adsense-account': 'ca-pub-8714969386201280',
            'p:domain_verify': '7280609cf59660b956d57e7a41374ad6',
        },
    },
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const merriweather = Merriweather({
    weight: ['300', '400', '700', '900'],
    subsets: ['latin'],
    variable: '--font-merriweather',
    display: 'swap'
});

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Bigyann",
        "url": "https://bigyann.com.np/",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://bigyann.com.np/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
            <body className="flex flex-col min-h-screen">
                <Providers>
                    <Header />
                    <FriendsSidebar />
                    <Suspense fallback={null}>
                        <Analytics />
                    </Suspense>
                    <Script src="https://js.puter.com/v2/" strategy="lazyOnload" />
                    <Script
                        id="json-ld"
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                    />
                    <Script id="chunk-error-handler" strategy="beforeInteractive" dangerouslySetInnerHTML={{
                        __html: `
                        (function() {
                            function cacheBustReload() {
                                var key = 'last_chunk_reload';
                                var now = Date.now();
                                var last = parseInt(sessionStorage.getItem(key) || '0');
                                // Only reload once every 15 seconds to prevent loops
                                if (now - last > 15000) {
                                    sessionStorage.setItem(key, now.toString());
                                    // Cache-busting: append timestamp to force fresh asset fetch
                                    var url = window.location.href.split('?')[0].split('#')[0];
                                    window.location.replace(url + '?v=' + now);
                                }
                            }
                            // Catch synchronous script errors (e.g. failed chunk parse)
                            window.addEventListener('error', function(e) {
                                // Skip noise errors
                                if (e && e.message && e.message.toLowerCase().includes('connection closed')) {
                                    return;
                                }

                                if (e && e.message && (
                                    e.message.toLowerCase().includes('chunk') ||
                                    e.message.toLowerCase().includes('failed to load') ||
                                    e.message.toLowerCase().includes('loading css chunk')
                                )) {
                                    cacheBustReload();
                                }
                            }, true);
                            // Catch dynamic import() failures (most common cause)
                            window.addEventListener('unhandledrejection', function(e) {
                                var reason = e && e.reason;
                                // Skip noise errors
                                if (reason && reason.message && reason.message.toLowerCase().includes('connection closed')) {
                                    return;
                                }

                                if (reason && reason.name === 'ChunkLoadError') {
                                    cacheBustReload();
                                }
                                // Also catch generic loading errors from dynamic imports
                                if (reason && reason.message && (
                                    reason.message.toLowerCase().includes('chunk') ||
                                    reason.message.toLowerCase().includes('failed to load')
                                )) {
                                    cacheBustReload();
                                }
                            });
                        })();
                    ` }} />
                    <Script
                        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8714969386201280`}
                        strategy="lazyOnload"
                        crossOrigin="anonymous"
                    />
                    <main className="flex-grow">
                        {children}
                    </main>
                    <Footer />
                    <SpeedInsights />
                </Providers>
            </body>
        </html>
    );
}
