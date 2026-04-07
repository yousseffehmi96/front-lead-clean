"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import Usefetch from "@/hooks/SocieteFetch"
import { Chart, registerables } from "chart.js"
import { ChevronDown, ChevronRight } from "lucide-react"
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
  total_deleted: number
  iduser: string
  created_at: string
}

type User = {
  id: string
  firstName: string
}

const DATASETS = [
  { label: "Insérés", color: "#818cf8", key: "inserted_rows" },
  { label: "Doublons", color: "#f43f5e", key: "duplicates_deleted" },
]

const CARD_COLORS = [
  { color: "#818cf8", bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.2)" },
  { color: "#f43f5e", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.2)" },
]

/* ================= CHART ================= */
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
          backgroundColor: d.color,
        })),
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
      },
    })

    return () => chart.destroy()
  }, [stats])

  return <canvas ref={ref} />
}

/* ================= ROW ================= */
function StatRow({ d }: { d: Stat }) {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!d.iduser) return
    getUserById(d.iduser).then(setUser)
  }, [d.iduser])

  return (
    <>
      <tr onClick={() => setOpen(!open)} className="cursor-pointer hover:bg-white/5">
        <td className="px-2 md:px-4 py-2 truncate max-w-[120px]">
          {d.filename}
        </td>
        <td className="px-2 md:px-4 py-2">{d.inserted_rows}</td>
        <td className="px-2 md:px-4 py-2">{d.total_deleted}</td>
        <td className="px-2 md:px-4 py-2">
          {user?.firstName || "..."}
        </td>
        <td className="px-2 md:px-4 py-2 text-xs">
          {new Date(d.created_at).toLocaleDateString()}
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={5} className="p-3 bg-white/5">
            <div className="flex flex-wrap gap-2 text-xs">
              <span>Emails: {d.emails_completed}</span>
              <span>Sociétés: {d.societe_completed}</span>
              <span>Ajoutées: {d.added_societes}</span>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ================= MAIN ================= */
export default function Dashboard() {
  const { data } = Usefetch(`${process.env.NEXT_PUBLIC_API_URL}/stat`)
  const stats = data as Stat[]

  const totals = useMemo(() => {
    if (!stats) return null
    return {
      inserted: stats.reduce((s, d) => s + d.inserted_rows, 0),
      deleted: stats.reduce((s, d) => s + d.total_deleted, 0),
    }
  }, [stats])

  if (!stats) {
    return (
      <div className="h-screen flex items-center justify-center text-white/50">
        Chargement...
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-3 md:p-6 space-y-4 text-white bg-gradient-to-br from-slate-900 to-indigo-900">

      {/* HEADER */}
      <div>
        <h1 className="text-base md:text-lg font-semibold">Dashboard</h1>
        <p className="text-xs text-white/40">
          {stats.length} imports
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
        <div className="p-3 md:p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-xs text-white/50">Insérés</p>
          <p className="text-lg md:text-2xl font-bold">{totals?.inserted}</p>
        </div>

        <div className="p-3 md:p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-white/50">Supprimés</p>
          <p className="text-lg md:text-2xl font-bold">{totals?.deleted}</p>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white/5 p-3 rounded-xl">
        <div className="h-40 md:h-56">
          <MultiBarChart stats={stats} />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-[600px] w-full text-xs md:text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-2 md:px-4 py-2 text-left">Fichier</th>
              <th className="px-2 md:px-4 py-2">Insérés</th>
              <th className="px-2 md:px-4 py-2">Supprimés</th>
              <th className="px-2 md:px-4 py-2">User</th>
              <th className="px-2 md:px-4 py-2">Date</th>
            </tr>
          </thead>

          <tbody>
            {stats.map(d => (
              <StatRow key={d.id} d={d} />
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}