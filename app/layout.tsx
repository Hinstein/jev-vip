import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';

export const metadata: Metadata = {
  title: {
    default: 'Jev prepaid API',
    template: '%s · Jev',
  },
  description:
    'Prepaid Jev API access with recharge codes, API keys and usage visibility.',
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.className}>
      <body className="min-h-[100dvh] bg-white text-gray-950">{children}</body>
    </html>
  );
}
