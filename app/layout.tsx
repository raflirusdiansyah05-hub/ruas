import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RUAS — Sistem Prioritas & Pelaporan Perbaikan Jalan",
  description:
    "Sistem decision-support terintegrasi untuk pelaporan, verifikasi AI otomatis, dan prioritas perbaikan jalan yang objektif dan transparan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans min-h-screen bg-base text-text-primary antialiased`}>
        {children}
      </body>
    </html>
  );
}
