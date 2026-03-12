"use client"
import Usefetch from "@/hooks/SocieteFetch"
import { useParams } from "next/navigation"
import { Archive, Ban, UserMinus } from "lucide-react"
import { useState } from "react"
export default function Lead() {
const [openMenu, setOpenMenu] = useState<number | null>(null)
const [stat,setstat]=useState<string | null>(null)
const [err,setError]=useState<string | null>(null)
  const [refresh, setRefresh] = useState<number>(0)

  const params = useParams()
  const leads = params.lead

const data = Usefetch(`${process.env.NEXT_PUBLIC_API_URL}/${leads}?refresh=${refresh}`).data || [];const handelclick = async (type: string, leadId: number) => {
  setstat(type)
  
  setError(null)

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/toblack/${leadId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(type)

    })

    if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`)

    setOpenMenu(null)
    setRefresh(prev=>prev+1)

  } catch (err: any) {
    setError(err.message)
    setstat(null)
  } 
}
  const downloadCSV = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/download-leads`)
  }

  return (
    <div className="mt-10 w-full bg-white shadow-lg rounded-xl p-6">

      <div className="flex justify-between items-center mb-4">

        <h2 className="text-xl font-semibold text-gray-800">
          Liste des Leads {leads}
        </h2>

       {leads==="prod" &&<button
          onClick={downloadCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
        >
          Télécharger CSV
        </button>}

      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">

          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Prénom</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Fonction</th>
              <th className="p-3 text-left">Société</th>
              <th className="p-3 text-left">Téléphone</th>
              <th className="p-3 text-left">LinkedIn</th>
              {leads === "prod" && (
  <th className="p-3 text-left">Action</th>
)}
            </tr>
          </thead>

          <tbody>

            {data.length === 0 ? (

              <tr>
                <td colSpan={7} className="text-center p-6 text-gray-500">
                  ❌ Il n'y a pas de données
                </td>
              </tr>

            ) : (

              data.map((lead: any) => (
                <tr key={lead.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3">{lead.nom}</td>
                  <td className="p-3">{lead.prenom}</td>
                  <td className="p-3">{lead.email}</td>
                  <td className="p-3">{lead.fonction}</td>
                  <td className="p-3">{lead.societe}</td>
                  <td className="p-3">{lead.telephone}</td>
                  <td className="p-3">
                    <a
                      href={lead.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      LinkedIn
                    </a>
                  </td>
     {leads === "prod" && (
  <td className="p-3 relative">
    <button
      onClick={() => setOpenMenu(openMenu === lead.id ? null : lead.id)}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150
        ${openMenu === lead.id
          ? "bg-rose-50 border-rose-300 text-rose-600"
          : "bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50"
        }`}
    >
      <Ban size={13} />
      <span>Actions</span>
    </button>

    {openMenu === lead.id && (
      <div className="absolute right-0 top-[calc(100%-4px)] z-50 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
        style={{ animation: "dropIn 0.15s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <style>{`@keyframes dropIn { from { opacity:0; transform:translateY(-6px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }`}</style>

        <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold tracking-widest uppercase text-slate-400">
          Gérer
        </p>

        <div className="p-1.5 flex flex-col gap-0.5">
          <button className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-rose-50 transition-colors group text-left">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-rose-100 text-rose-500">
              <UserMinus size={12} />
            </span>
            <div>
              <p  onClick={()=>handelclick("Unsubscribe",lead.id)} className="text-sm font-medium text-slate-700">Désabonner</p>
            </div>
          </button>

          <div className="h-px bg-slate-100 mx-1" />

          <button className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors group text-left">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-500">
              <Archive size={12} />
            </span>
            <div>
              <p onClick={()=>handelclick("archive",lead.id)} className="text-sm font-medium text-slate-700">Archiver</p>
            </div>
          </button>
        </div>
      </div>
    )}
  </td>
)}
                </tr>
              ))

            )}

          </tbody>

        </table>
      </div>
    </div>
  )
}