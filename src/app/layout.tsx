import type { Metadata } from "next";
import { Inter, Crimson_Text } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import ThemeToggle from "./components/ThemeToggle";

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
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${crimsonText.variable} antialiased`}>
        <div className="flex flex-col lg:flex-row min-h-screen">
          <Navigation />
          <main className="flex-1 lg:ml-0">{children}</main>
        </div>
        <ThemeToggle />
      </body>
    </html>
  );
}
