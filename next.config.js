/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'open.spotify.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;

