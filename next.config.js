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
  // Ensure no Clerk dependencies are used
  webpack: (config, { isServer }) => {
    // Exclude Clerk packages if they somehow get pulled in
    config.resolve.alias = {
      ...config.resolve.alias,
      '@clerk/clerk-react': false,
      '@clerk/nextjs': false,
    }
    return config
  },
}

module.exports = nextConfig
