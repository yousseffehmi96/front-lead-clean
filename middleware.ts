import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Routes accessibles sans être connecté
// Pas de /sign-up : l'inscription libre est désactivée, les comptes sont
// créés par un manager depuis Paramètres > Utilisateurs.
const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-in(.*)',
  '/api/public(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Toute route non-publique exige une session : sinon redirection vers /sign-in
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Toutes les pages sauf les fichiers statiques
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Toujours exécuter sur les routes API/trpc
    '/(api|trpc)(.*)',
  ],
}
