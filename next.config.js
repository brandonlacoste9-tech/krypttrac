/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'assets.coingecko.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.coingecko.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.coinpaprika.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
