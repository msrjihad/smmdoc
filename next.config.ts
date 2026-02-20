import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@/components', '@/hooks', '@/lib'],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      if (process.env.USE_POLLING === 'true') {
        config.watchOptions = {
          poll: 2000,
          aggregateTimeout: 500,
        };
      } else {
        config.watchOptions = {
          ignored: ['**/node_modules .next/**'],
          aggregateTimeout: 300,
        };
      }

      config.resolve.symlinks = false;
    }

    return config;
  },

  turbopack: {},

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 60 * 1000,
      pagesBufferLength: 5,
    },
  }),

  async rewrites() {
    return [
      {
        source: '/blog/:slug',
        destination: '/blogs/:slug',
      },
    ];
  },
};

export default nextConfig;
