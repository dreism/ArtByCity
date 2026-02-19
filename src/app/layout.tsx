import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'ArtByCity — Discover Local Art Galleries',
  description: 'Explore current and upcoming art exhibitions from the top galleries in any city around the world.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 min-h-screen">
        <Navbar />
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
