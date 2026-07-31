import type { Metadata } from "next";
import "./globals.css";
import AIChatBox from "@/components/AIChatBox";

export const metadata: Metadata = {
  title: "Notion Clone",
  description: "A Notion-style workspace built with Next.js and Tailwind",
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
        <AIChatBox />
      </body>
    </html>
  );
}
