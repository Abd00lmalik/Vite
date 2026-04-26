import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
  // PWA is intentionally disabled in development to improve build speeds and avoid service worker caching issues.
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  transpilePackages: ['recharts'],
  // Stamp every build so the XionConfigDebug panel can confirm the deployment time.
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default withPWA(nextConfig);
