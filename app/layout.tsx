"use client"; // On ajoute ceci car on utilise usePathname
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../componets/navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation"; // Import pour détecter la page
import { Provider } from "react-redux"
import { store } from "../store/store"
import AuthSync from "@/componets/AuthSync"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Définir les pages où la navbar doit être CACHÉE
  // On cache sur sign-in et sign-up
  const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-row h-screen`}
        style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)" }}
      >
        <ClerkProvider

        >
          {/* Affiche la Navbar UNIQUEMENT si ce n'est pas une page d'auth */}
          {!isAuthPage && <Navbar />}

          <main className={`flex-1 overflow-y-auto h-screen ${isAuthPage ? 'w-full' : ''}`}>
            <Provider store={store}>
              <AuthSync />
              {children}
            </Provider>
          </main>
        </ClerkProvider>
      </body>
    </html>
  );
}