"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import Usefetch from "@/hooks/SocieteFetch"
import { Chart, registerables } from "chart.js"
import { ChevronDown, ChevronRight } from "lucide-react"
Chart.register(...registerables)

interface Stat {
  id: number
  filename: string
  inserted_rows: number
  duplicates_deleted: number
  emails_completed: number
  blacklisted_removed: number
  moved_to_gold: number
  moved_to_silver: number
  moved_to_clean: number
  created_at: string
}

const DATASETS = [
  { label: "Insérés",          color: "#818cf8", key: "inserted_rows"       },
  { label: "Doublons",         color: "#f43f5e", key: "duplicates_deleted"  },
  { label: "Emails complétés", color: "#6ee7b7", key: "emails_completed"    },
  { label: "Blacklistés",      color: "#fcd34d", key: "blacklisted_removed" },
  { label: "Vers gold",        color: "#f59e0b", key: "moved_to_gold"       },
  { label: "Vers silver",      color: "#94a3b8", key: "moved_to_silver"     },
  { label: "Vers clean",       color: "#f9a8d4", key: "moved_to_clean"      },
]

const CARD_COLORS = [
  { color: "#818cf8", bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.2)" },
  { color: "#f43f5e", bg: "rgba(244,63,94,0.1)",   border: "rgba(244,63,94,0.2)"   },
  { color: "#6ee7b7", bg: "rgba(110,231,183,0.1)", border: "rgba(110,231,183,0.2)" },
  { color: "#fcd34d", bg: "rgba(252,211,77,0.1)",  border: "rgba(252,211,77,0.2)"  },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)"  },
  { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
  { color: "#f9a8d4", bg: "rgba(249,168,212,0.1)", border: "rgba(249,168,212,0.2)" },
]

function MultiBarChart({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: stats.map(d => d.filename),
        datasets: DATASETS.map(d => ({
          label: d.label,
          data: stats.map(s => s[d.key as keyof Stat] as number),
          backgroundColor: d.color + "cc",
          borderRadius: 4,
          borderSkipped: false,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "rgba(255,255,255,0.3)", font: { size: 10 } },
            border: { color: "rgba(255,255,255,0.06)" },
          },
          y: {
            type: "logarithmic",
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: {
              color: "rgba(255,255,255,0.3)",
              font: { size: 10 },
              callback: (val: string | number) => {
                const num = Number(val)
                return Number.isInteger(Math.log10(num)) || num === 0 ? num : ""
              }
            },
            border: { color: "rgba(255,255,255,0.06)" },
          }
        }
      }
    })
    return () => chart.destroy()
  }, [stats])
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
          borderColor: "rgba(255,255,255,0.05)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: "65%"
      }
    })
    return () => chart.destroy()
  }, [stats])
  return <canvas ref={ref} />
}

function StatRow({ d, idx }: { d: Stat; idx: number }) {
  const [open, setOpen] = useState(false)

  // Détectées = total lignes dans le fichier (insérées + doublons)
  const detected = d.inserted_rows + d.duplicates_deleted
  // Nettoyées = emails + blacklistés + doublons
  const cleaned  = d.emails_completed + d.blacklisted_removed + d.duplicates_deleted
  // Insérées
  const inserted = d.inserted_rows

  const details = [
    { label: "Doublons supprimés",  val: d.duplicates_deleted,  i: 1 },
    { label: "Emails complétés",    val: d.emails_completed,    i: 2 },
    { label: "Blacklistés retirés", val: d.blacklisted_removed, i: 3 },
    { label: "🥇 Gold",             val: d.moved_to_gold,       i: 4 },
    { label: "🥈 Silver",           val: d.moved_to_silver,     i: 5 },
    { label: "🧹 Clean",            val: d.moved_to_clean,      i: 6 },
  ]

  return (
    <>
      {/* Ligne principale */}
      <tr
        style={{
          borderBottom: open ? "none" : "1px solid rgba(255,255,255,0.04)",
          background: open
            ? "rgba(99,102,241,0.07)"
            : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
          transition: "background 0.1s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = open ? "rgba(99,102,241,0.07)" : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)")}
        onClick={() => setOpen(!open)}
      >
        {/* Fichier + icône */}
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

        {/* Détectées */}
        <td className="px-4 py-3">
          <span className="text-xs font-semibold px-2 py-1 rounded-md"
            style={{ color: CARD_COLORS[3].color, background: CARD_COLORS[3].bg, border: `1px solid ${CARD_COLORS[3].border}` }}>
            {detected}
          </span>
        </td>

        {/* Nettoyées */}
        <td className="px-4 py-3">
          <span className="text-xs font-semibold px-2 py-1 rounded-md"
            style={{ color: CARD_COLORS[2].color, background: CARD_COLORS[2].bg, border: `1px solid ${CARD_COLORS[2].border}` }}>
            {cleaned}
          </span>
        </td>

        {/* Insérées */}
        <td className="px-4 py-3">
          <span className="text-xs font-semibold px-2 py-1 rounded-md"
            style={{ color: CARD_COLORS[0].color, background: CARD_COLORS[0].bg, border: `1px solid ${CARD_COLORS[0].border}` }}>
            {inserted}
          </span>
        </td>

        {/* Date */}
        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          {new Date(d.created_at).toLocaleDateString("fr-FR")}
        </td>
      </tr>

      {/* Dropdown détails */}
      {open && (
        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(99,102,241,0.03)" }}>
          <td colSpan={5} style={{ padding: "10px 24px 14px" }}>
            <div className="flex flex-wrap gap-2">
              {details.map(({ label, val, i }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{
                    background: CARD_COLORS[i].bg,
                    border: `1px solid ${CARD_COLORS[i].border}`,
                  }}
                >
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

  const totals = useMemo(() => {
    if (!stats) return null
    return {
      inserted:    stats.reduce((s, d) => s + d.inserted_rows, 0),
      duplicates:  stats.reduce((s, d) => s + d.duplicates_deleted, 0),
      emails:      stats.reduce((s, d) => s + d.emails_completed, 0),
      blacklisted: stats.reduce((s, d) => s + d.blacklisted_removed, 0),
      gold:        stats.reduce((s, d) => s + d.moved_to_gold, 0),
      silver:      stats.reduce((s, d) => s + d.moved_to_silver, 0),
      clean:       stats.reduce((s, d) => s + d.moved_to_clean, 0),
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

  const metricCards = [
    { label: "Total insérés",       value: totals?.inserted    ?? 0 },
    { label: "Doublons supprimés",  value: totals?.duplicates  ?? 0 },
    { label: "Emails complétés",    value: totals?.emails      ?? 0 },
    { label: "Blacklistés retirés", value: totals?.blacklisted ?? 0 },
    { label: "🥇 Gold",             value: totals?.gold        ?? 0 },
    { label: "🥈 Silver",           value: totals?.silver      ?? 0 },
  ]

  return (
    <div
      className="h-full overflow-y-auto p-6 space-y-5"
      style={{
        color: "#cbd5e1",
        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
      }}
    >
      {/* Title */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "16px" }}>
        <h1 className="text-white font-semibold text-lg">Dashboard</h1>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
          {stats.length} imports enregistrés
        </p>
      </div>

      {/* Metric cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {metricCards.map((m, i) => (
            <div key={m.label} className="rounded-xl p-4"
              style={{ background: CARD_COLORS[i].bg, border: `1px solid ${CARD_COLORS[i].border}` }}>
              <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</p>
              <p className="text-2xl font-bold" style={{ color: CARD_COLORS[i].color }}>
                {m.value.toLocaleString("fr-FR")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-medium text-white mb-3">Statistiques par fichier</p>
          <div className="flex flex-wrap gap-3 mb-3">
            {DATASETS.map(d => (
              <span key={d.key} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: d.color }} />
                {d.label}
              </span>
            ))}
          </div>
          <div className="relative h-56"><MultiBarChart stats={stats} /></div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm font-medium text-white mb-3">Répartition des leads insérés</p>
          <div className="flex flex-wrap gap-3 mb-3">
            {stats.map((d, i) => (
              <span key={d.id} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: CARD_COLORS[i % CARD_COLORS.length].color }} />
                {d.filename} {total > 0 ? Math.round((d.inserted_rows / total) * 100) : 0}%
              </span>
            ))}
          </div>
          <div className="relative h-56"><DoughnutChart stats={stats} /></div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Fichier", "Détectées", "Nettoyées", "Insérées", "Date"].map((h) => (
                <th key={h}
                  className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((d, idx) => (
              <StatRow key={d.id} d={d} idx={idx} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}