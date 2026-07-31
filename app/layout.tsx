import type { Metadata } from "next";
import {
    IBM_Plex_Mono,
    IBM_Plex_Sans,
    IBM_Plex_Sans_Condensed,
} from 'next/font/google';
import "@/styles/globals.css";

// Plex is the line-printer lineage the landing page's greenbar treatment is
// drawn from: condensed for display, sans for reading, mono for issue keys.
const plexSans = IBM_Plex_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-sans',
    display: 'swap',
});

const plexCondensed = IBM_Plex_Sans_Condensed({
    subsets: ['latin'],
    weight: ['600', '700'],
    variable: '--font-display',
    display: 'swap',
});

const plexMono = IBM_Plex_Mono({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'LexiCode',
    description: 'A Notion-style workspace built with Next.js and Tailwind',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexCondensed.variable} ${plexMono.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  );
}
