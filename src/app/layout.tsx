import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrowserBase — Cloud Browsers for AI Agents",
  description: "Headless browser sessions, API keys, and infrastructure for building browser agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
