"use client"
import StatCard from "@/componets/StatsCard"
import { useState } from "react"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [stats, setStats] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: "POST",
        body: formData
      })
      const res = await result.json()
      setStats(res)
    } catch (error) {
      console.error("Échec de l'import", error)
    }
  }

  return (
    <div className="w-full bg-gray-100 flex flex-col items-center justify-center min-h-screen p-4 gap-6">

      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Importer des Leads
        </h2>

        <div className="space-y-6">
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">Cliquez pour importer</span> ou glissez-déposez
              </p>
              <p className="text-xs text-gray-400 mt-1">CSV, XLSX</p>
            </div>
            <input onChange={handleFileChange} type="file" className="hidden" />
          </label>
          {file && (
  <p className="text-sm text-green-600 mt-2 text-center">
    ✅ Fichier sélectionné : {file.name}
  </p>
)}

          <button
            onClick={handleUpload}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Importer le fichier
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          <StatCard title="Doublons supprimés" value={stats.duplicates_deleted} color="bg-red-100" />
          <StatCard title="Emails complétés" value={stats.emails_completed} color="bg-yellow-100" />
          <StatCard title="Leads blacklistés supprimés" value={stats.blacklisted_removed} color="bg-gray-200" />
          <StatCard title="Déplacés vers Prod" value={stats.moved_to_prod} color="bg-blue-100" />
          <StatCard title="Déplacés vers Clean" value={stats["moved to clean"]} color="bg-purple-100" />
        </div>
      )}
    </div>
  )
}

