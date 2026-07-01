"use client"
import Usefetch from "@/hooks/SocieteFetch"
import { useEffect, useMemo, useRef, useState } from "react"
import { Upload, Sparkles, RefreshCw, Download, Trash2, Menu, X, ChevronDown, ChevronUp, Filter, Eye, Phone, Mail, Building, User, Briefcase, Linkedin, Calendar, MapPin } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useSelector } from "react-redux"

export default function SilverPage() {
  const leads = "silver"
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
  const [uploadedRows, setUploadedRows] = useState<number>(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [mobileView, setMobileView] = useState<"table" | "cards">("cards")
  const [searchTerm, setSearchTerm] = useState("")
  const [mobilePage, setMobilePage] = useState(1)
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<number>>(() => new Set())
  const [emailPattern, setEmailPattern] = useState<string>("{prenom}.{nom}@{domaine}.{extension}")
  const [applyingEmailPattern, setApplyingEmailPattern] = useState(false)
  const [savingEmailPattern, setSavingEmailPattern] = useState(false)
  const [reformulatingLocation, setReformulatingLocation] = useState(false)
  const [verifyingEmailId, setVerifyingEmailId] = useState<number | null>(null)
  const [sendingBulkVerify, setSendingBulkVerify] = useState(false)
  const [emailVerifyResults, setEmailVerifyResults] = useState<Record<number, { status: "valid" | "invalid" | "error"; message: string }>>({})
  const emailVerifyResultsRef = useRef<Record<number, { status: "valid" | "invalid" | "error"; message: string }>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userId = useSelector((state:any) => state.user.userId)
  const email = useSelector((state:any) => state.user.email)
  const { user, isLoaded } = useUser()
  const userRole = ((user?.publicMetadata?.role as string) || "agent").toLowerCase()
  const isManager = userRole === "manager"
  const isStaging = false
  const isSelectableList = true
  const isSteagingApplique = false

  const rawData = Usefetch(`${process.env.NEXT_PUBLIC_API_URL}/${leads}?refresh=${refresh}`).data || []
  // Ajout refresh pour éviter cache/stale data côté mobile/DT
  const data = rawData

  const normalizeTextKey = (v: any) =>
    String(v ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "")

  // Règle "cadre vert": égalité stricte (trim + lower) entre societe_leads.nom et lead.societe
  const societeExactKey = (s: any) =>
    String(s ?? "")
      // retire les caractères invisibles fréquents (zero‑width, BOM)
      .replace(/[​-‍﻿]/g, "")
      // normalise les espaces unicode en espace simple
      .replace(/[   ]/g, " ")
      .trim()
      .toLowerCase()
  // Normalisation forte (utilisée pour dédup et noms/prénoms)
  const normalizeSociete = (s: any) =>
    String(s ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "")

  const normalizeToken = (v: any) =>
    String(v ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "")

  // L'email est généré côté backend lors de "Envoyer à Silver"

  useEffect(() => {
    setSelectedLeadIds(new Set())
  }, [leads, refresh])

  useEffect(() => {
    const fetchPattern = async () => {
      if (leads !== "silver") return
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/email-pattern`)
        const data = await res.json()
        if (res.ok && data?.pattern) setEmailPattern(String(data.pattern))
      } catch {
        // ignore
      }
    }
    fetchPattern()
  }, [leads])

  // Détection mobile
  const [isMobile, setIsMobile] = useState(false)
  const isSilverView = true
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

  const toggleLeadSelected = (leadId: number, value?: boolean) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev)
      const shouldSelect = value ?? !next.has(leadId)
      if (shouldSelect) next.add(leadId)
      else next.delete(leadId)
      return next
    })
  }

  const clearSelection = () => setSelectedLeadIds(new Set())
  const selectAllLeads = () =>
    setSelectedLeadIds(new Set((data ?? []).map((d: any) => Number(d.id)).filter((n: number) => Number.isFinite(n))))

  // DataTables ne re-render pas automatiquement les cellules "render" sur changement d'état React.
  // On synchronise donc les checkbox visibles avec selectedLeadIds.
  useEffect(() => {
    if (!shouldUseDataTable) return
    if (!isSelectableList) return
    const nodes = document.querySelectorAll<HTMLInputElement>(".dt-select-row")
    nodes.forEach((el) => {
      const id = Number(el.dataset.id)
      el.checked = Number.isFinite(id) && selectedLeadIds.has(id)
    })
  }, [selectedLeadIds, shouldUseDataTable, isSelectableList])

  const handleApplyEmailPatternSilver = async () => {
    setApplyingEmailPattern(true)
    setError(null)
    setCleanResult(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/silver/complete-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: emailPattern, overwrite: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      setCleanResult({ message: `Emails complétés: ${data.emails_completed ?? 0}` })
      setRefresh((p) => p + 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setApplyingEmailPattern(false)
    }
  }

  const handleSaveEmailPattern = async () => {
    if (!isManager) return
    setSavingEmailPattern(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/email-pattern`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: emailPattern, is_manager: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      setCleanResult({ message: "✅ Pattern enregistré" })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingEmailPattern(false)
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
      if (!res.ok) throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      setCleanResult({ message: data.message || "Lead promu en GOLD avec succès !" })
      setRefresh((prev) => prev + 1)
    } catch (err: any) {
      let message = err.message.substring(err.message.lastIndexOf(":") + 1)
      setError(message)
    }
  }

  const handleBulkVerifyEmails = async () => {
    const ids = Array.from(selectedLeadIds)
    if (ids.length === 0) return
   const emails = (data as any[])
  .filter((d: any) => ids.includes(Number(d.id)) && d.email && (d.statu === "" || !d.statu))
  .map((d: any) => String(d.email))

    if (emails.length === 0) return
    setSendingBulkVerify(true)
    setError(null)
    try {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/send/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emails),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail || `Erreur serveur : ${res.status}`)
      setCleanResult({ message: json?.message || `✅ ${emails.length} emails vérifiés` })
      setRefresh((p) => p + 1)
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la vérification en masse")
    } finally {
      setSendingBulkVerify(false)
    }
  }

  const handleVerifyEmail = async (leadId: number, emailAddr: string) => {
    if (!emailAddr) return
    setVerifyingEmailId(leadId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/send/${encodeURIComponent(emailAddr)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      const isValid = Number(data.code) === 250
      setEmailVerifyResults((prev) => ({
        ...prev,
        [leadId]: { status: isValid ? "valid" : "invalid", message: data.status || (isValid ? "✅ Email livré" : "❌ Email introuvable") },
      }))
    } catch (e: any) {
      setEmailVerifyResults((prev) => ({ ...prev, [leadId]: { status: "error", message: e.message || "Erreur de vérification" } }))
    } finally {
      setVerifyingEmailId(null)
    }
  }

  const handleVerifyEmailRef = useRef(handleVerifyEmail)
  useEffect(() => { handleVerifyEmailRef.current = handleVerifyEmail })
  useEffect(() => { emailVerifyResultsRef.current = emailVerifyResults }, [emailVerifyResults])

  const handleReformulerLocalisation = async () => {
    setReformulatingLocation(true)
    setError(null)
    setCleanResult(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/location/${leads}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      setCleanResult({ message: data.message || "Localisation reformulée avec succès !" })
      setRefresh((prev) => prev + 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReformulatingLocation(false)
    }
  }

  const badgeConfig: Record<string, { label: string; color: string; bg: string }> = {
    staging: { label: "RAW", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    gold: { label: "★ GOLD", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    silver: { label: "◆ SILVER", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
    clean: { label: "✦ CLEAN", color: "#6ee7b7", bg: "rgba(110,231,183,0.1)" },
    "steaging-applique": { label: "🧩 APPLIQUE", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
    black: { label: "⛔ BLACK", color: "#f43f5e", bg: "rgba(244,63,94,0.1)" },
  }
  const badge = badgeConfig[leads as string] ?? { label: leads, color: "#818cf8", bg: "rgba(129,140,248,0.1)" }

  // Composant Carte mobile
  const MobileCard = ({ lead, index }: { lead: any; index: number }) => {
    const isExpanded = expandedCard === index
    const hasActionButtons = true
    const id = Number(lead?.id)
    const isSelected = Number.isFinite(id) && selectedLeadIds.has(id)

    return (
      <div
        className="rounded-xl mb-3 transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-3 gap-2">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-base">
                {lead.prenom} {lead.nom}
              </h3>
              {lead.fonction && (
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Briefcase size={10} className="inline mr-1" />
                  {lead.fonction}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isSelectableList && Number.isFinite(id) && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => toggleLeadSelected(id, e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#818cf8" }}
                />
              )}
              <button
                onClick={() => setExpandedCard(isExpanded ? null : index)}
                className="p-1 rounded-lg transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
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
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "transparent",
                }}
              >
                <Mail size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <a href={`mailto:${lead.email}`} className="text-blue-400 text-xs truncate flex-1 min-w-0">
                  {lead.email}
                </a>
              </div>
            )}
            {isVerifiableView && lead.email && (
              <div>
                <button
                  onClick={() => handleVerifyEmail(Number(lead.id), lead.email)}
                  disabled={verifyingEmailId === Number(lead.id)}
                  className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg disabled:opacity-40"
                  style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.25)", color: "#a5b4fc" }}
                >
                  {verifyingEmailId === Number(lead.id) ? "Vérification..." : "Vérifier email"}
                </button>
                {emailVerifyResults[Number(lead.id)] && (
                  <p className="text-xs mt-1 px-1" style={{ color: emailVerifyResults[Number(lead.id)].status === "valid" ? "#86efac" : "#fda4af" }}>
                    {emailVerifyResults[Number(lead.id)].message}
                  </p>
                )}
              </div>
            )}
            {lead.telephone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <a href={`tel:${lead.telephone}`} className="text-green-400 text-xs">
                  {lead.telephone}
                </a>
              </div>
            )}
            {lead.societe && (
              <div className="flex items-center gap-2 text-sm">
                <Building size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{lead.societe}</span>
              </div>
            )}
            {lead.linkedin && (
              <div className="flex items-center gap-2 text-sm">
                <Linkedin size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs truncate flex-1 min-w-0">
                  Profil LinkedIn
                </a>
              </div>
            )}
            {lead.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{lead.location}</span>
              </div>
            )}
          </div>

          {lead.created_at && (
            <div className="mt-3 pt-2 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
              <Calendar size={10} className="inline mr-1" />
              {new Date(lead.created_at).toLocaleDateString("fr-FR")}
            </div>
          )}

          {hasActionButtons && isExpanded && (
            <div className="mt-4 pt-3 flex flex-col sm:flex-row gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {leads === "silver" && (
                <button
                  onClick={() => handleToGold(lead.id)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}
                >
                  ★ Promouvoir Gold
                </button>
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
        const socRaw = String(row?.societe ?? "")
        const companyExists = false
        const border = companyExists ? "1px solid rgba(34,197,94,0.55)" : "1px solid rgba(255,255,255,0.08)"
        const bg = companyExists ? "rgba(34,197,94,0.10)" : "transparent"
        const color = companyExists ? "#86efac" : "#e2e8f0"
        const value = val ? String(val) : ""
        const text = value ? value : ""
        const opacity = value ? 1 : 0.55
        const pill = `<span class="dt-email-pill" data-soc="${encodeURIComponent(socRaw)}" data-id="${id}" style="display:block;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:4px 8px;border-radius:8px;border:${border};background:${bg};color:${color};opacity:${opacity};">${text || ""}</span>`
        const verifyBtn = isVerifiableView && value
          ? `<button data-id="${id}" data-type="verify-email" data-email="${encodeURIComponent(value)}" class="dt-verify-email-btn" style="display:block;margin-top:4px;padding:2px 8px;border-radius:5px;border:1px solid rgba(129,140,248,0.3);color:#a5b4fc;background:rgba(129,140,248,0.1);cursor:pointer;font-size:10px;font-weight:600;width:100%;text-align:center;">Vérifier email</button>`
          : ""
        return `<div>${pill}${verifyBtn}</div>`
      },
    },
    { data: "fonction", title: "Fonction", defaultContent: "" },
    { data: "societe", title: "Société", defaultContent: "" },
    { data: "telephone", title: "Téléphone", defaultContent: "" },
    { data: "linkedin", title: "LinkedIn", defaultContent: "", render: (val: string) => val ? `<a href="${val}" target="_blank" rel="noopener noreferrer" style="color:#818cf8;text-decoration:underline;">LinkedIn</a>` : "" },
    { data: "location", title: "Location", defaultContent: "" },
    {
      data: "statu",
      title: "Statut",
      defaultContent: "",
      render: (val: string) => {
        if (!val) return `<span style="color:rgba(255,255,255,0.25);font-size:11px;">—</span>`
        const v = String(val)
        const isUnavailable = v.toLowerCase().includes("non")
        const color = isUnavailable ? "#fda4af" : "#86efac"
        const bg = isUnavailable ? "rgba(244,63,94,0.1)" : "rgba(34,197,94,0.1)"
        const border = isUnavailable ? "rgba(244,63,94,0.3)" : "rgba(34,197,94,0.3)"
        return `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;color:${color};background:${bg};border:1px solid ${border};white-space:nowrap;">${v}</span>`
      },
    },
  ]
  const selectColumn = {
    data: "__select__",
    title: "",
    orderable: false,
    searchable: false,
    width: "34px",
    render: (_: any, _t: any, row: any) => {
      const id = Number(row?.id)
      const checked = Number.isFinite(id) && selectedLeadIds.has(id)
      return `<input type="checkbox" class="dt-select-row" data-id="${id}" ${checked ? "checked" : ""} style="width:14px;height:14px;accent-color:#818cf8;cursor:pointer;" />`
    },
  }
  const silverColumn = { data: "id", title: "Action", orderable: false, render: (id: number) => `<button data-id="${id}" data-type="to-gold" class="dt-action-btn" style="padding:4px 12px;border-radius:6px;border:1px solid rgba(245,158,11,0.4);color:#fcd34d;background:rgba(245,158,11,0.08);cursor:pointer;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;">★ → Gold</button>` }
  const dateColumn = { data: "created_at", title: "Date", render: (val: string) => new Date(val).toLocaleDateString("fr-FR") }
  const columns = [selectColumn, ...baseColumns, silverColumn, dateColumn]

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
          <button class="search-icon-btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:2px 5px;cursor:pointer;color:rgba(255,255,255,0.3);display:flex;align-items:center;flex-shrink:0;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
        </div>
        <div class="search-wrap" style="display:none;margin-top:5px;">
          ${colData === dateField ? `<input class="col-search-input" type="date" style="width:100%;background:rgba(129,140,248,0.08);border:1px solid rgba(129,140,248,0.3);color:#e2e8f0;border-radius:6px;padding:4px 8px;font-size:11px;outline:none;box-sizing:border-box;color-scheme:dark;"/>` : `<input class="col-search-input" placeholder="Filtrer ${titleText.toLowerCase()}..." style="width:100%;background:rgba(129,140,248,0.08);border:1px solid rgba(129,140,248,0.3);color:#e2e8f0;border-radius:6px;padding:4px 8px;font-size:11px;outline:none;box-sizing:border-box;"/>`}
        </div>`
      const btn = header.querySelector(".search-icon-btn") as HTMLElement
      const wrap = header.querySelector(".search-wrap") as HTMLElement
      const input = header.querySelector(".col-search-input") as HTMLInputElement
      btn?.addEventListener("click", (e) => {
        e.stopPropagation()
        const open = wrap.style.display !== "none"
        wrap.style.display = open ? "none" : "block"
        if (open) { input.value = ""; api.column(index).search("").draw(); btn.style.cssText += ";background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3);" }
        else { input.focus(); btn.style.cssText += ";background:rgba(129,140,248,0.2);border-color:rgba(129,140,248,0.4);color:#818cf8;" }
      })
      input?.addEventListener("input", (e) => {
        e.stopPropagation()
        let val = (e.target as HTMLInputElement).value
        if (colData === dateField && val) val = new Date(val).toLocaleDateString("fr-FR")
        api.column(index).search(val).draw()
        btn.style.cssText += val ? ";background:rgba(129,140,248,0.3);border-color:rgba(129,140,248,0.5);color:#818cf8;" : ";background:rgba(129,140,248,0.2);border-color:rgba(129,140,248,0.4);color:#818cf8;"
      })
      input?.addEventListener("click", (e) => e.stopPropagation())
    })
  }

  const handleTableClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const selectRow = (e.target as HTMLElement).closest(".dt-select-row") as HTMLInputElement | null
    if (selectRow) {
      const id = Number(selectRow.dataset.id)
      if (Number.isFinite(id)) {
        toggleLeadSelected(id, selectRow.checked)
      }
      return
    }
    const btn = (e.target as HTMLElement).closest(".dt-action-btn") as HTMLElement | null
    if (!btn) return
    const id = Number(btn.dataset.id)
    const type = btn.dataset.type!
    if (type === "to-gold") handleToGold(id)
    else if (type === "verify-email") handleVerifyEmail(id, decodeURIComponent(btn.dataset.email || ""))
  }

  return (
    <div className="h-full rounded-none flex flex-col" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 pr-3 pl-14 sm:px-6 py-3 sm:py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "inherit" }}>
        <div className="flex justify-between items-start sm:items-center flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm sm:text-base truncate">Liste des Leads</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md whitespace-nowrap" style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.color}30` }}>{badge.label}</span>
            <span className="text-xs hidden sm:inline" style={{ color: "rgba(255,255,255,0.3)" }}>{data.length} entrées</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            {isMobile && (
              <button onClick={() => setMobileView(mobileView === "table" ? "cards" : "table")} className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg md:hidden" style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", color: "#a5b4fc" }}>
                <Eye size={13} /> {mobileView === "table" ? "Cartes" : "Tableau"}
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden flex items-center justify-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="hidden md:flex gap-2">
              {isSelectableList && (
                <>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                      Sélection: <span className="text-white">{selectedLeadIds.size}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => (selectedLeadIds.size === (data?.length || 0) ? clearSelection() : selectAllLeads())}
                    disabled={(data?.length || 0) === 0}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
                    style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", color: "#a5b4fc" }}
                  >
                    {selectedLeadIds.size === (data?.length || 0) ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                  {isVerifiableView && (
                    <button
                      onClick={handleBulkVerifyEmails}
                      disabled={selectedLeadIds.size === 0 || sendingBulkVerify}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
                      style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", color: "#a5b4fc" }}
                    >
                      {sendingBulkVerify ? "Vérification..." : "Vérifier emails"}
                    </button>
                  )}
                </>
              )}
              <button onClick={handleReformulerLocalisation} disabled={reformulatingLocation} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", color: "#a5b4fc" }}><MapPin size={13} />{reformulatingLocation ? "Reformulation..." : "Reformuler localisation"}</button>
            </div>
          </div>
        </div>
        {/* Barre de recherche mobile (vue cartes uniquement) */}
        {isMobile && mobileView === "cards" && data.length > 0 && (
          <div className="mt-3">
            <div className="relative">
              <input type="text" placeholder="Rechercher par nom, email, société..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", outline: "none" }} />
              <Filter size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-3 py-2 flex flex-col gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
          <button onClick={() => { setRefresh((p) => p + 1); setMobileMenuOpen(false); }} className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg w-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}><RefreshCw size={14} />Actualiser</button>
        </div>
      )}

      {/* Messages d'erreur / succès (inchangés) */}
      {err && <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#fda4af" }}>❌ {err}</div>}
      {cleanResult && cleanResult.message && !cleanResult.moved_to_gold && !cleanResult.total_deleted && <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)", color: "#6ee7b7" }}>✅ {cleanResult.message}</div>}
      {cleanResult && cleanResult.total_deleted !== undefined && (<div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fda4af" }}><p className="font-semibold mb-2">🗑️ Suppression des doublons terminée</p><div className="grid grid-cols-2 sm:grid-cols-5 gap-2">{[
        { label: "Total", val: cleanResult.total_deleted, icon: "🔢" },
        { label: "Doublons en Gold", val: cleanResult.staging_vs_gold, icon: "🥇" },
        { label: "Doublons en Silver", val: cleanResult.staging_vs_silver, icon: "🥈" },
        { label: "Doublons Interne", val: cleanResult.staging_internal, icon: "♻️" },
        { label: "Doublons Staging ", val: cleanResult.staging_vs_applique, icon: "🧩" },
      ].map((item) => (<div key={item.label} className="px-2 sm:px-3 py-2 rounded-lg text-center" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.15)" }}><p className="text-xs opacity-70">{item.icon} {item.label}</p><p className="font-bold text-sm sm:text-base">{item.val ?? 0}</p></div>))}</div>{uploadedRows > 0 && (Number(cleanResult.total_deleted || 0) + Number(cleanResult.moved_to_steaging_applique || 0)) === uploadedRows && (<p className="mt-3 text-xs sm:text-sm font-semibold" style={{ color: "#fca5a5" }}>⚠️ Tu as deja traite ce fichier: tous les leads importes ont ete supprimes comme doublons.</p>)}</div>)}
      {cleanResult && cleanResult.moved_to_gold !== undefined && (<div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)", color: "#6ee7b7" }}><p className="font-semibold mb-2">✅ Nettoyage terminé</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{[
        { label: "🥇 Gold", val: cleanResult.moved_to_gold },
        { label: "🥈 Silver", val: cleanResult.moved_to_silver },
        { label: "🧹 Clean", val: cleanResult.moved_to_clean },
        { label: "🧩 Staging", val: cleanResult.moved_to_steaging_applique },
        { label: "📧 Emails complètè", val: cleanResult.emails_completed },
        { label: "👤 Noms complètè", val: cleanResult.nom_prenom_completed },
      ].map((item) => (<div key={item.label} className="px-2 sm:px-3 py-2 rounded-lg text-center" style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.15)" }}><p className="text-xs opacity-70">{item.label}</p><p className="font-bold text-sm sm:text-base">{item.val ?? 0}</p></div>))}</div></div>)}

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
        .history-dt-wrapper .dt-search { display: none !important; }
        .dt-container .dt-layout-row { padding: 8px 12px; }
        table.dataTable { border-collapse: collapse !important; width: 100% !important; }
        .search-icon-btn:hover { background: rgba(129,140,248,0.15) !important; border-color: rgba(129,140,248,0.3) !important; color: #818cf8 !important; }
        .col-search-input::placeholder { color: rgba(255,255,255,0.2); }

        @media (max-width: 768px) {
          .dt-container .dt-layout-row {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            padding: 8px;
          }
          .dt-container .dt-length,
          .dt-container .dt-info,
          .dt-container .dt-paging {
            width: 100%;
            text-align: center;
          }
          .dt-container table.dataTable thead th:nth-child(4),
          .dt-container table.dataTable tbody td:nth-child(4),
          .dt-container table.dataTable thead th:nth-child(6),
          .dt-container table.dataTable tbody td:nth-child(6),
          .dt-container table.dataTable thead th:nth-child(7),
          .dt-container table.dataTable tbody td:nth-child(7) { display: none; }
        }
        @media (max-width: 640px) {
          .dt-container table.dataTable thead th:nth-child(2),
          .dt-container table.dataTable tbody td:nth-child(2) { display: none; }
          .dt-action-btn { font-size: 10px !important; padding: 3px 6px !important; }
        }
        @media (max-width: 768px) {
          .dt-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>

      <div className="px-2 sm:px-3 pb-4 pt-2 overflow-y-auto flex-1 overflow-x-hidden">
        {leads === "silver" && (
          <div
            className="mb-3 rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-2"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="text-xs sm:text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
              Pattern email
            </div>
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <input
                value={emailPattern}
                onChange={(e) => setEmailPattern(e.target.value)}
                disabled={!isManager}
                className="px-3 py-2 rounded-lg text-xs sm:text-sm w-full"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", outline: "none", opacity: !isManager ? 0.75 : 1 }}
                placeholder="{prenom}.{nom}@{domaine}.{extension}"
              />
              <button
                onClick={handleApplyEmailPatternSilver}
                disabled={applyingEmailPattern}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold disabled:opacity-40 whitespace-nowrap"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac" }}
              >
                {applyingEmailPattern ? "Application..." : "Appliquer pattern email"}
              </button>
              {isManager && (
                <button
                  onClick={handleSaveEmailPattern}
                  disabled={savingEmailPattern}
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold disabled:opacity-40 whitespace-nowrap"
                  style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", color: "#a5b4fc" }}
                >
                  {savingEmailPattern ? "Enregistrement..." : "Enregistrer"}
                </button>
              )}
            </div>
          </div>
        )}
        {!DTableComponent && shouldUseDataTable ? (
          <div className="text-center py-16" style={{ color: "rgba(255,255,255,0.2)" }}><div className="text-4xl mb-3">⚡</div><p className="text-sm">Chargement...</p></div>
        ) : data.length === 0 ? (
          <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.2)" }}><div className="text-5xl mb-4">📭</div><p className="text-base font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Aucune donnée disponible</p></div>
        ) : (
          <>
            {isMobile && mobileView === "cards" ? (
              <div className="pb-4">
                {filteredData.length === 0 ? (
                  <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}><p className="text-sm">Aucun résultat trouvé</p></div>
                ) : (
                  <>
                    {paginatedData.map((lead: any, index: number) => <MobileCard key={lead.id || index} lead={lead} index={index} />)}
                    {totalMobilePages > 1 && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
                          disabled={mobilePage === 1}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                        >
                          Précédent
                        </button>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                          Page {mobilePage}/{totalMobilePages}
                        </span>
                        <button
                          onClick={() => setMobilePage((p) => Math.min(totalMobilePages, p + 1))}
                          disabled={mobilePage === totalMobilePages}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
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
                    drawCallback: function () {
                      // Attacher les listeners sur les boutons vérifier
                      document.querySelectorAll<HTMLElement>(".dt-verify-email-btn:not([data-vl])").forEach((btn) => {
                        btn.dataset.vl = "1"
                        btn.addEventListener("click", async (e) => {
                          e.stopPropagation()
                          const leadId = Number(btn.dataset.id)
                          const emailAddr = decodeURIComponent(btn.dataset.email || "")
                          if (!emailAddr) return
                          btn.textContent = "Vérification..."
                          btn.style.opacity = "0.6"
                          btn.setAttribute("disabled", "true")
                          try {
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/send/${encodeURIComponent(emailAddr)}`)
                            const data = await res.json()
                            const isValid = Number(data.code) === 250
                            const color = isValid ? "#86efac" : "#fda4af"
                            btn.textContent = isValid ? "✅ Vérifié" : "❌ Introuvable"
                            btn.style.borderColor = isValid ? "rgba(34,197,94,0.4)" : "rgba(244,63,94,0.4)"
                            btn.style.color = color
                            btn.style.background = isValid ? "rgba(34,197,94,0.1)" : "rgba(244,63,94,0.1)"
                            setEmailVerifyResults((prev) => ({ ...prev, [leadId]: { status: isValid ? "valid" : "invalid", message: data.status || "" } }))
                          } catch (err: any) {
                            btn.textContent = "❌ Erreur"
                            btn.style.color = "#fda4af"
                          } finally {
                            btn.style.opacity = "1"
                            btn.removeAttribute("disabled")
                          }
                        })
                      })
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
