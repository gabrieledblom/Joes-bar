import type { Metadata, Viewport } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import { restaurang } from "@/data/restaurang";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

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

export const metadata: Metadata = {
  metadataBase: new URL(restaurang.url),
  title: {
    default: `${restaurang.namn} · ${restaurang.tagline} · ${restaurang.ort}`,
    template: `%s · ${restaurang.namn}`,
  },
  description:
    "Pizza, smash burgare, kebab och sides i Järna. Beställ och betala online, hämta när det är klart.",
  // Sajten hålls utanför Google tills adress och telefonnummer är ifyllda.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0614",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="sv"
      className={`${anton.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-jb-botten text-jb-text">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
