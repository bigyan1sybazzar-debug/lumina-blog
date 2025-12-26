/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ]
  },
};

export default nextConfig;
