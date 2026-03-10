"use client"
import Usefetch from "@/hooks/SocieteFetch"
import { useParams } from "next/navigation"

export default function Lead() {

  const params = useParams()
  const lead = params.lead

  const data = Usefetch(`${process.env.NEXT_PUBLIC_API_URL}/${lead}`).data || []

  const downloadCSV = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/download-leads`)
  }

  return (
    <div className="mt-10 w-full bg-white shadow-lg rounded-xl p-6">

      <div className="flex justify-between items-center mb-4">

        <h2 className="text-xl font-semibold text-gray-800">
          Liste des Leads {lead}
        </h2>

       {lead==="prod" &&<button
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
                </tr>
              ))

            )}

          </tbody>

        </table>
      </div>
    </div>
  )
}