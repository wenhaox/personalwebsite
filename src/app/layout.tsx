import type { Metadata } from "next";
import { Inter, Crimson_Text } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navigation from "./components/Navigation";
import ThemeToggle from "./components/ThemeToggle";
import PageTransition from "./components/PageTransition";

const themeInitScript = `(() => {
  try {
    const root = document.documentElement
    const stored = localStorage.getItem('theme-preference')
    const shouldUseDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const bodyColor = shouldUseDark ? '#1a1a1a' : '#faf9f7'
    if (shouldUseDark) {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
      root.style.backgroundColor = bodyColor
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
      root.style.backgroundColor = bodyColor
    }

    const applyBodyColor = () => {
      if (!document.body) return
      document.body.style.backgroundColor = bodyColor
      document.body.style.colorScheme = shouldUseDark ? 'dark' : 'light'
    }

    if (document.body) {
      applyBodyColor()
    } else {
      window.addEventListener('DOMContentLoaded', applyBodyColor, { once: true })
    }
  } catch (_error) {
    const root = document.documentElement
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
    root.style.backgroundColor = '#faf9f7'

    const applyBodyFallback = () => {
      if (!document.body) return
      document.body.style.backgroundColor = '#faf9f7'
      document.body.style.colorScheme = 'light'
    }

    if (document.body) {
      applyBodyFallback()
    } else {
      window.addEventListener('DOMContentLoaded', applyBodyFallback, { once: true })
    }
  }
})();`;

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-crimson-text",
});

export const metadata: Metadata = {
  title: "Your Name - Personal Website",
  description: "Personal website showcasing my work, thoughts, and photography",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${crimsonText.variable} antialiased`}>
        <Suspense fallback={<nav className="w-80 h-screen mobile-nav fixed left-0 top-0" />}>
          <Navigation />
        </Suspense>
        <main className="ml-80 min-h-screen desktop-main-offset">
          <PageTransition>{children}</PageTransition>
        </main>
        <ThemeToggle />
      </body>
    </html>
  );
}
