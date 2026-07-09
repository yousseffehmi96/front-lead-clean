// Ouvre une URL API (téléchargement) avec le token Clerk.
// window.open() ne peut pas poser de header Authorization -> on passe le token en query (__token),
// que le backend accepte en repli pour ces routes.
export async function openApi(url: string) {
  try {
    const token = await (window as any)?.Clerk?.session?.getToken?.()
    const finalUrl = token
      ? `${url}${url.includes("?") ? "&" : "?"}__token=${encodeURIComponent(token)}`
      : url
    window.open(finalUrl, "_blank")
  } catch {
    window.open(url, "_blank")
  }
}
