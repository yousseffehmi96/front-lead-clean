import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../componets/navbar";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CleanApp",
  icons: {
    icon: "/favicon.ico",  
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-row h-screen`}
        style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)" }}
      >
        <Navbar />
     
        <main className="flex-1 overflow-y-auto h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}