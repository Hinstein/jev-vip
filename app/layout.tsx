import './globals.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
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
const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.className}>
      <body className="min-h-[100dvh] bg-white text-gray-950">
        {umamiScriptUrl && umamiWebsiteId ? (
          <Script
            src={umamiScriptUrl}
            data-website-id={umamiWebsiteId}
            data-domains="jevhub.store"
            strategy="afterInteractive"
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
