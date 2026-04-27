import withPWAInit from 'next-pwa';
import { writeFileSync, mkdirSync } from 'fs';

// Generate public diagnostic file at build time
const xionDiagnostic = {
  buildTime: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV,
  vars: {
    NEXT_PUBLIC_XION_RPC_URL:            process.env.NEXT_PUBLIC_XION_RPC_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_XION_REST_URL:           process.env.NEXT_PUBLIC_XION_REST_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_XION_CHAIN_ID:           process.env.NEXT_PUBLIC_XION_CHAIN_ID ? 'SET' : 'MISSING',
    NEXT_PUBLIC_XION_VACCINATION_RECORD: process.env.NEXT_PUBLIC_XION_VACCINATION_RECORD ? 'SET' : 'MISSING',
    NEXT_PUBLIC_XION_MILESTONE_CHECKER:  process.env.NEXT_PUBLIC_XION_MILESTONE_CHECKER ? 'SET' : 'MISSING',
    NEXT_PUBLIC_XION_ISSUER_REGISTRY:    process.env.NEXT_PUBLIC_XION_ISSUER_REGISTRY ? 'SET' : 'MISSING',
    NEXT_PUBLIC_XION_GRANT_ESCROW:       process.env.NEXT_PUBLIC_XION_GRANT_ESCROW ? 'SET' : 'MISSING',
  },
};

try {
  mkdirSync('./public', { recursive: true });
  writeFileSync('./public/xion-build-diagnostic.json', JSON.stringify(xionDiagnostic, null, 2));
} catch (e) {
  console.warn('Could not write xion-build-diagnostic.json:', e.message);
}

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
  // PWA is intentionally disabled in development to improve build speeds and avoid service worker caching issues.
  disable: process.env.NODE_ENV === 'development',
  // Use NetworkFirst for JS bundles so a new Vercel deployment is picked up
  // immediately rather than serving a stale cached bundle for up to 24h.
  // A stale bundle can contain env-baked contract addresses from a previous build.
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts-v2',
        expiration: { maxEntries: 4, maxAgeSeconds: 31536000 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets-v2',
        expiration: { maxEntries: 4, maxAgeSeconds: 604800 },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets-v2',
        expiration: { maxEntries: 4, maxAgeSeconds: 604800 },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets-v2',
        expiration: { maxEntries: 64, maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image-v2',
        expiration: { maxEntries: 64, maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-js-assets-v2',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 32, maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets-v2',
        expiration: { maxEntries: 32, maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-data-v2',
        expiration: { maxEntries: 32, maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /\.(?:json|xml|csv)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-data-assets-v2',
        expiration: { maxEntries: 32, maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin;
        if (!isSameOrigin) return false;
        const pathname = url.pathname;
        return !pathname.startsWith('/api/auth/') && !!pathname.startsWith('/api/');
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'apis-v2',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 16, maxAgeSeconds: 86400 },
      },
    },
  ],
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
