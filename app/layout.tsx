import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/brand';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: `${APP_NAME} — Rééducation assistée par IA`,
  description: APP_DESCRIPTION,
  icons: { icon: '/logo.png', apple: '/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
