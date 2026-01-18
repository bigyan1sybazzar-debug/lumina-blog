/** @type {import('next').NextConfig} */
const nextConfig = {
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
        source: '/:all*(svg|jpg|png|webp|avif)',
        locale: false,
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
