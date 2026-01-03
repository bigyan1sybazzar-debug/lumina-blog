import type { AppProps } from 'next/app';
import { Inter, Merriweather } from 'next/font/google';
import { Providers } from '../components/Providers';
import '../app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const merriweather = Merriweather({
    weight: ['300', '400', '700', '900'],
    subsets: ['latin'],
    variable: '--font-merriweather',
    display: 'swap'
});

import { GlobalListener } from '../components/GlobalListener';
import { VideoCallModal } from '../components/VideoCallModal';

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <div className={`${inter.variable} ${merriweather.variable} font-sans`}>
            <Providers>
                <GlobalListener />
                <VideoCallModal />
                <Component {...pageProps} />
            </Providers>
        </div>
    );
}

export default MyApp;
