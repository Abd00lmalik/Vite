import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AppBootstrap } from '@/components/shared/AppBootstrap';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#007B83',
};

export const metadata: Metadata = {
  title: 'VITE | Every dose recorded. Every record trusted. Every grant verified.',
  description:
    'Offline-first vaccination records, portable family credentials, and verified grant disbursement proof for public health programs.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/logo.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppBootstrap />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

