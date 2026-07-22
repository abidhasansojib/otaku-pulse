import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../lib/providers/QueryProvider';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'OtakuPulse | Enterprise Anime Discovery & Dub Matrix',
  description: 'Explore top rated anime, real-time search, global rankings, trailer previews, and multi-language dub availability matrices.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F19] text-[#F3F4F6] min-h-screen flex flex-col antialiased selection:bg-[#FF2A5F] selection:text-white">
        <QueryProvider>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}
