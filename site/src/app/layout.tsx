import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteDescription =
  "Identity-free examination-hall behaviour intelligence using anonymous seat tracking, room-level attention estimation, relational evidence, and human-reviewed alerts.";

export const metadata: Metadata = {
  title: {
    default: "VIGIL — Explainable AI for Physical Examination Halls",
    template: "%s — VIGIL",
  },
  description: siteDescription,
  metadataBase: new URL("https://vigil.example"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "VIGIL — Explainable AI for Physical Examination Halls",
    description: siteDescription,
    siteName: "VIGIL",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIGIL — Explainable AI for Physical Examination Halls",
    description: siteDescription,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink-primary">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1" style={{ paddingTop: "71px" }}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
