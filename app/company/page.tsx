"use client"
import Delete from "@/componets/delete"
import Usefetch from "@/hooks/SocieteFetch"
import changeEtat from "@/hooks/Societeusestate"
import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Building2, X, Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

type SortDir = "asc" | "desc" | null
type SortKey = "nom" | "domaine" | "extension" | "created_at" | null

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export default function Company() {
  const { societe, setsociete } = changeEtat()
  const [sucee, setsucee] = useState<any>(null)
  const [err, seterror] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [isEdit, setisedit] = useState(false)
  const [refresh, setRefresh] = useState<number>(0)
  const [deletedata, setDeletedata] = useState(false)
  const [idsociete, setidsociete] = useState<number>(0)

  const [colSearch, setColSearch] = useState<Record<string, string>>({})
  const [activeCol, setActiveCol] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data } = Usefetch(
    `${process.env.NEXT_PUBLIC_API_URL}/societe?refresh=` + refresh
  )

  const filtered = useMemo(() => {
    return (data ?? []).filter((d: any) =>
      (!colSearch.nom        || d.nom?.toLowerCase().includes(colSearch.nom.toLowerCase())) &&
      (!colSearch.domaine    || d.domaine?.toLowerCase().includes(colSearch.domaine.toLowerCase())) &&
      (!colSearch.extension  || d.extension?.toLowerCase().includes(colSearch.extension.toLowerCase())) &&
      (!colSearch.created_at || new Date(d.created_at).toLocaleDateString("fr-FR").includes(colSearch.created_at))
    )
  }, [data, colSearch])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a: any, b: any) => {
      const av = sortKey === "created_at"
        ? new Date(a.created_at).getTime()
        : (a[sortKey] ?? "").toLowerCase()
      const bv = sortKey === "created_at"
        ? new Date(b.created_at).getTime()
        : (b[sortKey] ?? "").toLowerCase()
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc") }
    else if (sortDir === "asc") setSortDir("desc")
    else { setSortKey(null); setSortDir(null) }
    setPage(1)
  }

  const toggleSearch = (key: string) => {
    if (activeCol === key) {
      setActiveCol(null)
      setColSearch((prev) => { const n = { ...prev }; delete n[key]; return n })
    } else {
      setActiveCol(key)
    }
    setPage(1)
  }

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

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) return <ChevronsUpDown size={11} style={{ color: "rgba(255,255,255,0.2)" }} />
    if (sortDir === "asc")  return <ChevronUp size={11} style={{ color: "#818cf8" }} />
    return <ChevronDown size={11} style={{ color: "#818cf8" }} />
  }

  const headers: { label: string; key: SortKey | null; sortable: boolean; searchable: boolean }[] = [
    { label: "Nom",       key: "nom",        sortable: true,  searchable: true  },
    { label: "Domaine",   key: "domaine",    sortable: true,  searchable: true  },
    { label: "Extension", key: "extension",  sortable: true,  searchable: true  },
    { label: "Date",      key: "created_at", sortable: true,  searchable: true  },
    { label: "Actions",   key: null,         sortable: false, searchable: false },
  ]

  const pageNumbers = useMemo(() => {
    const delta = 2
    const range: number[] = []
    for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) range.push(i)
    return range
  }, [safePage, totalPages])

  return (
    <>
      <div
        className="h-full overflow-y-auto p-6 space-y-5"
        style={{ color: "#cbd5e1", background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h1 className="text-white font-semibold text-lg flex items-center gap-2">
              <Building2 size={18} style={{ color: "#818cf8" }} />
              Liste des sociétés
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              {filtered.length} société{filtered.length !== 1 ? "s" : ""}
              {Object.keys(colSearch).length > 0 && (
                <span style={{ color: "#818cf8" }}> · filtrées sur {sorted.length}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {Object.keys(colSearch).length > 0 && (
              <button
                onClick={() => { setColSearch({}); setActiveCol(null); setPage(1) }}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#fda4af" }}
              >
                <X size={11} /> Effacer filtres
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}
            >
              <Plus size={13} /> Ajouter une société
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-left w-10"
                  style={{ color: "rgba(255,255,255,0.2)" }}>#</th>

                {headers.map((h) => (
                  <th
                    key={h.label}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${h.key === null ? "text-center" : "text-left"}`}
                    style={{ color: "rgba(255,255,255,0.3)", verticalAlign: "top", userSelect: "none" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {h.sortable && h.key ? (
                        <button
                          onClick={() => handleSort(h.key as SortKey)}
                          style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", background: "none", border: "none", color: sortKey === h.key ? "#a5b4fc" : "rgba(255,255,255,0.3)", padding: 0 }}
                        >
                          <span>{h.label}</span>
                          <SortIcon colKey={h.key as SortKey} />
                        </button>
                      ) : (
                        <span style={{ flex: 1 }}>{h.label}</span>
                      )}

                      {h.searchable && h.key && (
                        <button
                          onClick={() => toggleSearch(h.key!)}
                          style={{
                            background: colSearch[h.key!] ? "rgba(129,140,248,0.3)" : activeCol === h.key ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.06)",
                            border: colSearch[h.key!] ? "1px solid rgba(129,140,248,0.5)" : "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "4px", padding: "2px 5px", cursor: "pointer", display: "flex", alignItems: "center",
                            color: colSearch[h.key!] ? "#818cf8" : "rgba(255,255,255,0.3)", flexShrink: 0,
                          }}
                        >
                          {colSearch[h.key!] ? <X size={10} /> : <Search size={10} />}
                        </button>
                      )}
                    </div>

                    {h.searchable && h.key && activeCol === h.key && (
                      <div style={{ marginTop: "6px" }}>
                        <input
                          autoFocus
                          value={colSearch[h.key] ?? ""}
                          onChange={(e) => { setColSearch((prev) => ({ ...prev, [h.key!]: e.target.value })); setPage(1) }}
                          placeholder={h.key === "created_at" ? "ex: 22/03/2026" : `Filtrer ${h.label.toLowerCase()}...`}
                          style={{
                            width: "100%", background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.3)",
                            color: "#e2e8f0", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", outline: "none", boxSizing: "border-box",
                          }}
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16" style={{ color: "rgba(255,255,255,0.2)" }}>
                    <div className="text-4xl mb-3">🏢</div>
                    <p className="text-sm">Aucune société trouvée</p>
                  </td>
                </tr>
              ) : (
                paginated.map((d: any, idx: number) => {
                  const globalIdx = (safePage - 1) * pageSize + idx + 1
                  return (
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
                      <td className="px-3 py-3 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>{globalIdx}</td>
                      <td className="px-4 py-3 font-medium text-white">{d.nom}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-md font-medium"
                          style={{ color: "#818cf8", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}>
                          {d.domaine}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-md font-medium"
                          style={{ color: "#6ee7b7", background: "rgba(110,231,183,0.1)", border: "1px solid rgba(110,231,183,0.2)" }}>
                          .{d.extension}
                        </span>
                      </td>
                      {/* ✅ Date */}
                      <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {new Date(d.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => { setisedit(true); setShowForm(true); setsociete({ id: d.id, nom: d.nom, domaine: d.domaine, extension: d.extension }) }}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
                            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc" }}
                          >
                            <Pencil size={11} /> Modifier
                          </button>
                          <button
                            onClick={() => { setDeletedata(true); setidsociete(d.id) }}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
                            style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#fda4af" }}
                          >
                            <Trash2 size={11} /> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span>Lignes par page</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e2e8f0", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", outline: "none", cursor: "pointer",
                }}
              >
                {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              {sorted.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sorted.length)}`} sur {sorted.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <PagBtn onClick={() => setPage(1)} disabled={safePage === 1}><ChevronsLeft size={12} /></PagBtn>
            <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={12} /></PagBtn>

            {pageNumbers[0] > 1 && (
              <>
                <PagBtn onClick={() => setPage(1)}>1</PagBtn>
                {pageNumbers[0] > 2 && <span className="text-xs px-1" style={{ color: "rgba(255,255,255,0.2)" }}>…</span>}
              </>
            )}

            {pageNumbers.map((n) => (
              <PagBtn key={n} onClick={() => setPage(n)} active={n === safePage}>{n}</PagBtn>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="text-xs px-1" style={{ color: "rgba(255,255,255,0.2)" }}>…</span>}
                <PagBtn onClick={() => setPage(totalPages)}>{totalPages}</PagBtn>
              </>
            )}

            <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={12} /></PagBtn>
            <PagBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages}><ChevronsRight size={12} /></PagBtn>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-md rounded-2xl p-6 relative"
            style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
          >
            <button onClick={resetForm} className="absolute top-4 right-4 p-1 rounded-lg"
              style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)" }}>
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
                  key={field.name} name={field.name} placeholder={field.placeholder}
                  value={societe?.[field.name as keyof typeof societe] ?? ""}
                  onChange={handle}
                  className="w-full text-sm px-4 py-2.5 rounded-lg outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                />
              ))}
              <button
                onClick={isEdit ? handleUpdate : handleClick}
                className="w-full text-sm font-semibold py-2.5 rounded-lg mt-1"
                style={{
                  background: isEdit
                    ? "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.2))"
                    : "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))",
                  border: isEdit ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(99,102,241,0.4)",
                  color: isEdit ? "#fcd34d" : "#a5b4fc",
                }}
              >
                {isEdit ? "Modifier" : "Ajouter"}
              </button>
              {sucee && (
                <div className="p-3 rounded-lg text-xs text-center font-medium"
                  style={{ background: "rgba(110,231,183,0.1)", border: "1px solid rgba(110,231,183,0.2)", color: "#6ee7b7" }}>
                  ✅ {sucee}
                </div>
              )}
              {err && (
                <div className="p-3 rounded-lg text-xs text-center font-medium"
                  style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#fda4af" }}>
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

function PagBtn({ children, onClick, disabled = false, active = false }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: "28px", height: "28px", padding: "0 6px", borderRadius: "6px", fontSize: "11px", fontWeight: active ? 600 : 400,
        cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        background: active ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.04)",
        border: active ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)",
        color: active ? "#a5b4fc" : disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)",
        transition: "all 0.1s",
      }}
    >
      {children}
    </button>
  )
}