"use client"
import { useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useSelector } from "react-redux"
import { History, Filter, RefreshCw, Linkedin } from "lucide-react"

const DEST_UI: Record<string, { label: string; color: string; bg: string; border: string }> = {
  complete: { label: "Complete", color: "#fcd34d", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)" },
  incomplete: { label: "Incomplete", color: "#cbd5e1", bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.35)" },
  clean: { label: "Clean", color: "#6ee7b7", bg: "rgba(110,231,183,0.15)", border: "rgba(110,231,183,0.35)" },
  staging: { label: "Staging", color: "#a5b4fc", bg: "rgba(129,140,248,0.15)", border: "rgba(129,140,248,0.35)" },
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
    <div className="min-h-screen flex flex-col p-4 pl-14 md:p-8 space-y-6" style={{ color: "#cbd5e1", background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-white font-bold text-xl flex items-center gap-2">
            <History size={22} className="text-indigo-400" />
            Historique des imports
          </h1>
          <p className="text-xs text-white/30 mt-1">{rows.length} import(s)</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Rechercher (fichier, email, société…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500/50"
            />
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
          <button
            onClick={() => setRefresh((p) => p + 1)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", color: "#a5b4fc" }}
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {err && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#fda4af" }}>❌ {err}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-white/30"><div className="text-4xl mb-3">⚡</div><p className="text-sm">Chargement…</p></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 text-white/25"><div className="text-5xl mb-4">📭</div><p className="text-base font-medium text-white/35">Aucun import enregistré</p></div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  {HEADERS.map((h) => (
                    <th key={h} className="p-3 text-[11px] font-bold uppercase text-white/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((h: any, i: number) => {
                  const dest = DEST_UI[String(h.destination || "staging").toLowerCase()] || DEST_UI.staging
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-white/60 text-xs">{h.imported_at ? new Date(h.imported_at).toLocaleString("fr-FR") : ""}</td>
                      <td className="p-3 text-white/80">{h.filename}</td>
                      <td className="p-3 text-white">{h.nom}</td>
                      <td className="p-3">{h.prenom}</td>
                      <td className="p-3 text-blue-400">{h.email}</td>
                      <td className="p-3 text-white/60">{h.fonction}</td>
                      <td className="p-3 text-white/80">{h.societe}</td>
                      <td className="p-3 text-white/60">{h.telephone}</td>
                      <td className="p-3">
                        {h.linkedin ? (
                          <a href={h.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-400 inline-flex items-center gap-1 underline">
                            <Linkedin size={12} /> LinkedIn
                          </a>
                        ) : ""}
                      </td>
                      <td className="p-3 text-white/60">{h.location}</td>
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
