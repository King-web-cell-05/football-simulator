
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

// ==========================================
// FONTS
// ==========================================

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ==========================================
// SITE CONFIGURATION
// ==========================================

const siteConfig = {
  name: "FootballSim",
  title: "FootballSim | Football Competition Simulator",
  description:
    "Create football competitions, generate fixtures, simulate matches, and track league standings. Build your own football universe with FootballSim.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000",
  keywords: [
    "FootballSim",
    "Football Simulator",
    "Football Competition Simulator",
    "UEFA Champions League Simulator",
    "Champions League",
    "Football Fixtures",
    "Football Standings",
    "Football Match Simulation",
    "Football Tournament",
    "League Phase Simulator",
    "Football Management",
  ],
};

// ==========================================
// SEO METADATA
// ==========================================

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),

  title: {
    default: siteConfig.title,
    template: "%s | FootballSim",
  },

  description: siteConfig.description,

  applicationName: siteConfig.name,

  keywords: siteConfig.keywords,

  category: "sports",

  creator: "FootballSim",

  publisher: "FootballSim",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },

  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

// ==========================================
// VIEWPORT
// ==========================================

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070a0e",
  colorScheme: "dark",
};

// ==========================================
// ROOT LAYOUT
// ==========================================

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        h-full
        scroll-smooth
        antialiased
      `}
    >
      <body
        className="
          flex
          min-h-dvh
          flex-col
          overflow-x-hidden
          bg-[#070a0e]
          font-sans
          text-white
          selection:bg-[#b7f56a]
          selection:text-[#070a0e]
        "
      >
        {children}
      </body>
    </html>
  );
}
