import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
    title: 'SPACE',
    description: 'A Notion-style workspace built with Next.js and Tailwind',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
