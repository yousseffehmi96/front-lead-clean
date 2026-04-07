"use client"
import Delete from "@/componets/delete"
import Usefetch from "@/hooks/SocieteFetch"
import changeEtat from "@/hooks/Societeusestate"
import { useState, useMemo } from "react"
import { 
  Plus, Pencil, Trash2, Building2, X, Search, 
  ChevronUp, ChevronDown, ChevronsUpDown, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight 
} from "lucide-react"
import Navbar from "@/componets/navbar"

type SortDir = "asc" | "desc" | null
type SortKey = "nom" | "domaine" | "extension" | null

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

  // Search per column
  const [colSearch, setColSearch] = useState<Record<string, string>>({})
  const [activeCol, setActiveCol] = useState<string | null>(null)

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data } = Usefetch(
    `${process.env.NEXT_PUBLIC_API_URL}/societe?refresh=` + refresh
  )

  // Logic: Filter
  const filtered = useMemo(() => {
    return (data ?? []).filter((d: any) =>
      (!colSearch.nom       || d.nom?.toLowerCase().includes(colSearch.nom.toLowerCase())) &&
      (!colSearch.domaine   || d.domaine?.toLowerCase().includes(colSearch.domaine.toLowerCase())) &&
      (!colSearch.extension || d.extension?.toLowerCase().includes(colSearch.extension.toLowerCase()))
    )
  }, [data, colSearch])

  // Logic: Sort
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a: any, b: any) => {
      const av = (a[sortKey] ?? "").toLowerCase()
      const bv = (b[sortKey] ?? "").toLowerCase()
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [filtered, sortKey, sortDir])

  // Logic: Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc") }
    else if (sortDir === "asc") setSortDir("desc")
    else if (sortDir === "desc") { setSortKey(null); setSortDir(null) }
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
    if (sortKey !== colKey) return <ChevronsUpDown size={11} className="opacity-20" />
    if (sortDir === "asc")  return <ChevronUp size={11} className="text-indigo-400" />
    return <ChevronDown size={11} className="text-indigo-400" />
  }

  const headers: { label: string; key: SortKey | null; sortable: boolean }[] = [
    { label: "Nom",       key: "nom",       sortable: true  },
    { label: "Domaine",   key: "domaine",   sortable: true  },
    { label: "Extension", key: "extension", sortable: true  },
    { label: "Actions",   key: null,        sortable: false },
  ]

  const pageNumbers = useMemo(() => {
    const delta = 1
    const range: number[] = []
    for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) range.push(i)
    return range
  }, [safePage, totalPages])

  return (
    <>
      <div
        className="min-h-screen flex flex-col p-4 pl-14 md:p-8 space-y-6"
        style={{ color: "#cbd5e1", background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)" }}
      >
        {/* --- HEADER RESPONSIVE --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-white font-bold text-xl flex items-center gap-2">
              <Building2 size={22} className="text-indigo-400" />
              Sociétés
            </h1>
            <p className="text-xs text-white/30 mt-1">
              {filtered.length} résultats trouvés
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {Object.keys(colSearch).length > 0 && (
              <button
                onClick={() => { setColSearch({}); setActiveCol(null); setPage(1) }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300"
              >
                <X size={14} /> Réinitialiser
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-200"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        {/* --- VUE MOBILE (CARTES) --- */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {paginated.length === 0 ? (
            <div className="text-center py-20 opacity-20">Aucune donnée disponible</div>
          ) : (
            paginated.map((d: any, idx: number) => (
              <div 
                key={d.id}
                className="p-5 rounded-2xl space-y-4 border border-white/5 bg-white/5 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400/60">Société</span>
                    <h3 className="text-white font-semibold text-lg leading-tight">{d.nom}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setisedit(true); setShowForm(true); setsociete(d) }}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-indigo-300"
                    >
                      <Pencil size={16}/>
                    </button>
                    <button 
                      onClick={() => { setDeletedata(true); setidsociete(d.id) }}
                      className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/20">Domaine</span>
                    <span className="text-sm text-indigo-200">{d.domaine}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/20">Extension</span>
                    <span className="text-sm text-emerald-400">.{d.extension}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- VUE DESKTOP (TABLEAU) --- */}
        <div className="hidden md:block rounded-2xl overflow-hidden border border-white/5 bg-black/20">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="p-4 text-[11px] font-bold uppercase text-white/20 w-12">#</th>
                {headers.map((h) => (
                  <th key={h.label} className={`p-4 text-[11px] font-bold uppercase text-white/30 ${h.label === "Actions" ? "text-center w-24" : ""}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {h.sortable && h.key ? (
                          <button
                            onClick={() => handleSort(h.key as SortKey)}
                            className={`flex items-center gap-2 hover:text-white transition-colors ${sortKey === h.key ? "text-indigo-400" : ""}`}
                          >
                            {h.label} <SortIcon colKey={h.key as SortKey} />
                          </button>
                        ) : h.label}
                        
                        {h.key && (
                          <button
                            onClick={() => toggleSearch(h.key!)}
                            className={`p-1 rounded ${colSearch[h.key!] ? "bg-indigo-500/20 text-indigo-400" : "text-white/20"}`}
                          >
                            <Search size={12} />
                          </button>
                        )}
                      </div>
                      
                      {h.key && activeCol === h.key && (
                        <input
                          autoFocus
                          value={colSearch[h.key] ?? ""}
                          onChange={(e) => { setColSearch(prev => ({ ...prev, [h.key!]: e.target.value })); setPage(1) }}
                          className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] outline-none focus:border-indigo-500/50"
                          placeholder={`Filtrer...`}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((d: any, idx: number) => (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-white/20 text-xs">{(safePage - 1) * pageSize + idx + 1}</td>
                  <td className="p-4 font-medium text-white">{d.nom}</td>
                  <td className="p-4"><span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20">{d.domaine}</span></td>
                  <td className="p-4"><span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">.{d.extension}</span></td>
                  <td className="p-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => { setisedit(true); setShowForm(true); setsociete(d) }} className="p-2 hover:text-indigo-400"><Pencil size={14}/></button>
                      <button onClick={() => { setDeletedata(true); setidsociete(d.id) }} className="p-2 hover:text-rose-400"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION RESPONSIVE --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
          <div className="flex items-center gap-4 order-2 sm:order-1">
            <div className="flex items-center gap-2 text-xs text-white/30">
              <span>Lignes :</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="bg-white/5 border border-white/10 rounded-md px-2 py-1 outline-none text-white cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
              </select>
            </div>
            <span className="text-[11px] text-white/20">
              {Math.min((safePage - 1) * pageSize + 1, sorted.length)} - {Math.min(safePage * pageSize, sorted.length)} sur {sorted.length}
            </span>
          </div>

          <div className="flex items-center gap-1 order-1 sm:order-2">
            <PagBtn onClick={() => setPage(1)} disabled={safePage === 1}><ChevronsLeft size={14} /></PagBtn>
            <PagBtn onClick={() => setPage(p => p - 1)} disabled={safePage === 1}><ChevronLeft size={14} /></PagBtn>
            
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 mx-1">
               <span className="text-xs font-bold text-indigo-400">{safePage}</span>
               <span className="text-xs text-white/20 mx-2">/</span>
               <span className="text-xs text-white/40">{totalPages}</span>
            </div>

            <PagBtn onClick={() => setPage(p => p + 1)} disabled={safePage === totalPages}><ChevronRight size={14} /></PagBtn>
            <PagBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages}><ChevronsRight size={14} /></PagBtn>
          </div>
        </div>
      </div>

      {/* --- MODAL FORMULAIRE --- */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl p-8 bg-slate-900 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Building2 size={20} className="text-indigo-400" />
                {isEdit ? "Édition" : "Nouvelle Société"}
              </h2>
              <button onClick={resetForm} className="p-2 rounded-full hover:bg-white/5 text-white/30"><X size={18} /></button>
            </div>
            
            <div className="space-y-4">
              {["nom", "domaine", "extension"].map((f) => (
                <div key={f} className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/20 ml-1">{f}</label>
                  <input
                    name={f}
                    placeholder={`Entrer ${f}...`}
                    value={societe?.[f as keyof typeof societe] ?? ""}
                    onChange={handle}
                    className="w-full text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
              ))}
              
              <button
                onClick={isEdit ? handleUpdate : handleClick}
                className={`w-full py-4 rounded-xl font-bold text-sm mt-4 transition-all shadow-lg ${
                  isEdit ? "bg-amber-500 text-amber-950 hover:bg-amber-400" : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                {isEdit ? "Enregistrer les modifications" : "Créer la société"}
              </button>
              
              {sucee && <p className="text-center text-xs text-emerald-400 bg-emerald-500/10 py-2 rounded-lg">✅ {sucee}</p>}
              {err && <p className="text-center text-xs text-rose-400 bg-rose-500/10 py-2 rounded-lg">❌ {err}</p>}
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
      className={`min-w-[36px] h-[36px] rounded-xl flex items-center justify-center transition-all border
        ${disabled ? "opacity-10 cursor-not-allowed border-transparent" : "hover:bg-white/5 border-white/5 text-white/60 active:scale-95"}
        ${active ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : ""}
      `}
    >
      {children}
    </button>
  )
}