"use client"

import { useMemo, useEffect, useState } from "react"
import Usefetch from "@/hooks/SocieteFetch"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { getUserById } from "@/api/user-actions"
import { CARD_COLORS } from "@/lib/theme"

interface Stat {
  id: number
  filename: string
  inserted_rows: number
  duplicates_deleted: number
  emails_completed: number
  societe_completed: number
  added_societes: number
  blacklisted_removed: number
  moved_to_incomplete: number
  moved_to_clean: number
  moved_to_complete: number
  staging_vs_incomplete: number
  staging_vs_complete: number
  staging_vs_applique: number
  staging_internal: number
  total_deleted: number
  iduser: string
  created_at: string
}

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

function StatRow({ d, idx }: { d: Stat; idx: number }) {
  const [open, setOpen] = useState(false)
  const [user, setuser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const detected = (d.inserted_rows ?? 0) + (d.total_deleted ?? 0)
  const duplicatesDeleted = d.total_deleted ?? 0
  const inserted = d.inserted_rows ?? 0
  const userid = d.iduser

  useEffect(() => {
    if (!userid) {
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        const userData = await getUserById(userid)
        setuser(userData)
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error)
        setuser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userid])

  // Incomplete et Complete ne sont plus des tables (fusionnées dans `optimized`,
  // le niveau se lit sur la complétion). Les compteurs "moved_to_complete" /
  // "moved_to_incomplete" ne sont plus alimentés par le pipeline : on
  // n'affiche que ce qui existe.
  const details = [
    { label: "Emails complétés", val: d.emails_completed ?? 0, i: 2 },
    { label: "Sociétés complétées", val: d.societe_completed ?? 0, i: 3 },
    { label: "Blacklistés retirés", val: d.blacklisted_removed ?? 0, i: 5 },
    { label:"Vers Clean", val: d.moved_to_clean ?? 0, i: 8 },
    // Doublons écartés à l'import. Incomplete et Complete étant fusionnés dans
    // `optimized`, les deux compteurs du backend portent sur la même table
    // (partitions disjointes par complétion) : on les additionne en une seule métrique.
    { label: "Doublons vs Leads", val: (d.staging_vs_complete ?? 0) + (d.staging_vs_incomplete ?? 0), i: 1 },
    { label: "Doublons vs Staging", val: d.staging_vs_applique ?? 0, i: 4 },
    { label: "Doublons internes", val: d.staging_internal ?? 0, i: 2 },
  ]

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${open ? "bg-[var(--app-accent-soft)]" : "hover:bg-[var(--app-bg-subtle)]"}`}
        onClick={() => setOpen(!open)}
      >
        <td className="px-3 md:px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={open ? "text-[color:var(--app-accent)]" : "text-[color:var(--app-text-faint)]"}>
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            <span className="text-xs md:text-sm font-medium text-[color:var(--app-text)] truncate max-w-[120px] md:max-w-none">
              {d.filename}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="app-badge" style={{ color: CARD_COLORS[3].color, background: CARD_COLORS[3].bg, borderColor: CARD_COLORS[3].border }}>
            {detected}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="app-badge" style={{ color: CARD_COLORS[2].color, background: CARD_COLORS[2].bg, borderColor: CARD_COLORS[2].border }}>
            {duplicatesDeleted}
          </span>
        </td>
        <td className="px-3 md:px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[color:var(--app-accent-border)] bg-[var(--app-accent-soft)] text-xs font-bold text-[color:var(--app-accent-hover)]">
              {user?.firstName?.[0] || "U"}
            </div>
            <span className="text-xs md:text-sm text-[color:var(--app-text-secondary)] truncate max-w-[80px]">
              {loading ? "..." : user?.firstName || userid}
            </span>
          </div>
        </td>
        <td className="px-3 md:px-4 py-3 text-[11px] md:text-xs text-[color:var(--app-text-muted)] whitespace-nowrap">
          {new Date(d.created_at).toLocaleDateString("fr-FR")}
        </td>
      </tr>
      {open && (
        <tr className="bg-[var(--app-accent-soft)]">
          <td colSpan={6} className="px-4 pb-4 pt-1 md:px-6">
            <div className="flex flex-wrap gap-2">
              {details.map(({ label, val, i }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5"
                  style={{ borderColor: CARD_COLORS[i].border }}
                >
                  <span className="text-xs text-[color:var(--app-text-muted)]">{label}</span>
                  <span className="text-xs font-bold" style={{ color: CARD_COLORS[i].color }}>{val}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  const role = ((user?.publicMetadata?.role as string) || "agent").toLowerCase()
  const isManager = role === "manager"
  const userId = user?.id

  const statUrl = useMemo(() => {
    const base = `${process.env.NEXT_PUBLIC_API_URL}/stat`
    if (isManager) return `${base}?is_manager=true`
    if (userId) return `${base}?userid=${encodeURIComponent(userId)}`
    return base
  }, [isManager, userId])

  const { data } = Usefetch(statUrl)
  const stats = data as Stat[]

  const totals = useMemo(() => {
    if (!stats) return null
    const totalInserted = stats.reduce((s, d) => s + (d.inserted_rows ?? 0), 0)
    const totalDeleted = stats.reduce((s, d) => s + (d.total_deleted ?? 0), 0)
    return {
      files_uploaded: stats.length,
      detected: totalInserted + totalDeleted,
      duplicates_deleted: totalDeleted,

      inserted: totalInserted,
      emails: stats.reduce((s, d) => s + (d.emails_completed ?? 0), 0),
      societe: stats.reduce((s, d) => s + (d.societe_completed ?? 0), 0),
      added_societes: stats.reduce((s, d) => s + (d.added_societes ?? 0), 0),
      blacklisted: stats.reduce((s, d) => s + (d.blacklisted_removed ?? 0), 0),
      clean: stats.reduce((s, d) => s + (d.moved_to_clean ?? 0), 0),
      total_deleted: totalDeleted,
    }
  }, [stats])

  if (!stats) return (
    <div className="app-page flex h-full items-center justify-center">
      <div className="app-empty">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Chargement...</p>
      </div>
    </div>
  )

  const metricCards = [
    { label: "Fichiers uploadés", value: totals?.files_uploaded ?? 0 },
    { label: "Total détectés", value: totals?.detected ?? 0 },
    { label: "Doublons effacés", value: totals?.duplicates_deleted ?? 0 },
  ]

  return (
    <div className="app-page h-full overflow-y-auto">
      {/* En-tête */}
      <div className="app-header px-4 pl-14 py-4 md:px-8">
        <h1 className="app-title text-lg">Dashboard</h1>
        <p className="app-subtitle mt-0.5">{stats.length} imports enregistrés</p>
      </div>

      <div className="space-y-6 p-4 md:p-8">
        {/* Métriques */}
        {totals && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {metricCards.map((m, i) => (
              <div key={m.label} className="app-card app-card-hover p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="app-eyebrow">{m.label}</p>
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: CARD_COLORS[i].color }}
                  />
                </div>
                <p className="mt-3 text-[28px] font-bold leading-none tracking-tight text-[color:var(--app-text)]">
                  {m.value.toLocaleString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Historique des imports */}
        <div className="app-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--app-border)] px-5 py-3.5">
            <h2 className="app-title text-sm">Historique des imports</h2>
            <span className="app-count">{stats.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-xs md:text-sm">
              <thead className="bg-[var(--app-bg-subtle)]">
                <tr className="text-[10px] uppercase tracking-[0.06em] text-[color:var(--app-text-muted)] md:text-[11px]">
                  <th className="px-3 md:px-4 py-3 text-left font-semibold">Fichier</th>
                  <th className="px-3 md:px-4 py-3 text-left font-semibold">Détectés</th>
                  <th className="px-3 md:px-4 py-3 text-left font-semibold">Doublons effacés</th>
                  <th className="px-3 md:px-4 py-3 text-left font-semibold">Utilisateur</th>
                  <th className="px-3 md:px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[color:var(--app-border-subtle)]">
                {stats.map((d, idx) => (
                  <StatRow key={d.id} d={d} idx={idx} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
