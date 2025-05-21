/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['randomuser.me'], // For sample user avatar images
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  // Exclude server directory from the TypeScript compilation
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Don't include server files and Vite-related files in the client build
  webpack: (config, { isServer }) => {
    // Exclude server directory files from the client-side build
    if (!isServer) {
      config.resolve.alias['server'] = {};
      config.resolve.alias['src'] = {};
      config.resolve.alias['vite.config'] = {};
    }
    return config;
  },
};

export default nextConfig;