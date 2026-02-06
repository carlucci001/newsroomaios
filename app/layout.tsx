import type { Metadata } from "next";
import { Crimson_Pro, Manrope } from "next/font/google";
import "./globals.css";
import { MaintenanceModeChecker } from "@/components/MaintenanceModeChecker";

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  display: "swap",
  weight: ["400", "600", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Newsroom AIOS - Launch Your Local Newspaper in Minutes | AI-Powered News Platform",
  description: "Professional local newspaper software for community journalism. AI-powered content creation, automated advertising, business directory, and newsletter management. Launch your newspaper in minutes, not months.",
  keywords: "local newspaper software, community journalism platform, newspaper advertising platform, local news website builder, newspaper management system, digital newspaper platform, small town newspaper software",
  openGraph: {
    title: "Newsroom AIOS - Launch Your Local Newspaper in Minutes",
    description: "AI-powered platform for launching and managing local newspapers. Everything you need in one place.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${crimsonPro.variable} ${manrope.variable}`}>
      <body className="antialiased font-sans">
        <MaintenanceModeChecker />
        {children}
      </body>
    </html>
  );
}
