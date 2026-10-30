import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import MainLayout from "@/components/MainLayout";
import ThemeInitializer from "@/components/ThemeInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ClassCrib – Gamified Student Productivity & Financial Literacy",
    template: "%s | ClassCrib"
  },
  description: "ClassCrib helps UAE schools manage assignments and student progress through a gamified virtual coin economy and financial-literacy activities.",
  keywords: ["education", "gamified learning", "homework tracker", "financial literacy", "UAE school", "student productivity"],
  authors: [{ name: "ClassCrib" }],
  creator: "ClassCrib",
  metadataBase: new URL("https://classcrib.ae"),
  openGraph: {
    title: "ClassCrib – Where Homework Meets Wealth",
    description: "A gamified educational productivity platform for UAE schools. Students earn coins from assignments and manage a virtual economy.",
    url: "https://classcrib.ae",
    siteName: "ClassCrib",
    locale: "en_AE",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClassCrib – Gamified Student Productivity",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClassCrib – Where Homework Meets Wealth",
    description: "Gamified student productivity & financial literacy for UAE schools.",
    images: ["/og-image.png"],
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
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ThemeInitializer />
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}
