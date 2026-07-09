"use client"
import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

// Intercepte tous les fetch() vers l'API et ajoute le token Clerk (Authorization: Bearer).
// Couvre automatiquement tous les appels, sans les modifier un par un.
export default function ApiAuth() {
  const { getToken } = useAuth()

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || ""
    if (!API || typeof window === "undefined") return

    const orig = window.fetch
    const patched = async (input: any, init: any = {}) => {
      try {
        const url = typeof input === "string" ? input : (input?.url || "")
        if (url.startsWith(API)) {
          const token = await getToken()
          if (token) {
            const headers = new Headers((init && init.headers) || {})
            if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)
            init = { ...(init || {}), headers }
          }
        }
      } catch {
        // en cas d'échec de récupération du token, on laisse passer (le backend renverra 401)
      }
      return orig(input, init)
    }
    // Conserve les propriétés attachées (ex. fetch.preconnect) pour respecter le type de window.fetch
    window.fetch = Object.assign(patched, orig) as typeof window.fetch

    return () => { window.fetch = orig }
  }, [getToken])

  return null
}
