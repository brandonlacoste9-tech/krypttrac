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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
