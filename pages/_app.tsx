import type { AppProps } from 'next/app';
import Script from 'next/script';
import { Providers } from '../components/Providers';
import '../app/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <Providers>
            <Script
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8714969386201280"
                crossOrigin="anonymous"
                strategy="lazyOnload"
            />
            <Component {...pageProps} />
        </Providers>
    );
}

export default MyApp;
