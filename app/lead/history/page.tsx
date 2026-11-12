"use client"
import { useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useSelector } from "react-redux"
import { Filter, History, Inbox, Linkedin, Loader2, RefreshCw } from "lucide-react"

const DEST_UI: Record<string, { label: string; color: string; bg: string; border: string }> = {
  complete: { label: "Complete", color: "#d97706", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)" },
  incomplete: { label: "Incomplete", color: "var(--app-text-muted)", bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.35)" },
  clean: { label: "Clean", color: "#059669", bg: "rgba(110,231,183,0.15)", border: "rgba(110,231,183,0.35)" },
  staging: { label: "Staging", color: "#4338ca", bg: "rgba(129,140,248,0.15)", border: "rgba(129,140,248,0.35)" },
}

export default function ImportHistoryPage() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [refresh, setRefresh] = useState(0)

  const userId = useSelector((state: any) => state.user.userId)
  const { user, isLoaded } = useUser()
  const isManager = ((user?.publicMetadata?.role as string) || "agent").toLowerCase() === "manager"

  useEffect(() => {
    const load = async () => {
      if (!isLoaded) return
      if (!isManager && !userId) return
      setLoading(true)
      setErr(null)
      try {
        const query = isManager ? `?is_manager=true` : `?userid=${encodeURIComponent(String(userId))}`
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staging-import-history${query}`)
        const data = await res.json()
        setHistory(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setErr(e?.message || "Erreur de chargement de l'historique")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, isManager, isLoaded, refresh])

  const rows = useMemo(() => {
    if (!search) return history
    const s = search.toLowerCase()
    return history.filter((h: any) =>
      Object.values(h).some((v: any) => String(v ?? "").toLowerCase().includes(s))
    )
  }, [history, search])

  const HEADERS = ["Date import", "Fichier", "Nom", "Prénom", "Email", "Fonction", "Société", "Téléphone", "LinkedIn", "Location", "Destination"]

  return (
    <div className="app-page min-h-screen flex flex-col p-4 pl-14 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[color:var(--app-border)]">
        <div>
          <h1 className="app-title text-xl flex items-center gap-2">
            <History size={22} className="text-indigo-600" />
            Historique des imports
          </h1>
          <p className="text-xs text-[color:var(--app-text-faint)] mt-1">{rows.length} import(s)</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Rechercher (fichier, email, société…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="app-input w-full sm:w-72"
            />
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--app-text-faint)]" />
          </div>
          <button
            onClick={() => setRefresh((p) => p + 1)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", color: "#4338ca" }}
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {err && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.3)", color:"#e11d48" }}>{err}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[color:var(--app-text-faint)]"><Loader2 size={28} className="mb-2 inline-block animate-spin" /><p className="text-sm">Chargement…</p></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 text-[color:var(--app-text-faint)]"><Inbox size={34} className="mx-auto mb-3" /><p className="text-base font-medium text-[color:var(--app-text-muted)]">Aucun import enregistré</p></div>
      ) : (
        <div className="app-card overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[var(--app-bg-subtle)] border-b border-[color:var(--app-border-subtle)]">
                  {HEADERS.map((h) => (
                    <th key={h} className="p-3 text-[11px] font-bold uppercase text-[color:var(--app-text-faint)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((h: any, i: number) => {
                  const dest = DEST_UI[String(h.destination || "staging").toLowerCase()] || DEST_UI.staging
                  return (
                    <tr key={i} className="border-b border-[color:var(--app-border-subtle)] hover:bg-[var(--app-bg-subtle)] transition-colors">
                      <td className="p-3 text-[color:var(--app-text-secondary)] text-xs">{h.imported_at ? new Date(h.imported_at).toLocaleString("fr-FR") : ""}</td>
                      <td className="p-3 text-[color:var(--app-text-secondary)]">{h.filename}</td>
                      <td className="p-3 text-[color:var(--app-text)]">{h.nom}</td>
                      <td className="p-3">{h.prenom}</td>
                      <td className="p-3 text-blue-400">{h.email}</td>
                      <td className="p-3 text-[color:var(--app-text-secondary)]">{h.fonction}</td>
                      <td className="p-3 text-[color:var(--app-text-secondary)]">{h.societe}</td>
                      <td className="p-3 text-[color:var(--app-text-secondary)]">{h.telephone}</td>
                      <td className="p-3">
                        {h.linkedin ? (
                          <a href={h.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-600 inline-flex items-center gap-1 underline">
                            <Linkedin size={12} /> LinkedIn
                          </a>
                        ) : ""}
                      </td>
                      <td className="p-3 text-[color:var(--app-text-secondary)]">{h.location}</td>
                      <td className="p-3">
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: dest.color, background: dest.bg, border: `1px solid ${dest.border}` }}>
                          {dest.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
