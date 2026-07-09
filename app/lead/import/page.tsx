"use client"
import Usefetch from "@/hooks/SocieteFetch"
import { openApi } from "@/lib/api"
import { useEffect, useMemo, useRef, useState } from "react"
import { Upload, Sparkles, RefreshCw, Download, Trash2, Menu, X, ChevronDown, ChevronUp, Filter, Eye, Phone, Mail, Building, User, Briefcase, Linkedin, Calendar, MapPin } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useSelector } from "react-redux"
import * as XLSX from "xlsx"

export default function StagingPage() {
  const leads = "import"
  const [DTableComponent, setDTableComponent] = useState<any>(null)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [stat, setstat] = useState<string | null>(null)
  const [err, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState<number>(0)
  const [uploading, setUploading] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [applyingMapping, setApplyingMapping] = useState(false)
  const [removingDuplicates, setRemovingDuplicates] = useState(false)
  const [cleanResult, setCleanResult] = useState<any>(null)
  const [uploadedFilename, setUploadedFilename] = useState<string>("")
  const [uploadedRows, setUploadedRows] = useState<number>(0)
  const [importedRows, setImportedRows] = useState<any[] | null>(null)
  // Colonnes d'origine du fichier importé (affichage brut, sans transformation)
  const [importedColumns, setImportedColumns] = useState<{ key: string; title: string }[] | null>(null)
  // Mapping manuel : clé de colonne du fichier (c0, c1…) -> champ lead ("" = ignorer)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [mobileView, setMobileView] = useState<"table" | "cards">("cards")
  const [searchTerm, setSearchTerm] = useState("")
  const [mobilePage, setMobilePage] = useState(1)
  const [stagingHistory, setStagingHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [emailPattern, setEmailPattern] = useState<string>("{prenom}.{nom}@{domaine}.{extension}")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userId = useSelector((state:any) => state.user.userId)
  const email = useSelector((state:any) => state.user.email)
  const { user, isLoaded } = useUser()
  const userRole = ((user?.publicMetadata?.role as string) || "agent").toLowerCase()
  const isManager = userRole === "manager"
  const isStaging = true
  const isSelectableList = false
  const isSteagingApplique = false

  const rawData = Usefetch(`${process.env.NEXT_PUBLIC_API_URL}/${leads}?refresh=${refresh}`).data || []
  // Si un fichier a été importé localement (parsing front), on affiche son contenu
  // au lieu des données backend. Rien n'est enregistré.
  const data = importedRows ?? rawData

  useEffect(() => {
    const fetchStagingHistory = async () => {
      if (leads !== "import") return
      if (!historyOpen) return
      // Evite de vider la table pendant l'hydratation user/redux.
      if (!isLoaded) return
      if (!isManager && !userId) {
        return
      }
      setLoadingHistory(true)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      try {
        const query = isManager
          ? `?is_manager=true`
          : `?userid=${encodeURIComponent(String(userId))}`
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staging-import-history${query}`, {
          signal: controller.signal,
        })
        const hist = await res.json()
        if (!Array.isArray(hist)) {
          setStagingHistory([])
          return
        }
        setStagingHistory(hist)
      } catch {
        // Ne pas ecraser la table existante en cas de transition momentanée.
      } finally {
        clearTimeout(timeout)
        setLoadingHistory(false)
      }
    }

    fetchStagingHistory()
  }, [leads, refresh, userId, isManager, isLoaded, historyOpen])

  // Détection mobile
  const [isMobile, setIsMobile] = useState(false)
  const isSilverView = false
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
    // Pour un fichier importé brut, on recherche dans toutes les valeurs.
    if (importedColumns) {
      return Object.values(item).some((v: any) =>
        String(v ?? "").toLowerCase().includes(searchLower)
      )
    }
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

  // Champs lead disponibles pour le mapping manuel des colonnes du fichier.
  const TARGET_FIELDS: { key: string; label: string }[] = [
    { key: "nom", label: "Nom" },
    { key: "prenom", label: "Prénom" },
    { key: "email", label: "Email" },
    { key: "fonction", label: "Fonction" },
    { key: "societe", label: "Société" },
    { key: "telephone", label: "Téléphone" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "location", label: "Location" },
  ]

  // Normalise un en-tête (minuscule, sans accents) pour la détection auto.
  const normalizeHeader = (h: any) =>
    String(h ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()

  // Devine le champ lead correspondant à un en-tête de fichier (proposition initiale).
  const FIELD_ALIASES: Record<string, string> = {
    nom: "nom", "nom de famille": "nom", lastname: "nom", "last name": "nom",
    prenom: "prenom", firstname: "prenom", "first name": "prenom",
    email: "email", mail: "email", "e mail": "email", courriel: "email",
    fonction: "fonction", poste: "fonction", titre: "fonction", title: "fonction", "job title": "fonction",
    societe: "societe", entreprise: "societe", company: "societe", organisation: "societe", organization: "societe",
    telephone: "telephone", tel: "telephone", phone: "telephone", mobile: "telephone", numero: "telephone",
    linkedin: "linkedin", "linkedin url": "linkedin", profil: "linkedin",
    location: "location", localisation: "location", ville: "location", city: "location", pays: "location", region: "location", adresse: "location",
  }
  const guessField = (title: string) => FIELD_ALIASES[normalizeHeader(title)] || ""

  // Applique le mapping manuel : transforme les colonnes brutes du fichier en
  // champs lead standard et ENVOIE les lignes au backend (staging_leads), pour
  // qu'elles soient enregistrées et nettoyables via « Nettoyer ».
  const handleApplyMapping = async () => {
    if (!importedColumns || !importedRows) return
    if (!Object.values(columnMapping).some((v) => v)) {
      setError("Associez au moins une colonne à un champ lead avant d'appliquer.")
      return
    }
    setApplyingMapping(true)
    setError(null)
    setCleanResult(null)
    try {
      const mapped = importedRows.map((row) => {
        const obj: Record<string, any> = {
          nom: "", prenom: "", email: "", fonction: "", societe: "",
          telephone: "", linkedin: "", location: "",
        }
        importedColumns.forEach((c) => {
          const field = columnMapping[c.key]
          if (field) obj[field] = String(row[c.key] ?? "").trim()
        })
        return obj
      })

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-mapped`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: mapped,
          userid: userId || "",
          username: String(user?.firstName || ""),
          filename: uploadedFilename || "import-mappe",
        }),
      })
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`)
      const result = await res.json()

      // Fichier déjà traité -> on ANNULE le mapping et on affiche juste un message.
      if (result?.duplicate_file_processed) {
        setImportedRows(null)
        setImportedColumns(null)
        setColumnMapping({})
        setUploadedFilename("")
        setUploadedRows(0)
        setError("⚠️ Ce fichier a déjà été traité — mapping annulé, rien n'a été importé.")
        return
      }

      // Fin de l'aperçu local : on affiche désormais les données du backend.
      setImportedRows(null)
      setImportedColumns(null)
      setColumnMapping({})
      setUploadedRows(Number(result?.inserted_rows || mapped.length))
      setCleanResult(result?.message ? result : { message: `✅ ${result?.inserted_rows ?? mapped.length} ligne(s) enregistrée(s) en staging.` })
      setRefresh((prev) => prev + 1)
    } catch (err: any) {
      setError(err?.message || "Échec de l'enregistrement des données mappées")
    } finally {
      setApplyingMapping(false)
    }
  }

  // Importation 100% front : on parse le CSV/Excel dans le navigateur et on affiche
  // le contenu EXACT du fichier (colonnes d'origine, aucune transformation).
  // Rien n'est envoyé ni enregistré au backend.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setCleanResult(null)
    setMobileMenuOpen(false)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!firstSheet) throw new Error("Fichier vide ou illisible")
      // Lecture brute en tableau de tableaux pour conserver l'ordre et les
      // en-têtes exacts du fichier (aucun remapping de colonnes).
      const aoa = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1, defval: "" })
      if (!aoa.length) throw new Error("Fichier vide")

      const headerRow = (aoa[0] as any[]) || []
      const cols = headerRow.map((h, idx) => ({
        key: `c${idx}`,
        title: String(h ?? "").trim() || `Colonne ${idx + 1}`,
      }))

      // On ignore les lignes ENTIÈREMENT vides (toutes les cellules vides/espaces)
      const bodyRows = aoa.slice(1).filter((arr) =>
        (arr as any[]).some((v) => String(v ?? "").trim() !== "")
      )
      const rows = bodyRows.map((arr, i) => {
        const obj: Record<string, any> = { id: i + 1 }
        cols.forEach((c, idx) => {
          obj[c.key] = String((arr as any[])[idx] ?? "")
        })
        return obj
      })

      // Détection automatique des correspondances (modifiable manuellement).
      const autoMapping: Record<string, string> = {}
      cols.forEach((c) => {
        const guess = guessField(c.title)
        if (guess) autoMapping[c.key] = guess
      })

      setImportedColumns(cols)
      setColumnMapping(autoMapping)
      setImportedRows(rows)
      setUploadedFilename(file.name)
      setUploadedRows(rows.length)
      setCleanResult({ message: `📄 ${rows.length} ligne(s) importée(s) depuis « ${file.name} » — aperçu local du fichier, non enregistré.` })
      setRefresh((prev) => prev + 1)
    } catch (err: any) {
      setError(err?.message || "Impossible de lire le fichier")
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
      db = "import_leads"
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staging-dispatch/${db}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadedFilename || "",
          userid: userId || "",
          inserted_rows: uploadedRows || 0,
          // Optionnel: permet au backend de compléter email selon pattern
          email_pattern: emailPattern || "",
        }),
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
      if (!res.ok) throw new Error(data.detail || `Erreur serveur : ${res.status}`)
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
      if (!res.ok) throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      setCleanResult({ message: data.message || "Lead promu en GOLD avec succès !" })
      setRefresh((prev) => prev + 1)
    } catch (err: any) {
      let message = err.message.substring(err.message.lastIndexOf(":") + 1)
      setError(message)
    }
  }

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

  const downloadLastImportCSV = () => {
    if (!userId) return
    openApi(`${process.env.NEXT_PUBLIC_API_URL}/import/download-last-import-csv?userid=${encodeURIComponent(String(userId))}`)
    setMobileMenuOpen(false)
  }
  const downloadLastImportXlsx = () => {
    if (!userId) return
    openApi(`${process.env.NEXT_PUBLIC_API_URL}/import/download-last-import-xlsx?userid=${encodeURIComponent(String(userId))}`)
    setMobileMenuOpen(false)
  }

  const badgeConfig: Record<string, { label: string; color: string; bg: string }> = {
    import: { label: "RAW", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    gold: { label: "★ GOLD", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    silver: { label: "◆ SILVER", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
    clean: { label: "✦ CLEAN", color: "#6ee7b7", bg: "rgba(110,231,183,0.1)" },
    "staging": { label: "🧩 APPLIQUE", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
    black: { label: "⛔ BLACK", color: "#f43f5e", bg: "rgba(244,63,94,0.1)" },
  }
  const badge = badgeConfig[leads as string] ?? { label: leads, color: "#818cf8", bg: "rgba(129,140,248,0.1)" }

  // Composant Carte mobile
  const MobileCard = ({ lead, index }: { lead: any; index: number }) => {
    const isExpanded = expandedCard === index
    const hasActionButtons = false

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
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="text-blue-400 text-xs truncate flex-1 min-w-0">
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-xs truncate flex-1 min-w-0" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Email manquant
                  </span>
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
              {new Date(lead.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
            </div>
          )}

        </div>
      </div>
    )
  }

  // Carte mobile générique : affiche toutes les colonnes du fichier importé, brut.
  const RawMobileCard = ({ row }: { row: any }) => (
    <div
      className="rounded-xl mb-3 p-4"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="space-y-1.5">
        {(importedColumns || []).map((c) => (
          <div key={c.key} className="flex gap-2 text-xs">
            <span className="font-semibold whitespace-nowrap" style={{ color: "rgba(255,255,255,0.4)" }}>{c.title}:</span>
            <span className="break-words" style={{ color: "rgba(255,255,255,0.75)" }}>{String(row[c.key] ?? "")}</span>
          </div>
        ))}
      </div>
    </div>
  )

  // Configuration DataTable (inchangée)
  const searchableCols = new Set(["nom", "prenom", "email", "fonction", "societe", "telephone", "linkedin", "location", "statu", "eliminer", "created_at"])
  const historySearchableCols = new Set(["imported_at", "filename", "nom", "prenom", "email", "fonction", "societe", "telephone", "linkedin", "location", "destination"])
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
        return `<div>${pill}</div>`
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
  const dateColumn = { data: "created_at", title: "Date", render: (val: string, type: string) => (type === "sort" || type === "type") ? (val ? new Date(val).getTime() : 0) : (val ? new Date(val).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "") }
  const columns = [
    ...baseColumns,
    dateColumn,
  ]
  // Colonnes affichées : si un fichier a été importé, on affiche EXACTEMENT ses
  // colonnes d'origine (titres du fichier), sinon les colonnes leads par défaut.
  const activeColumns = importedColumns
    ? importedColumns.map((c) => ({ data: c.key, title: c.title, defaultContent: "" }))
    : columns
  const activeSearchableCols = importedColumns
    ? new Set(importedColumns.map((c) => c.key))
    : searchableCols
  const activeDateField = importedColumns ? "__none__" : "created_at"
  const historyColumns = [
    {
      data: "imported_at",
      title: "Date import",
      defaultContent: "",
      render: (val: string) => (val ? new Date(val).toLocaleString("fr-FR") : ""),
    },
    { data: "filename", title: "Fichier", defaultContent: "" },
    { data: "nom", title: "Nom", defaultContent: "" },
    { data: "prenom", title: "Prénom", defaultContent: "" },
    { data: "email", title: "Email", defaultContent: "" },
    { data: "fonction", title: "Fonction", defaultContent: "" },
    { data: "societe", title: "Société", defaultContent: "" },
    { data: "telephone", title: "Téléphone", defaultContent: "" },
    {
      data: "linkedin",
      title: "LinkedIn",
      defaultContent: "",
      render: (val: string) =>
        val
          ? `<a href="${val}" target="_blank" rel="noopener noreferrer" style="color:#818cf8;text-decoration:underline;">LinkedIn</a>`
          : "",
    },
    { data: "location", title: "Location", defaultContent: "" },
    {
      data: "destination",
      title: "Destination",
      defaultContent: "staging",
      render: (val: string) => {
        const v = (val || "staging").toLowerCase()
        const ui: Record<string, { label: string; color: string; bg: string; border: string }> = {
          gold: { label: "Gold", color: "#fcd34d", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)" },
          silver: { label: "Silver", color: "#cbd5e1", bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.35)" },
          clean: { label: "Clean", color: "#6ee7b7", bg: "rgba(110,231,183,0.15)", border: "rgba(110,231,183,0.35)" },
          staging: { label: "Staging", color: "#a5b4fc", bg: "rgba(129,140,248,0.15)", border: "rgba(129,140,248,0.35)" },
        }
        const item = ui[v] || ui.staging
        return `<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;color:${item.color};background:${item.bg};border:1px solid ${item.border};">${item.label}</span>`
      },
    },
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
    const btn = (e.target as HTMLElement).closest(".dt-action-btn") as HTMLElement | null
    if (!btn) return
    const id = Number(btn.dataset.id)
    const type = btn.dataset.type!
    if (type === "to-gold") handleToGold(id)
    else handelclick(type, id)
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
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
              {leads === "import" && <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}><Upload size={13} />{uploading ? "Chargement..." : "Importer"}</button>}
              {leads === "import" && !isManager && <><button onClick={downloadLastImportCSV} disabled={!userId} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ background: "rgba(110,231,183,0.15)", border: "1px solid rgba(110,231,183,0.3)", color: "#6ee7b7" }}><Download size={13} />Dernier CSV</button><button onClick={downloadLastImportXlsx} disabled={!userId} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6" }}><Download size={13} />Dernier XLSX</button></>}
              {leads === "import" && <button onClick={handleClean} disabled={cleaning || data.length === 0} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}><Sparkles size={13} />{cleaning ? "Nettoyage..." : "Nettoyer"}</button>}
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
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          {leads === "import" && <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40 w-full" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}><Upload size={14} />{uploading ? "Chargement..." : "Importer"}</button>}
          {leads === "import" && !isManager && <><button onClick={downloadLastImportCSV} disabled={!userId} className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40 w-full" style={{ background: "rgba(110,231,183,0.15)", border: "1px solid rgba(110,231,183,0.3)", color: "#6ee7b7" }}><Download size={14} />Exporter dernier CSV</button><button onClick={downloadLastImportXlsx} disabled={!userId} className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40 w-full" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6" }}><Download size={14} />Exporter dernier XLSX</button></>}
          {leads === "import" && <button onClick={handleClean} disabled={cleaning || data.length === 0} className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40 w-full" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}><Sparkles size={14} />{cleaning ? "Nettoyage..." : "Nettoyer"}</button>}
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
      ].map((item) => (<div key={item.label} className="px-2 sm:px-3 py-2 rounded-lg text-center" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.15)" }}><p className="text-xs opacity-70">{item.icon} {item.label}</p><p className="font-bold text-sm sm:text-base">{item.val ?? 0}</p></div>))}</div>{uploadedRows > 0 && Number(cleanResult.total_deleted || 0) === uploadedRows && (<p className="mt-3 text-xs sm:text-sm font-semibold" style={{ color: "#fca5a5" }}>⚠️ Tu as deja traite ce fichier: tous les leads importes ont ete supprimes comme doublons.</p>)}</div>)}
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
        {importedColumns && importedColumns.length > 0 && (
          <div
            className="mb-4 rounded-xl p-3 sm:p-4"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white">Mapping des colonnes</h3>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Associez chaque colonne du fichier à un champ lead, puis appliquez.
                </p>
              </div>
              <button
                onClick={handleApplyMapping}
                disabled={applyingMapping}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}
              >
                <Sparkles size={13} /> {applyingMapping ? "Enregistrement..." : "Appliquer le mapping"}
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {importedColumns.map((c) => (
                <div key={c.key} className="flex flex-col gap-1.5" style={{ minWidth: 160 }}>
                  <span
                    title={c.title}
                    className="text-xs font-semibold truncate px-1"
                    style={{ color: "rgba(255,255,255,0.7)", maxWidth: 160 }}
                  >
                    {c.title}
                  </span>
                  <select
                    value={columnMapping[c.key] || ""}
                    onChange={(e) => setColumnMapping((m) => ({ ...m, [c.key]: e.target.value }))}
                    className="text-xs rounded-lg px-2 py-1.5 outline-none"
                    style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.15)", color: "#e2e8f0" }}
                  >
                    <option value="">— Ignorer —</option>
                    {TARGET_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
        {!DTableComponent && shouldUseDataTable ? (
          <div className="text-center py-16" style={{ color: "rgba(255,255,255,0.2)" }}><div className="text-4xl mb-3">⚡</div><p className="text-sm">Chargement...</p></div>
        ) : data.length === 0 ? (
          <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.2)" }}><div className="text-5xl mb-4">📭</div><p className="text-base font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Aucune donnée disponible</p>{leads === "import" && <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>Importez un fichier CSV ou Excel pour commencer</p>}</div>
        ) : (
          <>
            {isMobile && mobileView === "cards" ? (
              <div className="pb-4">
                {filteredData.length === 0 ? (
                  <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}><p className="text-sm">Aucun résultat trouvé</p></div>
                ) : (
                  <>
                    {paginatedData.map((lead: any, index: number) => importedColumns
                      ? <RawMobileCard key={lead.id || index} row={lead} />
                      : <MobileCard key={lead.id || index} lead={lead} index={index} />)}
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
                  columns={activeColumns}
                  className="display w-full"
                  options={{
                    order: importedColumns ? [] : [[activeColumns.length - 1, "desc"]],
                    pageLength: isMobile ? 5 : 10,
                    responsive: true,
                    scrollX: isMobile,
                    initComplete: function (this: any) {
                      const api = (this as any).api()
                      if (!isMobile) injectSearchIcons(api, activeColumns, activeSearchableCols, activeDateField)
                    },
                    language: { processing: "Traitement en cours...", search: "Rechercher :", lengthMenu: "Afficher _MENU_", info: "_START_ à _END_ sur _TOTAL_", infoEmpty: "0 à 0 sur 0", infoFiltered: "(filtré de _MAX_)", loadingRecords: "Chargement...", zeroRecords: "Aucun élément", emptyTable: "Aucune donnée", paginate: { first: "«", previous: "‹", next: "›", last: "»" } }
                  }}
                >
                  <thead><tr>{activeColumns.map((col, i) => <th key={i}>{col.title}</th>)}</tr></thead>
                </DTableComponent>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
