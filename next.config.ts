import type { NextConfig } from 'next';

const newApiInternalUrl = (
  process.env.NEW_API_INTERNAL_URL || 'http://127.0.0.1:3001'
).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true,
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/api/:path*',
          destination: `${newApiInternalUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
