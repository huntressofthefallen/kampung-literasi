/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Vercel deployment
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Ensure proper handling of API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
