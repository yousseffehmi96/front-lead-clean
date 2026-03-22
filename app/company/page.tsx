"use client"
import Delete from "@/componets/delete"
import Usefetch from "@/hooks/SocieteFetch"
import changeEtat from "@/hooks/Societeusestate"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Building2, X } from "lucide-react"

export default function Company() {
  const { societe, setsociete } = changeEtat()
  const [sucee, setsucee] = useState<any>(null)
  const [err, seterror] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [isEdit, setisedit] = useState(false)
  const [refresh, setRefresh] = useState<number>(0)
  const [deletedata, setDeletedata] = useState(false)
  const [idsociete, setidsociete] = useState<number>(0)
  const [search, setSearch] = useState("")

  const { data } = Usefetch(
    `${process.env.NEXT_PUBLIC_API_URL}/societe?refresh=` + refresh
  )

  const filtered = data?.filter((d: any) =>
    [d.nom, d.domaine, d.extension]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  ) ?? []

  const handle = (e: any) => {
    const { name, value } = e.target
    setsociete((prev: any) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setShowForm(false)
    setisedit(false)
    setsociete({ id: "", nom: "", domaine: "", extension: "" })
    seterror("")
    setsucee("")
  }

  const handleUpdate = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/societe/${societe.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(societe),
    })
    if (!res.ok) { seterror((await res.json()).detail); return }
    seterror(null)
    setRefresh((p) => p + 1)
    setsucee((await res.json()).message)
  }

  const handleClick = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/societe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(societe),
      })
      if (!res.ok) { seterror((await res.json()).detail); return }
      seterror(null)
      setRefresh((p) => p + 1)
      setsucee((await res.json()).message)
      setsociete({ id: "", nom: "", domaine: "", extension: "" })
    } catch (error) {
      seterror(error)
    }
  }

  return (
    <>
      <div className="h-full overflow-y-auto p-6 space-y-5" style={{ color: "#cbd5e1" }}>

        {/* Page title */}
        <div
          className="flex justify-between items-center pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <h1 className="text-white font-semibold text-lg flex items-center gap-2">
              <Building2 size={18} style={{ color: "#818cf8" }} />
              Liste des sociétés
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              {filtered.length} sociétés
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#a5b4fc",
            }}
          >
            <Plus size={13} />
            Ajouter une société
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, domaine, extension..."
            className="w-full text-sm px-4 py-2.5 rounded-lg outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e2e8f0",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Nom", "Domaine", "Extension", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${h === "Actions" ? "text-center" : "text-left"}`}
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16" style={{ color: "rgba(255,255,255,0.2)" }}>
                    <div className="text-4xl mb-3">🏢</div>
                    <p className="text-sm">Aucune société trouvée</p>
                  </td>
                </tr>
              ) : (
                filtered.map((d: any, idx: number) => (
                  <tr
                    key={d.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)")}
                  >
                    <td className="px-4 py-3 font-medium text-white">{d.nom}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-1 rounded-md font-medium"
                        style={{
                          color: "#818cf8",
                          background: "rgba(129,140,248,0.1)",
                          border: "1px solid rgba(129,140,248,0.2)",
                        }}
                      >
                        {d.domaine}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-1 rounded-md font-medium"
                        style={{
                          color: "#6ee7b7",
                          background: "rgba(110,231,183,0.1)",
                          border: "1px solid rgba(110,231,183,0.2)",
                        }}
                      >
                        .{d.extension}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setisedit(true)
                            setShowForm(true)
                            setsociete({ id: d.id, nom: d.nom, domaine: d.domaine, extension: d.extension })
                          }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                          style={{
                            background: "rgba(99,102,241,0.1)",
                            border: "1px solid rgba(99,102,241,0.2)",
                            color: "#a5b4fc",
                          }}
                        >
                          <Pencil size={11} />
                          Modifier
                        </button>
                        <button
                          onClick={() => { setDeletedata(true); setidsociete(d.id) }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                          style={{
                            background: "rgba(244,63,94,0.1)",
                            border: "1px solid rgba(244,63,94,0.2)",
                            color: "#fda4af",
                          }}
                        >
                          <Trash2 size={11} />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-md rounded-2xl p-6 relative"
            style={{
              background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            {/* Close */}
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 p-1 rounded-lg transition-all"
              style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)" }}
            >
              <X size={14} />
            </button>

            <h2 className="text-white font-semibold text-base mb-5 flex items-center gap-2">
              <Building2 size={16} style={{ color: "#818cf8" }} />
              {isEdit ? "Modifier une société" : "Ajouter une société"}
            </h2>

            <div className="space-y-3">
              {[
                { name: "nom",       placeholder: "Nom de la société" },
                { name: "domaine",   placeholder: "Domaine (ex: capgemini)" },
                { name: "extension", placeholder: "Extension (ex: com, fr)" },
              ].map((field) => (
                <input
                  key={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
value={societe?.[field.name as keyof typeof societe] ?? ""}
                  onChange={handle}
                  className="w-full text-sm px-4 py-2.5 rounded-lg outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#e2e8f0",
                  }}
                />
              ))}

              <button
                onClick={isEdit ? handleUpdate : handleClick}
                className="w-full text-sm font-semibold py-2.5 rounded-lg transition-all mt-1"
                style={{
                  background: isEdit
                    ? "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.2))"
                    : "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))",
                  border: isEdit
                    ? "1px solid rgba(245,158,11,0.4)"
                    : "1px solid rgba(99,102,241,0.4)",
                  color: isEdit ? "#fcd34d" : "#a5b4fc",
                }}
              >
                {isEdit ? "Modifier" : "Ajouter"}
              </button>

              {sucee && (
                <div
                  className="p-3 rounded-lg text-xs text-center font-medium"
                  style={{ background: "rgba(110,231,183,0.1)", border: "1px solid rgba(110,231,183,0.2)", color: "#6ee7b7" }}
                >
                  ✅ {sucee}
                </div>
              )}

              {err && (
                <div
                  className="p-3 rounded-lg text-xs text-center font-medium"
                  style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#fda4af" }}
                >
                  ❌ {err}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {deletedata && <Delete deletes={setDeletedata} setRefresh={setRefresh} id={idsociete} />}
    </>
  )
}