"use client"
import Usefetch from "@/hooks/SocieteFetch"
import { useEffect, useMemo, useRef, useState } from "react"
import { Briefcase, Building, Calendar, ChevronDown, ChevronUp, Download, Eye, Filter, Inbox, Linkedin, Loader2, Mail, MapPin, Menu, Phone, RefreshCw, Sparkles, Trash2, Upload, User, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useSelector } from "react-redux"
import { getLeadBadge } from "@/lib/theme"

export default function ProdPage() {
  const leads = "prod"
  const [DTableComponent, setDTableComponent] = useState<any>(null)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [stat, setstat] = useState<string | null>(null)
  const [err, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState<number>(0)
  const [cleanResult, setCleanResult] = useState<any>(null)
  const [uploadedRows, setUploadedRows] = useState<number>(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [mobileView, setMobileView] = useState<"table" | "cards">("cards")
  const [searchTerm, setSearchTerm] = useState("")
  const [mobilePage, setMobilePage] = useState(1)
  const userId = useSelector((state:any) => state.user.userId)
  const email = useSelector((state:any) => state.user.email)
  const { user, isLoaded } = useUser()
  const userRole = ((user?.publicMetadata?.role as string) || "agent").toLowerCase()
  const isManager = userRole === "manager"
  const isStaging = false
  const isSelectableList = false
  const isSteagingApplique = false

  const rawData = Usefetch(`${process.env.NEXT_PUBLIC_API_URL}/${leads}?refresh=${refresh}`).data || []

  const data = rawData

  // Détection mobile
  const [isMobile, setIsMobile] = useState(false)
  const isIncompleteView = false
  const isVerifiableView = false
  const shouldUseDataTable = !isMobile
  const cardsPerPage = 20

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile && mobileView !== "cards") {
      setMobileView("cards")
    }
  }, [isMobile, mobileView])

  useEffect(() => {
    if (!shouldUseDataTable) return
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
  }, [email, shouldUseDataTable])


  useEffect(() => {
    setMobilePage(1)
  }, [searchTerm, leads, refresh])

  // Filtrage pour la vue mobile
  const filteredData = data.filter((item: any) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      item.nom?.toLowerCase().includes(searchLower) ||
      item.prenom?.toLowerCase().includes(searchLower) ||
      item.email?.toLowerCase().includes(searchLower) ||
      item.societe?.toLowerCase().includes(searchLower) ||
      item.fonction?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower)
    )
  })
  const totalMobilePages = Math.max(1, Math.ceil(filteredData.length / cardsPerPage))
  const startIndex = (mobilePage - 1) * cardsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + cardsPerPage)

  const handelclick = async (type: string, leadId: number) => {
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

  const badge = getLeadBadge(leads)

  // Composant Carte mobile
  const MobileCard = ({ lead, index }: { lead: any; index: number }) => {
    const isExpanded = expandedCard === index
    const hasActionButtons = leads === "prod"

    return (
      <div
        className="app-card app-card-hover mb-3"
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-3 gap-2">
            <div className="flex-1">
              <h3 className="text-[color:var(--app-text)] font-semibold text-base">
                {lead.prenom} {lead.nom}
              </h3>
              {lead.fonction && (
                <p className="text-xs mt-1" style={{ color: "var(--app-text-muted)" }}>
                  <Briefcase size={10} className="inline mr-1" />
                  {lead.fonction}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedCard(isExpanded ? null : index)}
                className="p-1 rounded-lg transition-colors"
                style={{ background: "var(--app-surface-hover)" }}
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {lead.email && (
              <div
                className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg"
                style={{
                  border: "1px solid var(--app-border)",
                  background: "transparent",
                }}
              >
                <Mail size={12} style={{ color: "var(--app-text-faint)" }} />
                <a href={`mailto:${lead.email}`} className="text-blue-400 text-xs truncate flex-1 min-w-0">
                  {lead.email}
                </a>
              </div>
            )}
            {lead.telephone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={12} style={{ color: "var(--app-text-faint)" }} />
                <a href={`tel:${lead.telephone}`} className="text-green-400 text-xs">
                  {lead.telephone}
                </a>
              </div>
            )}
            {lead.societe && (
              <div className="flex items-center gap-2 text-sm">
                <Building size={12} style={{ color: "var(--app-text-faint)" }} />
                <span className="text-xs" style={{ color: "var(--app-text-secondary)" }}>{lead.societe}</span>
              </div>
            )}
            {lead.linkedin && (
              <div className="flex items-center gap-2 text-sm">
                <Linkedin size={12} style={{ color: "var(--app-text-faint)" }} />
                <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs truncate flex-1 min-w-0">
                  Profil LinkedIn
                </a>
              </div>
            )}
            {lead.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={12} style={{ color: "var(--app-text-faint)" }} />
                <span className="text-xs" style={{ color: "var(--app-text-secondary)" }}>{lead.location}</span>
              </div>
            )}
          </div>

          {lead.created_at && (
            <div className="mt-3 pt-2 text-xs" style={{ borderTop: "1px solid var(--app-border-subtle)", color: "var(--app-text-faint)" }}>
              <Calendar size={10} className="inline mr-1" />
              {new Date(lead.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
            </div>
          )}

          {hasActionButtons && isExpanded && (
            <div className="mt-4 pt-3 flex flex-col sm:flex-row gap-2" style={{ borderTop: "1px solid var(--app-border-subtle)" }}>
              {leads === "prod" && (
                <>
                  <button
                    onClick={() => handelclick("Unsubscribe", lead.id)}
                    className="app-btn app-btn-sm app-btn-danger flex-1"
                  >
                    Désabonner
                  </button>
                  <button
                    onClick={() => handelclick("archive", lead.id)}
                    className="app-btn app-btn-sm app-btn-secondary flex-1"
                  >
                    Archiver
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Configuration DataTable (inchangée)
  const searchableCols = new Set(["nom", "prenom", "email", "fonction", "societe", "telephone", "linkedin", "location", "statu", "eliminer", "created_at"])
  const baseColumns = [
    { data: "nom", title: "Nom", defaultContent: "" },
    { data: "prenom", title: "Prénom", defaultContent: "" },
    {
      data: "email",
      title: "Email",
      defaultContent: "",
      render: (val: string, _t: any, row: any) => {
        const id = Number(row?.id)
        const value = val ? String(val) : ""
        const text = value ? value : ""
        const opacity = value ? 1 : 0.55
        const pill = `<span class="dt-email-pill" data-id="${id}" style="display:block;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:4px 8px;border-radius:8px;border:1px solid var(--app-border);background:transparent;color:var(--app-text-secondary);opacity:${opacity};">${text || ""}</span>`
        return `<div>${pill}</div>`
      },
    },
    { data: "fonction", title: "Fonction", defaultContent: "" },
    { data: "societe", title: "Société", defaultContent: "" },
    { data: "telephone", title: "Téléphone", defaultContent: "" },
    { data: "linkedin", title: "LinkedIn", defaultContent: "", render: (val: string) => val ? `<a href="${val}" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;text-decoration:underline;">LinkedIn</a>` : "" },
    { data: "location", title: "Location", defaultContent: "" },
    {
      data: "statu",
      title: "Statut",
      defaultContent: "",
      render: (val: string) => {
        if (!val) return `<span style="color:var(--app-text-faint);font-size:11px;">—</span>`
        const v = String(val)
        const isUnavailable = v.toLowerCase().includes("non")
        const color = isUnavailable ? "#e11d48" : "#059669"
        const bg = isUnavailable ? "rgba(244,63,94,0.1)" : "rgba(34,197,94,0.1)"
        const border = isUnavailable ? "rgba(244,63,94,0.3)" : "rgba(34,197,94,0.3)"
        return `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;color:${color};background:${bg};border:1px solid ${border};white-space:nowrap;">${v}</span>`
      },
    },
  ]
  const prodColumn = { data: "id", title: "Action", orderable: false, render: (id: number) => `<div style="display:flex;gap:6px;flex-wrap:wrap;"><button data-id="${id}" data-type="Unsubscribe" class="dt-action-btn" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(244,63,94,0.4);color:#e11d48;background:rgba(244,63,94,0.08);cursor:pointer;font-size:11px;font-weight:600;">Désabonner</button><button data-id="${id}" data-type="archive" class="dt-action-btn" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);color:#64748b;background:rgba(148,163,184,0.08);cursor:pointer;font-size:11px;font-weight:600;">Archiver</button></div>` }
  const dateColumn = { data: "created_at", title: "Date", render: (val: string, type: string) => (type === "sort" || type === "type") ? (val ? new Date(val).getTime() : 0) : (val ? new Date(val).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "") }
  const columns = [
    ...baseColumns,
    prodColumn,
    dateColumn,
  ]

  const injectSearchIcons = (api: any, activeColumns: any[], activeSearchableCols: Set<string>, dateField: string) => {
    api.columns().every(function (this: any, index: number) {
      const colData = activeColumns[index]?.data
      if (!colData || !activeSearchableCols.has(colData)) return
      const header = api.column(index).header() as HTMLElement
      if (header.querySelector(".search-icon-btn")) return
      const title = header.innerText.trim()
      const sortSpan = header.querySelector(".dt-column-title") as HTMLElement
      const titleText = sortSpan ? sortSpan.innerText.trim() : title
      const existingContent = header.innerHTML
      header.innerHTML = `
        <div style="display:flex;align-items:center;gap:5px;">
          <div style="flex:1;display:flex;align-items:center;gap:3px;">${existingContent}</div>
          <button class="search-icon-btn" style="background:var(--app-surface-hover);border:1px solid var(--app-border);border-radius:4px;padding:2px 5px;cursor:pointer;color:var(--app-text-faint);display:flex;align-items:center;flex-shrink:0;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
        </div>
        <div class="search-wrap" style="display:none;margin-top:5px;">
          ${colData === dateField ? `<input class="col-search-input" type="date" style="width:100%;background:rgba(129,140,248,0.08);border:1px solid rgba(129,140,248,0.3);color:var(--app-text-secondary);border-radius:6px;padding:4px 8px;font-size:11px;outline:none;box-sizing:border-box;color-scheme:light;"/>` : `<input class="col-search-input" placeholder="Filtrer ${titleText.toLowerCase()}..." style="width:100%;background:rgba(129,140,248,0.08);border:1px solid rgba(129,140,248,0.3);color:var(--app-text-secondary);border-radius:6px;padding:4px 8px;font-size:11px;outline:none;box-sizing:border-box;"/>`}
        </div>`
      const btn = header.querySelector(".search-icon-btn") as HTMLElement
      const wrap = header.querySelector(".search-wrap") as HTMLElement
      const input = header.querySelector(".col-search-input") as HTMLInputElement
      btn?.addEventListener("click", (e) => {
        e.stopPropagation()
        const open = wrap.style.display !== "none"
        wrap.style.display = open ? "none" : "block"
        if (open) { input.value = ""; api.column(index).search("").draw(); btn.style.cssText += ";background:var(--app-surface-hover);border-color:var(--app-border);color:var(--app-text-faint);" }
        else { input.focus(); btn.style.cssText += ";background:rgba(129,140,248,0.2);border-color:rgba(129,140,248,0.4);color:#4f46e5;" }
      })
      input?.addEventListener("input", (e) => {
        e.stopPropagation()
        let val = (e.target as HTMLInputElement).value
        if (colData === dateField && val) val = new Date(val).toLocaleDateString("fr-FR")
        api.column(index).search(val).draw()
        btn.style.cssText += val ? ";background:rgba(129,140,248,0.3);border-color:rgba(129,140,248,0.5);color:#4f46e5;" : ";background:rgba(129,140,248,0.2);border-color:rgba(129,140,248,0.4);color:#4f46e5;"
      })
      input?.addEventListener("click", (e) => e.stopPropagation())
    })
  }

  const handleTableClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest(".dt-action-btn") as HTMLElement | null
    if (!btn) return
    const id = Number(btn.dataset.id)
    const type = btn.dataset.type!
    handelclick(type, id)
  }

  return (
    <div className="app-page h-full flex flex-col">
      {/* Header */}
      <div className="app-header pr-3 pl-14 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-start sm:items-center flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <h2 className="app-title text-sm sm:text-base truncate">Liste des Leads</h2>
            <span className="app-badge" style={{ color: badge.color, background: badge.bg, borderColor: `${badge.color}33` }}>{badge.label}</span>
            <span className="app-count hidden sm:inline">{data.length} entrées</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            {isMobile && (
              <button onClick={() => setMobileView(mobileView === "table" ? "cards" : "table")} className="app-btn app-btn-sm app-btn-soft md:hidden">
                <Eye size={13} /> {mobileView === "table" ? "Cartes" : "Tableau"}
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="app-btn app-btn-icon app-btn-secondary md:hidden">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {/* Barre de recherche mobile (vue cartes uniquement) */}
        {isMobile && mobileView === "cards" && data.length > 0 && (
          <div className="mt-3">
            <div className="relative">
              <input type="text" placeholder="Rechercher par nom, email, société..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="app-input" />
              <Filter size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: "var(--app-text-faint)" }} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-3 py-2 flex flex-col gap-2" style={{ borderBottom: "1px solid var(--app-border-subtle)", background: "rgba(0,0,0,0.2)" }}>
          <button onClick={() => { setRefresh((p) => p + 1); setMobileMenuOpen(false); }} className="app-btn app-btn-secondary w-full"><RefreshCw size={14} />Actualiser</button>
        </div>
      )}

      {/* Messages d'erreur / succès (inchangés) */}
      {err && <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background:"rgba(244,63,94,0.07)", border:"1px solid rgba(244,63,94,0.22)", color:"#e11d48" }}>{err}</div>}
      {cleanResult && cleanResult.message && !cleanResult.moved_to_complete && !cleanResult.total_deleted && <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background:"rgba(110,231,183,0.07)", border:"1px solid rgba(110,231,183,0.22)", color:"#059669" }}>{cleanResult.message}</div>}

      <style>{`
        /* Le theme du tableau vit dans globals.css : on ne garde ici que ce
           qui est specifique a cette page. */
        table.dataTable { border-collapse: separate !important; width: 100% !important; }
        .dt-container table.dataTable thead th { vertical-align: top; }

        @media (max-width: 768px) {
          .dt-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .dt-container .dt-layout-row {
            display: flex; flex-direction: column; align-items: stretch;
            gap: 8px; padding: 8px;
          }
          .dt-container .dt-length,
          .dt-container .dt-info,
          .dt-container .dt-paging { width: 100%; text-align: center; }
        }
      `}</style>

      <div className="px-2 sm:px-3 pb-4 pt-2 overflow-y-auto flex-1 overflow-x-hidden">
        {!DTableComponent && shouldUseDataTable ? (
          <div className="app-empty"><Loader2 size={28} className="animate-spin" /><p className="text-sm">Chargement...</p></div>
        ) : data.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--app-text-faint)" }}><Inbox size={34} className="mx-auto mb-3" /><p className="text-base font-medium" style={{ color: "var(--app-text-faint)" }}>Aucune donnée disponible</p></div>
        ) : (
          <>
            {isMobile && mobileView === "cards" ? (
              <div className="pb-4">
                {filteredData.length === 0 ? (
                  <div className="text-center py-12" style={{ color: "var(--app-text-faint)" }}><p className="text-sm">Aucun résultat trouvé</p></div>
                ) : (
                  <>
                    {paginatedData.map((lead: any, index: number) => <MobileCard key={lead.id || index} lead={lead} index={index} />)}
                    {totalMobilePages > 1 && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
                          disabled={mobilePage === 1}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                          style={{ background: "var(--app-surface-hover)", border: "1px solid var(--app-border)", color: "var(--app-text-secondary)" }}
                        >
                          Précédent
                        </button>
                        <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                          Page {mobilePage}/{totalMobilePages}
                        </span>
                        <button
                          onClick={() => setMobilePage((p) => Math.min(totalMobilePages, p + 1))}
                          disabled={mobilePage === totalMobilePages}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                          style={{ background: "var(--app-surface-hover)", border: "1px solid var(--app-border)", color: "var(--app-text-secondary)" }}
                        >
                          Suivant
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div onClick={handleTableClick} className="w-full overflow-x-auto">
                <DTableComponent
                  key={`${String(leads)}-${refresh}`}
                  data={data}
                  columns={columns}
                  className="display w-full"
                  options={{
                    order: [[columns.length - 1, "desc"]],
                    pageLength: isMobile ? 5 : 10,
                    responsive: true,
                    scrollX: isMobile,
                    initComplete: function (this: any) {
                      const api = (this as any).api()
                      if (!isMobile) injectSearchIcons(api, columns, searchableCols, "created_at")
                    },
                    language: { processing: "Traitement en cours...", search: "Rechercher :", lengthMenu: "Afficher _MENU_", info: "_START_ à _END_ sur _TOTAL_", infoEmpty: "0 à 0 sur 0", infoFiltered: "(filtré de _MAX_)", loadingRecords: "Chargement...", zeroRecords: "Aucun élément", emptyTable: "Aucune donnée", paginate: { first: "«", previous: "‹", next: "›", last: "»" } }
                  }}
                >
                  <thead><tr>{columns.map((col, i) => <th key={i}>{col.title}</th>)}</tr></thead>
                </DTableComponent>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
