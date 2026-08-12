import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kopikala.my.id"),
  title: {
    default: "Kopikala Coffee Shop - Aplikasi Kasir & Menu POS Modern",
    template: "%s | Kopikala Coffee Shop",
  },
  description:
    "Website resmi & Sistem Aplikasi Kasir (Point of Sale) Kopikala Coffee Shop. Nikmati berbagai varian menu kopi terbaik, promo menarik, dan kemudahan transaksi.",
  keywords: [
    "Kopikala",
    "kopikala",
    "Kopikala Coffee",
    "Kopikala Coffee Shop",
    "kopikala.my.id",
    "Kasir Kopikala",
    "Aplikasi Kasir Coffee Shop",
    "Menu Kopikala",
    "Point of Sale Kopikala",
  ],
  authors: [{ name: "Kopikala Coffee Shop", url: "https://kopikala.my.id" }],
  creator: "Kopikala Coffee Shop",
  publisher: "Kopikala Coffee Shop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://kopikala.my.id",
  },
  openGraph: {
    title: "Kopikala Coffee Shop - Aplikasi Kasir & Menu POS Modern",
    description:
      "Sistem Aplikasi Kasir & Menu Online Kopikala Coffee Shop. Solusi transaksi coffee shop modern dan praktis.",
    url: "https://kopikala.my.id",
    siteName: "Kopikala",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kopikala Coffee Shop - Aplikasi Kasir & Menu POS Modern",
    description: "Sistem Aplikasi Kasir & Menu Online Kopikala Coffee Shop.",
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
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/icon?v=2", type: "image/png" },
    ],
    shortcut: "/favicon.svg?v=2",
    apple: "/icon?v=2",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CoffeeShop",
  name: "Kopikala Coffee Shop",
  url: "https://kopikala.my.id",
  description: "Aplikasi Kasir (Point of Sale) & Menu Online Kopikala Coffee Shop.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col text-stone-900 selection:bg-amber-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
