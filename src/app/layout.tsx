import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import PrivyProvider from "@/components/providers/PrivyProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skarbnik — Twoj przewodnik po DeFi",
  description:
    "Ucz sie. Zdobywaj XP. Zostan mistrzem DeFi. Gamified DeFi education platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${inter.variable} ${spaceMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
