"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import Usefetch from "@/hooks/SocieteFetch"
import { Chart, registerables } from "chart.js"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { getUserById } from "@/api/user-actions"
Chart.register(...registerables)

interface Stat {
  id: number
  filename: string
  inserted_rows: number
  duplicates_deleted: number
  emails_completed: number
  societe_completed: number
  added_societes: number
  blacklisted_removed: number
  moved_to_silver: number
  moved_to_clean: number
  moved_to_gold: number
  staging_vs_silver: number
  staging_vs_gold: number
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

const DATASETS = [
  { label: "Insérés", color: "#818cf8", key: "inserted_rows" },
  { label: "Doublons", color: "#f43f5e", key: "duplicates_deleted" },
  { label: "Emails complétés", color: "#6ee7b7", key: "emails_completed" },
  { label: "Sociétés complétées", color: "#22d3ee", key: "societe_completed" },
  { label: "Sociétés ajoutées", color: "#a78bfa", key: "added_societes" },
  { label: "Blacklistés", color: "#fcd34d", key: "blacklisted_removed" },
  { label: "Vers gold", color: "#f59e0b", key: "moved_to_gold" },
  { label: "Vers silver", color: "#94a3b8", key: "moved_to_silver" },
  { label: "Vers clean", color: "#f9a8d4", key: "moved_to_clean" },
  { label: "Supprimés", color: "#f87171", key: "total_deleted" },
]

const CARD_COLORS = [
  { color: "#818cf8", bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.2)" },
  { color: "#f43f5e", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.2)" },
  { color: "#6ee7b7", bg: "rgba(110,231,183,0.1)", border: "rgba(110,231,183,0.2)" },
  { color: "#fcd34d", bg: "rgba(252,211,77,0.1)", border: "rgba(252,211,77,0.2)" },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
  { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
  { color: "#f9a8d4", bg: "rgba(249,168,212,0.1)", border: "rgba(249,168,212,0.2)" },
  { color: "#22d3ee", bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.2)" },
  { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)" },
  { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)" },
]

// Hook pour détecter l'écran mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

function MultiBarChart({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!ref.current) return
    const chart = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: stats.map(d => d.filename.substring(0, 15)), // Raccourcir les labels
        datasets: DATASETS.map(d => ({
          label: d.label,
          data: stats.map(s => s[d.key as keyof Stat] as number),
          backgroundColor: d.color + "cc",
          borderRadius: 4,
          borderSkipped: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "rgba(255,255,255,0.3)",
              font: { size: isMobile ? 8 : 10 },
              maxRotation: isMobile ? 45 : 0,
              minRotation: isMobile ? 45 : 0,
            },
            border: { color: "rgba(255,255,255,0.06)" },
          },
          y: {
            type: "logarithmic",
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: {
              color: "rgba(255,255,255,0.3)",
              font: { size: isMobile ? 8 : 10 },
              callback: (val: string | number) => {
                const num = Number(val)
                return Number.isInteger(Math.log10(num)) || num === 0 ? num : ""
              },
            },
            border: { color: "rgba(255,255,255,0.06)" },
          },
        },
      },
    })
    return () => chart.destroy()
  }, [stats, isMobile])

  return <canvas ref={ref} />
}

function DoughnutChart({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = new Chart(ref.current, {
      type: "doughnut",
      data: {
        labels: stats.map(d => d.filename),
        datasets: [{
          data: stats.map(d => d.inserted_rows),
          backgroundColor: CARD_COLORS.map(c => c.color + "cc"),
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.05)",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        cutout: "65%",
      },
    })

    return () => chart.destroy()
  }, [stats])

  return <canvas ref={ref} />
}

function StatRow({ d, idx }: { d: Stat; idx: number }) {
  const [open, setOpen] = useState(false)
  const [user, setuser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  const detected = (d.inserted_rows ?? 0) + (d.total_deleted ?? 0)
  const cleaned = d.total_deleted ?? 0
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

  const details = [
    { label: "Emails complétés", val: d.emails_completed ?? 0, i: 2 },
    { label: "Sociétés complétées", val: d.societe_completed ?? 0, i: 3 },
    { label: "Sociétés ajoutées", val: d.added_societes ?? 0, i: 4 },
    { label: "Blacklistés retirés", val: d.blacklisted_removed ?? 0, i: 5 },
    { label: "🥇 Gold", val: d.moved_to_gold ?? 0, i: 6 },
    { label: "🥈 Silver", val: d.moved_to_silver ?? 0, i: 7 },
    { label: "🧹 Clean", val: d.moved_to_clean ?? 0, i: 8 },
    { label: "Staging vs Silver", val: d.staging_vs_silver ?? 0, i: 0 },
    { label: "Staging vs Gold", val: d.staging_vs_gold ?? 0, i: 1 },
    { label: "Staging Internal", val: d.staging_internal ?? 0, i: 2 },
  ]

  // Mode mobile : afficher comme une carte
  if (isMobile) {
    return (
      <div className="px-3 py-3 rounded-lg mb-2" style={{ background: open ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", transition: "background 0.2s" }}>
        <div onClick={() => setOpen(!open)} style={{ cursor: "pointer" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span style={{ color: open ? "#818cf8" : "rgba(255,255,255,0.25)" }}>
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
              <span className="text-xs font-medium truncate" style={{ color: open ? "#c7d2fe" : "white" }}>
                {d.filename}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="rounded-lg p-2" style={{ background: CARD_COLORS[3].bg, border: `1px solid ${CARD_COLORS[3].border}` }}>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Détectés</p>
              <p className="text-sm font-bold" style={{ color: CARD_COLORS[3].color }}>{detected}</p>
            </div>
            <div className="rounded-lg p-2" style={{ background: CARD_COLORS[2].bg, border: `1px solid ${CARD_COLORS[2].border}` }}>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Nettoyés</p>
              <p className="text-sm font-bold" style={{ color: CARD_COLORS[2].color }}>{cleaned}</p>
            </div>
            <div className="rounded-lg p-2" style={{ background: CARD_COLORS[0].bg, border: `1px solid ${CARD_COLORS[0].border}` }}>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Insérés</p>
              <p className="text-sm font-bold" style={{ color: CARD_COLORS[0].color }}>{inserted}</p>
            </div>
          </div>

          <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <span>{loading ? "..." : (user?.firstName || userid)}</span>
            <span>{new Date(d.created_at).toLocaleDateString("fr-FR")}</span>
          </div>
        </div>

        {open && (
          <div className="mt-3 pt-3 border-t border-rgba(255,255,255,0.06)" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex flex-wrap gap-2">
              {details.map(({ label, val, i }) => (
                <div key={label} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: CARD_COLORS[i].bg, border: `1px solid ${CARD_COLORS[i].border}` }}>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
                  <span style={{ color: CARD_COLORS[i].color, fontWeight: "600" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Mode desktop : afficher comme une table
  return (
    <>
      <tr
        style={{
          borderBottom: open ? "none" : "1px solid rgba(255,255,255,0.04)",
          background: open ? "rgba(99,102,241,0.07)" : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
          transition: "background 0.1s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = open ? "rgba(99,102,241,0.07)" : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)")}
        onClick={() => setOpen(!open)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span style={{ color: open ? "#818cf8" : "rgba(255,255,255,0.25)", transition: "color 0.15s" }}>
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            <span className="text-xs font-medium" style={{ color: open ? "#c7d2fe" : "white" }}>
              {d.filename}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ color: CARD_COLORS[3].color, background: CARD_COLORS[3].bg, border: `1px solid ${CARD_COLORS[3].border}` }}>
            {detected}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ color: CARD_COLORS[2].color, background: CARD_COLORS[2].bg, border: `1px solid ${CARD_COLORS[2].border}` }}>
            {cleaned}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ color: CARD_COLORS[0].color, background: CARD_COLORS[0].bg, border: `1px solid ${CARD_COLORS[0].border}` }}>
            {inserted}
          </span>
        </td>
        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          {loading ? (
            <span style={{ color: "rgba(255,255,255,0.2)" }}>...</span>
          ) : user ? (
            <span style={{ color: "rgba(255,255,255,0.6)" }}>
              {user.firstName}
            </span>
          ) : (
            <span style={{ color: "rgba(255,255,255,0.2)" }}>{userid}</span>
          )}
        </td>

        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          {new Date(d.created_at).toLocaleDateString("fr-FR")}
        </td>
      </tr>
      {open && (
        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(99,102,241,0.03)" }}>
          <td colSpan={6} style={{ padding: "10px 24px 14px" }}>
            <div className="flex flex-wrap gap-2">
              {details.map(({ label, val, i }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: CARD_COLORS[i].bg, border: `1px solid ${CARD_COLORS[i].border}` }}>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
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
  const { data } = Usefetch(`${process.env.NEXT_PUBLIC_API_URL}/stat`)
  const stats = data as Stat[]
  const isMobile = useIsMobile()

  const totals = useMemo(() => {
    if (!stats) return null
    return {
      inserted: stats.reduce((s, d) => s + d.inserted_rows, 0),
      duplicates: stats.reduce((s, d) => s + d.duplicates_deleted, 0),
      emails: stats.reduce((s, d) => s + d.emails_completed, 0),
      societe: stats.reduce((s, d) => s + d.societe_completed, 0),
      added_societes: stats.reduce((s, d) => s + d.added_societes, 0),
      blacklisted: stats.reduce((s, d) => s + d.blacklisted_removed, 0),
      gold: stats.reduce((s, d) => s + d.moved_to_gold, 0),
      silver: stats.reduce((s, d) => s + d.moved_to_silver, 0),
      clean: stats.reduce((s, d) => s + d.moved_to_clean, 0),
      total_deleted: stats.reduce((s, d) => s + d.total_deleted, 0),
    }
  }, [stats])

  const total = totals?.inserted ?? 0

  if (!stats) return (
    <div className="flex items-center justify-center h-full" style={{ color: "rgba(255,255,255,0.2)" }}>
      <div className="text-center">
        <div className="text-4xl mb-3">⚡</div>
        <p className="text-sm">Chargement...</p>
      </div>
    </div>
  )

  // Afficher moins de cartes sur mobile
  const metricCards = isMobile
    ? [
      { label: "Total insérés", value: totals?.inserted ?? 0 },
      { label: "Emails", value: totals?.emails ?? 0 },
      { label: "Sociétés", value: totals?.societe ?? 0 },
      { label: "Supprimés", value: totals?.total_deleted ?? 0 },
    ]
    : [
      { label: "Total insérés", value: totals?.inserted ?? 0 },
      { label: "Emails complétés", value: totals?.emails ?? 0 },
      { label: "Sociétés complétées", value: totals?.societe ?? 0 },
      { label: "Sociétés ajoutées", value: totals?.added_societes ?? 0 },
      { label: "Blacklistés retirés", value: totals?.blacklisted ?? 0 },
      { label: "🥇 Gold", value: totals?.gold ?? 0 },
      { label: "🥈 Silver", value: totals?.silver ?? 0 },
      { label: "Supprimés", value: totals?.total_deleted ?? 0 },
    ]

  return (
    <div className="h-full overflow-y-auto" style={{ color: "#cbd5e1", background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)", padding: isMobile ? "1rem" : "1.5rem" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <h1 className="text-white font-semibold" style={{ fontSize: isMobile ? "1.25rem" : "1.125rem" }}>Dashboard</h1>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{stats.length} imports enregistrés</p>
      </div>

      {totals && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {metricCards.map((m, i) => (
            <div key={m.label} className="rounded-xl p-3" style={{ background: CARD_COLORS[i % CARD_COLORS.length].bg, border: `1px solid ${CARD_COLORS[i % CARD_COLORS.length].border}` }}>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</p>
              <p style={{ fontSize: isMobile ? "1rem" : "1.5rem", fontWeight: "bold", color: CARD_COLORS[i % CARD_COLORS.length].color }}>{m.value.toLocaleString("fr-FR")}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts - En colonne sur mobile, en grille sur desktop */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-medium text-white mb-2">Statistiques par fichier</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {DATASETS.slice(0, isMobile ? 5 : 10).map(d => (
              <span key={d.key} className="flex items-center gap-1" style={{ fontSize: isMobile ? "0.7rem" : "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: d.color, minWidth: "0.5rem", minHeight: "0.5rem" }} />
                {d.label}
              </span>
            ))}
          </div>
          <div style={{ position: "relative", height: isMobile ? "200px" : "224px" }}><MultiBarChart stats={stats} /></div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-medium text-white mb-2">Répartition des leads</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {stats.slice(0, isMobile ? 3 : 6).map((d, i) => (
              <span key={d.id} style={{ fontSize: isMobile ? "0.7rem" : "0.75rem", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: CARD_COLORS[i % CARD_COLORS.length].color, minWidth: "0.5rem", minHeight: "0.5rem" }} />
                {d.filename.substring(0, isMobile ? 10 : 20)} {total > 0 ? Math.round((d.inserted_rows / total) * 100) : 0}%
              </span>
            ))}
          </div>
          <div style={{ position: "relative", height: isMobile ? "200px" : "224px" }}><DoughnutChart stats={stats} /></div>
        </div>
      </div>

      {/* Tableau ou Cartes */}
      {isMobile ? (
        <div style={{ marginBottom: "1rem" }}>
          <p className="text-sm font-medium text-white mb-2">Détails des imports</p>
          {stats.map((d, idx) => <StatRow key={d.id} d={d} idx={idx} />)}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <table className="w-full text-sm table-auto border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th className="px-4 py-3 text-left text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Fichier</th>
                <th className="px-4 py-3 text-left text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Détectés</th>
                <th className="px-4 py-3 text-left text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Nettoyés</th>
                <th className="px-4 py-3 text-left text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Insérés</th>
                <th className="px-4 py-3 text-left text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>User</th>
                <th className="px-4 py-3 text-left text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((d, idx) => <StatRow key={d.id} d={d} idx={idx} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}