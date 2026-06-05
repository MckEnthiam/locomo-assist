import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Locomo-assist - Rééducation assistée par IA",
  description:
    "Locomo-assist : Application de rééducation physique avec coach IA et suivi de progression par détection de mouvement en temps réel.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <div className="font-sans">{children}</div>
      </body>
    </html>
  );
}
