import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Bigyann',
        short_name: 'Bigyann',
        description: 'AI powered Articles, Reviews & Discussions on latest tech, design, and AI technology.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1C64F2',
        icons: [
            {
                src: '/favicon.ico',
                sizes: '32x32',
                type: 'image/x-icon',
            },
            {
                src: '/icon-32x32.png',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}
