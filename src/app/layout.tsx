import type { Metadata } from "next";
import { Cinzel, Inter, Space_Mono } from "next/font/google";
import PrivyProvider from "@/components/providers/PrivyProvider";
import { ToastProvider } from "@/components/ui/Toast";
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

// Cinzel is the heading display face — loaded via next/font so it's
// self-hosted, avoids render-blocking <link>, and gets CSS-optimised.
const cinzel = Cinzel({
  variable: "--font-cinzel",
  weight: ["400", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
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
    <html
      lang="pl"
      className={`${inter.variable} ${spaceMono.variable} ${cinzel.variable}`}
      // The inline theme-bootstrap <script> below writes `data-theme` to
      // <html> before React hydrates, which produces a server/client
      // attribute mismatch on this element. That mismatch is intentional
      // (it's how we avoid the light/dark flash), so we scope React's
      // hydration warning to this tag only. Children still hydrate
      // normally. Same pattern next-themes uses.
      suppressHydrationWarning
    >
      <head>
        {/*
          Inline theme bootstrap — runs before React hydrates so the
          `data-theme` attribute is already correct on first paint.
          Prevents the light/dark flash. Mirrors useTheme's fallback
          logic (default dark when storage is empty/invalid).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('skarbnik-theme');document.documentElement.setAttribute('data-theme',t==='light'||t==='dark'?t:'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}",
          }}
        />
      </head>
      <body className="min-h-screen">
        <PrivyProvider>
          <ToastProvider>{children}</ToastProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
