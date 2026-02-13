import type { Metadata } from "next";
import { Crimson_Pro, Manrope } from "next/font/google";
import "./globals.css";
import { MaintenanceModeChecker } from "@/components/MaintenanceModeChecker";
import { getOrganizationJsonLd, getWebApplicationJsonLd, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Newsroom AIOS - AI-Powered Local Newspaper Platform | Launch in Minutes",
    template: "%s | Newsroom AIOS",
  },
  description: "Launch your own AI-powered local newspaper in minutes. Built-in advertising, business directory, and subscription revenue. Start a community newspaper with no technical skills required. $199 setup, keep 100% of revenue.",
  keywords: [
    "newspaper website builder",
    "AI newspaper platform",
    "community newspaper software",
    "local news publishing platform",
    "start an online newspaper",
    "newspaper CMS",
    "local newspaper software",
    "AI-powered community newspaper",
    "newspaper advertising platform",
    "local business directory platform",
    "start a newspaper without coding",
    "turnkey newspaper website",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: "Farrington Development LLC",
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Newsroom AIOS - AI-Powered Local Newspaper Platform",
    description: "Launch your own AI-powered local newspaper in minutes. Built-in monetization from day one.",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Newsroom AIOS - AI-Powered Local Newspaper Platform",
    description: "Launch your own AI-powered local newspaper in minutes. Built-in monetization from day one.",
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              getOrganizationJsonLd(),
              getWebApplicationJsonLd(),
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: SITE_NAME,
                url: SITE_URL,
                description: "AI-powered platform for launching local newspapers.",
              },
            ]),
          }}
        />
        <MaintenanceModeChecker />
        {children}
      </body>
    </html>
  );
}
