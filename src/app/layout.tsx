import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://browserbase-clone-open-source1.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BrowserChrome — Cloud Browser & AI Agent Platform",
    template: "%s | BrowserChrome",
  },
  description:
    "BrowserChrome is a cloud browser platform for AI agents: headless Chrome sessions, API keys, realtime database, SQL editor, MCP OAuth, and backend APIs.",
  keywords: [
    "BrowserChrome",
    "Browser Chrome",
    "cloud browser",
    "headless chrome",
    "browser automation",
    "AI agents browser",
    "BrowserBase alternative",
    "MCP browser",
    "cloud chrome sessions",
  ],
  authors: [{ name: "BrowserChrome" }],
  creator: "BrowserChrome",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "BrowserChrome",
    title: "BrowserChrome — Cloud Browser & AI Agent Platform",
    description:
      "Cloud headless Chrome, sessions, API keys, and infrastructure for AI agents and automation.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BrowserChrome — Cloud Browser Platform",
    description: "Headless Chrome sessions and APIs for AI agents.",
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
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "BrowserChrome",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description:
      "Cloud browser platform with headless Chrome sessions, API keys, and AI agent tools.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
