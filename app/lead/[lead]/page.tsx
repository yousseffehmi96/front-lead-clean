"use client"
import Usefetch from "@/hooks/SocieteFetch"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Upload, Sparkles, RefreshCw, Download, Trash2, Menu, X } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useSelector } from "react-redux"

/*export default function LeadWrapper() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
console.log(isSignedIn);
console.log(isLoaded);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.log("salut");
      router.replace("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || !isSignedIn) return null 

  return <Lead />
}*/
export default function Lead() {
  const [DTableComponent, setDTableComponent] = useState<any>(null)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [stat, setstat] = useState<string | null>(null)
  const [err, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState<number>(0)
  const [uploading, setUploading] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [removingDuplicates, setRemovingDuplicates] = useState(false)
  const [cleanResult, setCleanResult] = useState<any>(null)
  const [uploadedFilename, setUploadedFilename] = useState<string>("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
      const userId = useSelector((state:any) => state.user.userId)
const email = useSelector((state:any) => state.user.email)
  const params = useParams()
  const leads = params.lead

  const data =
    Usefetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${leads}?refresh=${refresh}`
    ).data || []

  useEffect(() => {
      console.log(userId);
      console.log(email);
      
    const load = async () => {
      const [{ default: DataTable }, { default: DT }] = await Promise.all([
        import("datatables.net-react"),
        import("datatables.net-dt"),
      ])
      // @ts-ignore
      await import("datatables.net-dt/css/dataTables.dataTables.css")
      DataTable.use(DT)
      setDTableComponent(() => DataTable)
    }
    load()
  }, [email])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setCleanResult(null)
    setMobileMenuOpen(false)
    try {

      const formData = new FormData()
      formData.append("file", file)
      formData.append("userid", userId.toString())
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`)
      setUploadedFilename(file.name)
      setRefresh((prev) => prev + 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleClean = async () => {
    let db = ""
    setCleaning(true)
    setError(null)
    setCleanResult(null)
    setMobileMenuOpen(false)
    try {
      if (leads === "clean") {
        db = "cleaning_leads"
      } else {
        db = "staging_leads"
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staging-dispatch/${db}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadedFilename || ""),
      })
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`)
      const result = await res.json()
      setCleanResult(result)
      setRefresh((prev) => prev + 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCleaning(false)
    }
  }

  const handleRemoveDuplicates = async () => {
    setRemovingDuplicates(true)
    setError(null)
    setCleanResult(null)
    setMobileMenuOpen(false)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/supprimer-doublons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      }
      
      setCleanResult(data)
      setRefresh((prev) => prev + 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRemovingDuplicates(false)
    }
  }

  const handleToGold = async (leadId: number) => {
    setError(null)
    setCleanResult(null)
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/togold/${leadId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      }
      
      setCleanResult({
        message: data.message || "Lead promu en GOLD avec succès !"
      })
      
      setRefresh((prev) => prev + 1)
    } catch (err: any) {
      let message = err.message.substring(err.message.lastIndexOf(":") + 1)
      setError(message)
    }
  }

  const handelclick = async (type: string, leadId: number) => {
    console.log("hhhh");
    
    setstat(type)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/toblack/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(type),
      })
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`)
      setOpenMenu(null)
      setRefresh((prev) => prev + 1)
    } catch (err: any) {
      setError(err.message)
      setstat(null)
    }
  }

  const downloadCSV = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/download-leads-csv/${leads}`)
    setMobileMenuOpen(false)
  }
  const downloadXlsx = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/download-leads-xlsx/${leads}`)
    setMobileMenuOpen(false)
  }

  const badgeConfig: Record<string, { label: string; color: string; bg: string }> = {
    staging: { label: "RAW",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
    gold:    { label: "★ GOLD",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
    silver:  { label: "◆ SILVER", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
    clean:   { label: "✦ CLEAN",  color: "#6ee7b7", bg: "rgba(110,231,183,0.1)" },
    black:   { label: "⛔ BLACK", color: "#f43f5e", bg: "rgba(244,63,94,0.1)"   },
  }

  const badge = badgeConfig[leads as string] ?? { label: leads, color: "#818cf8", bg: "rgba(129,140,248,0.1)" }

  const searchableCols = new Set(["nom", "prenom", "email", "fonction", "societe", "telephone", "linkedin", "eliminer", "created_at"])

  const baseColumns = [
    { data: "nom",       title: "Nom",       defaultContent: "" },
    { data: "prenom",    title: "Prénom",    defaultContent: "" },
    { data: "email",     title: "Email",     defaultContent: "" },
    { data: "fonction",  title: "Fonction",  defaultContent: "" },
    { data: "societe",   title: "Société",   defaultContent: "" },
    { data: "telephone", title: "Téléphone", defaultContent: "" },
    {
      data: "linkedin", title: "LinkedIn", defaultContent: "",
      render: (val: string) =>
        val ? `<a href="${val}" target="_blank" rel="noopener noreferrer" style="color:#818cf8;text-decoration:underline;">LinkedIn</a>` : "",
    },
  ]

  const blackColumn = { data: "eliminer", title: "Eliminer", defaultContent: "" }

  const prodColumn = {
    data: "id", title: "Action", orderable: false,
    render: (id: number) =>
      `<div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button data-id="${id}" data-type="Unsubscribe" class="dt-action-btn"
          style="padding:4px 10px;border-radius:6px;border:1px solid rgba(244,63,94,0.4);color:#f43f5e;background:rgba(244,63,94,0.08);cursor:pointer;font-size:11px;font-weight:600;">Désabonner</button>
        <button data-id="${id}" data-type="archive" class="dt-action-btn"
          style="padding:4px 10px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);color:#94a3b8;background:rgba(148,163,184,0.08);cursor:pointer;font-size:11px;font-weight:600;">Archiver</button>
      </div>`,
  }

  const silverColumn = {
    data: "id", title: "Action", orderable: false,
    render: (id: number) =>
      `<button data-id="${id}" data-type="to-gold" class="dt-action-btn"
        style="padding:4px 12px;border-radius:6px;border:1px solid rgba(245,158,11,0.4);
        color:#fcd34d;background:rgba(245,158,11,0.08);cursor:pointer;font-size:11px;
        font-weight:600;display:flex;align-items:center;gap:4px;">
        ★ → Gold
      </button>`,
  }

  const dateColumn = {
    data: "created_at", title: "Date",
    render: (val: string) => new Date(val).toLocaleDateString("fr-FR"),
  }

  const columns = [
    ...baseColumns,
    ...(leads === "black"                       ? [blackColumn]  : []),
    ...(leads === "gold" || leads === "prod"    ? [prodColumn]   : []),
    ...(leads === "silver"                      ? [silverColumn] : []),
    dateColumn,
  ]

  const injectSearchIcons = (api: any) => {
    api.columns().every(function (this: any, index: number) {
      const colData = columns[index]?.data
      if (!colData || !searchableCols.has(colData)) return

      const header = api.column(index).header() as HTMLElement
      if (header.querySelector(".search-icon-btn")) return

      const title = header.innerText.trim()
      const sortSpan = header.querySelector(".dt-column-title") as HTMLElement
      const titleText = sortSpan ? sortSpan.innerText.trim() : title
      const existingContent = header.innerHTML

      header.innerHTML = `
        <div style="display:flex;align-items:center;gap:5px;">
          <div style="flex:1;display:flex;align-items:center;gap:3px;">
            ${existingContent}
          </div>
          <button class="search-icon-btn"
            style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
            border-radius:4px;padding:2px 5px;cursor:pointer;color:rgba(255,255,255,0.3);
            display:flex;align-items:center;flex-shrink:0;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>
        <div class="search-wrap" style="display:none;margin-top:5px;">
          ${colData === "created_at"
            ? `<input class="col-search-input" type="date"
                style="width:100%;background:rgba(129,140,248,0.08);border:1px solid rgba(129,140,248,0.3);
                color:#e2e8f0;border-radius:6px;padding:4px 8px;font-size:11px;outline:none;
                box-sizing:border-box;color-scheme:dark;"/>`
            : `<input class="col-search-input" placeholder="Filtrer ${titleText.toLowerCase()}..."
                style="width:100%;background:rgba(129,140,248,0.08);border:1px solid rgba(129,140,248,0.3);
                color:#e2e8f0;border-radius:6px;padding:4px 8px;font-size:11px;outline:none;box-sizing:border-box;"/>`
          }
        </div>
      `

      const btn   = header.querySelector(".search-icon-btn") as HTMLElement
      const wrap  = header.querySelector(".search-wrap") as HTMLElement
      const input = header.querySelector(".col-search-input") as HTMLInputElement

      btn?.addEventListener("click", (e) => {
        e.stopPropagation()
        const open = wrap.style.display !== "none"
        wrap.style.display = open ? "none" : "block"
        if (open) {
          input.value = ""
          api.column(index).search("").draw()
          btn.style.cssText += ";background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3);"
        } else {
          input.focus()
          btn.style.cssText += ";background:rgba(129,140,248,0.2);border-color:rgba(129,140,248,0.4);color:#818cf8;"
        }
      })

      input?.addEventListener("input", (e) => {
        e.stopPropagation()
        let val = (e.target as HTMLInputElement).value
        if (colData === "created_at" && val) {
          val = new Date(val).toLocaleDateString("fr-FR")
        }
        api.column(index).search(val).draw()
        btn.style.cssText += val
          ? ";background:rgba(129,140,248,0.3);border-color:rgba(129,140,248,0.5);color:#818cf8;"
          : ";background:rgba(129,140,248,0.2);border-color:rgba(129,140,248,0.4);color:#818cf8;"
      })

      input?.addEventListener("click", (e) => e.stopPropagation())
    })
  }

  const handleTableClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest(".dt-action-btn") as HTMLElement | null
    if (!btn) return
    const id = Number(btn.dataset.id)
    const type = btn.dataset.type!
    if (type === "to-gold") {
      handleToGold(id)
    } else {
      handelclick(type, id)
    }
  }

  return (
    <div className="h-full rounded-none flex flex-col"
      style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <h2 className="text-white font-semibold text-sm sm:text-base truncate">Liste des Leads</h2>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
            style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.color}30` }}>
            {badge.label}
          </span>
          <span className="text-xs hidden sm:inline" style={{ color: "rgba(255,255,255,0.3)" }}>{data.length} entrées</span>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />

          {leads === "staging" && (
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}>
              <Upload size={13} />{uploading ? "Chargement..." : "Importer"}
            </button>
          )}

          {(leads === "staging" || leads === "clean") && (
            <button onClick={handleClean} disabled={cleaning || data.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}>
              <Sparkles size={13} />{cleaning ? "Nettoyage..." : "Nettoyer"}
            </button>
          )}

          {leads === "gold" && (
            <button onClick={downloadCSV}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(110,231,183,0.15)", border: "1px solid rgba(110,231,183,0.3)", color: "#6ee7b7" }}>
              <Download size={13} />Télécharger CSV
            </button>
          )}
          {leads === "gold" && (
  <button
    onClick={downloadXlsx}
    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
    style={{
      background: "rgba(59, 130, 246, 0.15)", // bleu clair transparent
      border: "1px solid rgba(59, 130, 246, 0.3)", // bord bleu clair
      color: "#3b82f6" // texte bleu
    }}
  >
    <Download size={13} /> Télécharger xlsx
  </button>
)}

          <button onClick={() => setRefresh((p) => p + 1)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center justify-center p-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-3 py-2 flex flex-col gap-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />

          {leads === "staging" && (
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40 w-full"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}>
              <Upload size={14} />{uploading ? "Chargement..." : "Importer"}
            </button>
          )}

          {(leads === "staging" || leads === "clean") && (
            <button onClick={handleClean} disabled={cleaning || data.length === 0}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40 w-full"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}>
              <Sparkles size={14} />{cleaning ? "Nettoyage..." : "Nettoyer"}
            </button>
          )}

          {leads === "gold" && (
            <button onClick={downloadCSV}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg w-full"
              style={{ background: "rgba(110,231,183,0.15)", border: "1px solid rgba(110,231,183,0.3)", color: "#6ee7b7" }}>
              <Download size={14} />Télécharger CSV
            </button>
          )}

          <button onClick={() => { setRefresh((p) => p + 1); setMobileMenuOpen(false); }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg w-full"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
            <RefreshCw size={14} />Actualiser
          </button>
          
          <div className="text-xs text-center py-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            {data.length} entrées
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {err && (
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm"
          style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#fda4af" }}>
          ❌ {err}
        </div>
      )}

      {/* Message de succès pour actions individuelles */}
      {cleanResult && cleanResult.message && !cleanResult.moved_to_gold && !cleanResult.total_deleted && (
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm"
          style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)", color: "#6ee7b7" }}>
          ✅ {cleanResult.message}
        </div>
      )}

      {/* Statistiques de suppression des doublons */}
      {cleanResult && cleanResult.total_deleted !== undefined && (
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm"
          style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fda4af" }}>
          <p className="font-semibold mb-2">🗑️ Suppression des doublons terminée</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Total", val: cleanResult.total_deleted, icon: "🔢" },
               { label: "Staging vs Gold", val: cleanResult.staging_vs_gold, icon: "🥇" },
              { label: "Staging vs Silver", val: cleanResult.staging_vs_silver, icon: "🥈" },
              { label: "Interne", val: cleanResult.staging_internal, icon: "♻️" },
            ].map((item) => (
              <div key={item.label} className="px-2 sm:px-3 py-2 rounded-lg text-center"
                style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.15)" }}>
                <p className="text-xs opacity-70">{item.icon} {item.label}</p>
                <p className="font-bold text-sm sm:text-base">{item.val ?? 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message de succès pour nettoyage */}
      {cleanResult && cleanResult.moved_to_gold !== undefined && (
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm"
          style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)", color: "#6ee7b7" }}>
          <p className="font-semibold mb-2">✅ Nettoyage terminé</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: "🥇 Gold",     val: cleanResult.moved_to_gold },
              { label: "🥈 Silver",   val: cleanResult.moved_to_silver },
              { label: "🧹 Clean",    val: cleanResult.moved_to_clean },
              { label: "📧 Emails complètè",   val: cleanResult.emails_completed },
              { label: "🏢 Sociétés ajoutè", val: cleanResult.added_societes },
              { label: "👤 Noms complètè",     val: cleanResult.nom_prenom_completed },
            ].map((item) => (
              <div key={item.label} className="px-2 sm:px-3 py-2 rounded-lg text-center"
                style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.15)" }}>
                <p className="text-xs opacity-70">{item.label}</p>
                <p className="font-bold text-sm sm:text-base">{item.val ?? 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .dt-container { color: #cbd5e1; font-size: 13px; }
        .dt-container .dt-search label, .dt-container .dt-length label { color: rgba(255,255,255,0.4); font-size: 12px; }
        .dt-container .dt-search input, .dt-container .dt-length select {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #e2e8f0 !important;
          border-radius: 8px; padding: 5px 10px; outline: none;
        }
        .dt-container table.dataTable thead th {
          background: rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
          padding: 10px 16px; vertical-align: top;
          font-size: 11px;
        }
        .dt-container table.dataTable tbody tr {
          background: transparent;
          border-bottom: 1px solid rgba(255,255,255,0.04) !important;
          transition: background 0.1s;
        }
        .dt-container table.dataTable tbody tr:hover { background: rgba(255,255,255,0.03) !important; }
        .dt-container table.dataTable tbody td { 
          color: #cbd5e1; 
          border: none !important; 
          padding: 11px 8px;
          font-size: 12px;
          word-break: break-word;
        }
        .dt-container .dt-paging .dt-paging-button {
          color: rgba(255,255,255,0.4) !important;
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 6px !important; margin: 0 2px; font-size: 12px;
          padding: 4px 8px !important;
        }
        .dt-container .dt-paging .dt-paging-button.current {
          background: rgba(99,102,241,0.3) !important;
          color: #a5b4fc !important;
          border-color: rgba(99,102,241,0.4) !important;
        }
        .dt-container .dt-paging .dt-paging-button:hover:not(.current) {
          background: rgba(255,255,255,0.08) !important; color: white !important;
        }
        .dt-container .dt-info { color: rgba(255,255,255,0.25); font-size: 11px; }
        .dt-container .dt-search { display: none !important; }
        .dt-container .dt-layout-row { padding: 8px 12px; }
        table.dataTable { border-collapse: collapse !important; width: 100% !important; }
        .search-icon-btn:hover { background: rgba(129,140,248,0.15) !important; border-color: rgba(129,140,248,0.3) !important; color: #818cf8 !important; }
        .col-search-input::placeholder { color: rgba(255,255,255,0.2); }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .dt-container { font-size: 11px; }
          .dt-container table.dataTable thead th { 
            padding: 8px 6px !important;
            font-size: 10px;
          }
          .dt-container table.dataTable tbody td { 
            padding: 8px 6px !important;
            font-size: 11px;
          }
          .dt-container .dt-layout-row { padding: 6px 8px; }
          .dt-container .dt-length select { font-size: 11px; padding: 3px 6px; }
          .dt-container .dt-paging .dt-paging-button { 
            font-size: 10px;
            padding: 3px 6px !important;
            margin: 0 1px;
          }
          .dt-container .dt-info { font-size: 10px; }
          
          /* Hide some columns on mobile */
          .dt-container table.dataTable thead th:nth-child(4),
          .dt-container table.dataTable tbody td:nth-child(4),
          .dt-container table.dataTable thead th:nth-child(6),
          .dt-container table.dataTable tbody td:nth-child(6),
          .dt-container table.dataTable thead th:nth-child(7),
          .dt-container table.dataTable tbody td:nth-child(7) {
            display: none;
          }
        }
        
        @media (max-width: 480px) {
          /* Even smaller screens - show only essential columns */
          .dt-container table.dataTable thead th:nth-child(2),
          .dt-container table.dataTable tbody td:nth-child(2) {
            display: none;
          }
          
          .dt-action-btn {
            font-size: 10px !important;
            padding: 3px 6px !important;
          }
        }
        
        /* Horizontal scroll for table on mobile */
        @media (max-width: 768px) {
          .dt-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>

      <div className="px-2 pb-4 pt-2 overflow-y-auto flex-1">
        {!DTableComponent ? (
          <div className="text-center py-16" style={{ color: "rgba(255,255,255,0.2)" }}>
            <div className="text-4xl mb-3">⚡</div>
            <p className="text-sm">Chargement...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.2)" }}>
            <div className="text-5xl mb-4">📭</div>
            <p className="text-base font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Aucune donnée disponible</p>
            {leads === "staging" && (
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                Importez un fichier CSV ou Excel pour commencer
              </p>
            )}
          </div>
        ) : (
          <div onClick={handleTableClick}>
            <DTableComponent
              key={data.length}
              data={data}
              columns={columns}
              className="display w-full"
              options={{
                order: [[columns.length - 1, "desc"]],
                pageLength: 10,
                responsive: true,
                scrollX: true,
                initComplete: function (this: any) {
                  const api = (this as any).api()
                  injectSearchIcons(api)
                },
                language: {
                  processing: "Traitement en cours...",
                  search: "Rechercher :",
                  lengthMenu: "Afficher _MENU_",
                  info: "_START_ à _END_ sur _TOTAL_",
                  infoEmpty: "0 à 0 sur 0",
                  infoFiltered: "(filtré de _MAX_)",
                  loadingRecords: "Chargement...",
                  zeroRecords: "Aucun élément",
                  emptyTable: "Aucune donnée",
                  paginate: { first: "«", previous: "‹", next: "›", last: "»" },
                },
              }}
            >
              <thead>
                <tr>
                  {columns.map((col, i) => (
                    <th key={i}>{col.title}</th>
                  ))}
                </tr>
              </thead>
            </DTableComponent>
          </div>
        )}
      </div>
    </div>
  )
}