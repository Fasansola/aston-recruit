import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Per shadcn/ui docs: use literal font names in @theme inline.
// Font variables are placed on <html>, not <body>.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aston Recruit",
  description: "Internal Applicant Tracking System — Aston VIP",
  icons: {
    icon: "/aston-logo.svg",
    shortcut: "/aston-logo.svg",
    apple: "/aston-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-zinc-950 antialiased">{children}</body>
    </html>
  );
}
