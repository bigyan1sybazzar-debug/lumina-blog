import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/Providers';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Analytics } from '../components/Analytics';
import Script from 'next/script';

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
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAe1BMVEX////78vL45ufrlZvbACPcFDLcFTLbACLdK0LdLkTdKEDcJD745OX45+jcHTriYmzngYLbESngTVz21tfdJzPjdX/ur7LcGTbqmqD++fnYAAD33uDvt7voiIvbISrhW1/dMjr1ztLdNUvfRFbso6Tng4vhWWTmfH7lc3pUlbFDAAAApklEQVR4AbWSAw7AAAxFO9u2cf8Tzu4W7oU/NeBPCPIGATsUzbAXGI7a42heuMNtsSQ7a1EaEVcjI8OCMhtVTR/RDB4xiuYiLJt/GlUHFlwPN/qSE4wKN1JcqED0Ehk7MUCivteMUty4kkl4Q3meABQe3hAjSQqQJY9GllU9rgGPXGieRrFaRFAzyOKlthvpS2NdPHIyib+djOA+jj3uFH+T7wf7hwE23xD0wroPdwAAAABJRU5ErkJggg==',
        apple: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAe1BMVEX////78vL45ufrlZvbACPcFDLcFTLbACLdK0LdLkTdKEDcJD745OX45+jcHTriYmzngYLbESngTVz21tfdJzPjdX/ur7LcGTbqmqD++fnYAAD33uDvt7voiIvbISrhW1/dMjr1ztLdNUvfRFbso6Tng4vhWWTmfH7lc3pUlbFDAAAApklEQVR4AbWSAw7AAAxFO9u2cf8Tzu4W7oU/NeBPCPIGATsUzbAXGI7a42heuMNtsSQ7a1EaEVcjI8OCMhtVTR/RDB4xiuYiLJt/GlUHFlwPN/qSE4wKN1JcqED0Ehk7MUCivteMUty4kkl4Q3meABQe3hAjSQqQJY9GllU9rgGPXGieRrFaRFAzyOKlthvpS2NdPHIyib+djOA+jj3uFH+T7wf7hwE23xD0wroPdwAAAABJRU5ErkJggg==',
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
        canonical: 'https://bigyann.com.np',
    }
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
                    <Analytics />
                    <Script src="https://js.puter.com/v2/" strategy="lazyOnload" />
                    <Script
                        id="json-ld"
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                    />
                    <Script
                        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8714969386201280"
                        crossOrigin="anonymous"
                        strategy="lazyOnload"
                    />
                    <main className="flex-grow">
                        {children}
                    </main>
                    <Footer />
                </Providers>
            </body>
        </html>
    );
}
