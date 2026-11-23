import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import QuickBuySheet from "../components/QuickBuySheet";
import AnalyticsScripts from "../components/AnalyticsScripts";
import SmoothScroll from "../components/SmoothScroll";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const nippo = localFont({
  src: "./fonts/nippo/Nippo-Variable.woff2",
  variable: "--font-nippo",
  display: "swap",
});

const zodiak = localFont({
  src: [
    {
      path: "./fonts/zodiak/Zodiak-Variable.woff2",
      style: "normal",
    },
    {
      path: "./fonts/zodiak/Zodiak-VariableItalic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-zodiak",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://twom.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TWOM | Luxury Minimalist Apparel",
    template: "%s | TWOM Atelier",
  },
  description: "Designed for working professionals. The art of restraint. Modern Nigerian luxury tailoring.",
  keywords: [
    "TWOM",
    "TWOM Atelier",
    "Luxury Minimalist Apparel",
    "Nigerian Fashion",
    "Lagos Tailoring",
    "Contemporary Menswear",
    "Minimalist Fashion",
  ],
  authors: [{ name: "TWOM Studios" }],
  creator: "TWOM Studios",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: siteUrl,
    siteName: "TWOM Atelier",
    title: "TWOM | Luxury Minimalist Apparel",
    description: "Designed for working professionals. The art of restraint. Modern Nigerian luxury tailoring.",
    images: [
      {
        url: "https://wygcegdwyaajxzjkczis.supabase.co/storage/v1/object/public/hero-posters/hero/main/poster.jpeg",
        width: 1200,
        height: 630,
        alt: "TWOM Atelier Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TWOM | Luxury Minimalist Apparel",
    description: "Designed for working professionals. The art of restraint.",
    images: [
      "https://wygcegdwyaajxzjkczis.supabase.co/storage/v1/object/public/hero-posters/hero/main/poster.jpeg",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", zodiak.variable, nippo.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col font-sans bg-twom-bg text-twom-body">
        <SmoothScroll />
        <AnalyticsScripts />
        <Navbar />
        <CartDrawer />
        <QuickBuySheet />
        {children}
        <Footer />
      </body>
    </html>
  );
}
