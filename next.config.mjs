/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: {
      root: '.',
    },
  },
  reactStrictMode: true,
  compress: true,
  async rewrites() {
    return [
      {
        source: '/api-video/:path*',
        destination: 'https://social-media-video-downloder.p.rapidapi.com/:path*',
      },
      {
        source: '/api-gmail/:path*',
        destination: 'https://temporary-gmail-account.p.rapidapi.com/:path*',
      },
      {
        source: '/api-google-translate/:path*',
        destination: 'https://translate.googleapis.com/:path*',
      },
      {
        source: '/api/football/:path*',
        destination: 'https://api.sportmonks.com/v3/football/:path*',
      },
    ]
  },

  async headers() {
    return [
      {
        // Apply to all API routes and dynamic pages
        source: '/:path*',
        missing: [
          { type: 'header', key: 'x-vercel-cache' } // skip if already cached by Vercel
        ],
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate=30'
          },
          {
            key: 'CDN-Cache-Control',
            value: 's-maxage=60'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*((?:svg|jpg|png|webp|avif|ico|woff2?|json))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
