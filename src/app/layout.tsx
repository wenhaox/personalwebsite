import type { Metadata } from "next";
import { Inter, Crimson_Text } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import ThemeToggle from "./components/ThemeToggle";
import ScrollProgress from "./components/ScrollProgress";
import PageTransition from "./components/PageTransition";

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
    <html lang="en">
      <body className={`${inter.variable} ${crimsonText.variable} antialiased`}>
        <ScrollProgress />
        <Navigation />
        <main className="ml-80 min-h-screen desktop-main-offset">
          <PageTransition>{children}</PageTransition>
        </main>
        <ThemeToggle />
      </body>
    </html>
  );
}
