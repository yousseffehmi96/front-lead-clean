"use client"

import { useMemo, useRef, useEffect } from "react"
import Usefetch from "@/hooks/SocieteFetch"
import { Chart, registerables } from "chart.js"
Chart.register(...registerables)

interface Stat {
  id: number
  filename: string
  inserted_rows: number
  duplicates_deleted: number
  emails_completed: number
  blacklisted_removed: number
  moved_to_prod: number
  moved_to_clean: number
  created_at: string
}

const DATASETS = [
  { label: "Insérés",          color: "#185FA5", key: "inserted_rows"       },
  { label: "Doublons",         color: "#E24B4A", key: "duplicates_deleted"  },
  { label: "Emails complétés", color: "#1D9E75", key: "emails_completed"    },
  { label: "Blacklistés",      color: "#BA7517", key: "blacklisted_removed" },
  { label: "Vers prod",        color: "#534AB7", key: "moved_to_prod"       },
  { label: "Vers clean",       color: "#D4537E", key: "moved_to_clean"      },
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
          backgroundColor: d.color,
          borderRadius: 4,
          borderSkipped: false,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: {
            type: "logarithmic",
            grid: { color: "#e5e7eb" },
            ticks: {
  callback: (val: string | number) => {
    const num = Number(val)
    return Number.isInteger(Math.log10(num)) || num === 0 ? num : ""
  }
}
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
          backgroundColor: ["#185FA5", "#1D9E75", "#D85A30", "#7F77DD", "#BA7517"],
          borderWidth: 2,
          borderColor: "#fff"
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
      prod:        stats.reduce((s, d) => s + d.moved_to_prod, 0),
      clean:       stats.reduce((s, d) => s + d.moved_to_clean, 0),
    }
  }, [stats])

  const total = totals?.inserted ?? 0

  if (!stats) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      Chargement...
    </div>
  )

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-xl font-medium text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{stats.length} imports enregistrés</p>
      </div>

      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Total insérés",       value: totals.inserted    },
            { label: "Doublons supprimés",  value: totals.duplicates  },
            { label: "Emails complétés",    value: totals.emails      },
            { label: "Blacklistés retirés", value: totals.blacklisted },
            { label: "Passés en prod",      value: totals.prod        },
            { label: "Passés en clean",     value: totals.clean       },
          ].map((m) => (
            <div key={m.label} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">{m.label}</p>
              <p className="text-2xl font-medium text-gray-900">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-3">Statistiques par fichier</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {DATASETS.map(d => (
              <span key={d.key} className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: d.color }} />
                {d.label}
              </span>
            ))}
          </div>
          <div className="relative h-64">
            <MultiBarChart stats={stats} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-3">Répartition des leads insérés</p>
          <div className="flex flex-wrap gap-3 mb-3">
            {stats.map((d, i) => (
              <span key={d.id} className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ background: ["#185FA5","#1D9E75","#D85A30","#7F77DD","#BA7517"][i % 5] }} />
                {d.filename} {total > 0 ? Math.round((d.inserted_rows / total) * 100) : 0}%
              </span>
            ))}
          </div>
          <div className="relative h-64">
            <DoughnutChart stats={stats} />
          </div>
        </div>

      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100">
            <tr>
              {["Fichier", "Insérés", "Doublons", "Emails", "Blacklistés", "Prod", "Clean", "Date"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((d) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{d.filename}</td>
                <td className="px-4 py-3">
                  <span className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded">{d.inserted_rows}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-red-50 text-red-800 text-xs px-2 py-1 rounded">{d.duplicates_deleted}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-green-50 text-green-800 text-xs px-2 py-1 rounded">{d.emails_completed}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-amber-50 text-amber-800 text-xs px-2 py-1 rounded">{d.blacklisted_removed}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-purple-50 text-purple-800 text-xs px-2 py-1 rounded">{d.moved_to_prod}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-pink-50 text-pink-800 text-xs px-2 py-1 rounded">{d.moved_to_clean}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(d.created_at).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}