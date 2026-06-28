import './globals.css';
import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  weight: ['400', '600', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TaxiHub — احجز رحلتك الآن',
  description: 'TaxiHub — خدمة توصيل ذكية وموثوقة. احجز رحلتك في ثوانٍ.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${cairo.variable} bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: 'hsl(240 6% 10%)',
              border: '1px solid rgba(0,212,170,0.15)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
