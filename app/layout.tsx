"use client"; // On ajoute ceci car on utilise usePathname
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../componets/navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation"; // Import pour détecter la page
import { Provider } from "react-redux"
import { store } from "../store/store"
import AuthSync from "@/componets/AuthSync"
import ApiAuth from "@/componets/ApiAuth"
import ImportJobProvider from "@/componets/ImportJobProvider"

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
  const isAuthPage = pathname?.startsWith("/sign-in");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-row h-screen`}
        style={{ background: "var(--app-bg)" }}
      >
        <ClerkProvider

        >
          {/* Injecte le token Clerk dans tous les appels API */}
          <ApiAuth />
          {/* Suivi de l'import en tâche de fond : englobe la navbar ET la page
              pour que la carte de progression et la page Import partagent le
              même job (un seul polling). */}
          <ImportJobProvider>
            {/* Affiche la Navbar UNIQUEMENT si ce n'est pas une page d'auth */}
            {!isAuthPage && <Navbar />}

            <main className={`flex-1 overflow-y-auto h-screen ${isAuthPage ? 'w-full' : ''}`}>
              <Provider store={store}>
                <AuthSync />
                {children}
              </Provider>
            </main>
          </ImportJobProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
