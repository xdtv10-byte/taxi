import './globals.css';
import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
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
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TaxiHub — احجز رحلتك الآن',
  description:
    'TaxiHub — تطبيق حجز التاكسي الذكي. اقتصادية، مريحة، مميزة. احجز رحلتك في ثوانٍ.',
  openGraph: {
    title: 'TaxiHub',
    description: 'احجز رحلتك الآن — تطبيق حجز التاكسي الذكي',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cairo.variable} font-sans bg-background text-foreground antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: 'hsl(240 6% 10%)',
              border: '1px solid hsl(240 5% 18%)',
              color: 'hsl(0 0% 98%)',
            },
          }}
        />
      </body>
    </html>
  );
}
