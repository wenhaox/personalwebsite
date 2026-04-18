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
    const bodyColor = shouldUseDark ? '#1a1a1a' : '#f4f5ef'
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
    root.style.backgroundColor = '#f4f5ef'

    const applyBodyFallback = () => {
      if (!document.body) return
      document.body.style.backgroundColor = '#f4f5ef'
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
  title: "Peter Xu",
  description: "Peter Xu personal website",
  icons: {
    icon: '/brandmark.svg?v=3',
    shortcut: '/brandmark.svg?v=3',
    apple: '/brandmark.svg?v=3',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

const navigationFallback = (
  <nav className="w-80 h-screen p-12 flex flex-col justify-start mobile-nav fixed left-0 top-0" style={{ paddingTop: 'calc(20vh + 8px)' }}>
    <div className="space-y-8 ml-16 mobile-nav-content sidebar-nav-fallback" aria-hidden="true">
      <div className="flex gap-2">
        <div className="w-6 h-6 bg-accent shadow-inner rotate-45"></div>
        <div className="w-6 h-6 bg-accent shadow-inner rotate-45"></div>
      </div>

      <div className="space-y-2 mobile-nav-links mobile-override-space">
        <span className="sidebar-nav-fallback-link">About</span>
        <span className="sidebar-nav-fallback-link">Photos</span>
        <span className="sidebar-nav-fallback-link">Recently</span>
        <span className="sidebar-nav-fallback-link">Connect</span>
      </div>
    </div>
  </nav>
)

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
        <Suspense fallback={navigationFallback}>
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
