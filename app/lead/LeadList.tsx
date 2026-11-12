"use client"
import Usefetch from "@/hooks/SocieteFetch"
import { openApi } from "@/lib/api"
import { useEffect, useMemo, useRef, useState } from "react"
import { Briefcase, Building, Calendar, ChevronDown, ChevronUp, Download, Eye, Filter, Inbox, Linkedin, Loader2, Mail, MapPin, Menu, Phone, RefreshCw, Sparkles, Trash2, Upload, User, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useSelector } from "react-redux"
import { getLeadBadge } from "@/lib/theme"
import ResultSummary from "@/componets/ResultSummary"

// --- Vérification email <-> patterne société (regex) ---
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const normForRx = (v?: string) =>
  String(v ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "")

/**
 * Construit une regex à partir du patterne d'une société et teste l'email.
 * Tokens: {prenom} {nom} -> nom complet, {p} {n} -> initiale.
 * Si le prénom/nom du lead sont connus on les injecte (vérif précise),
 * sinon on utilise des classes génériques [a-z]+ / [a-z] (vérif de structure + domaine).
 * Retourne true/false, ou null si rien à vérifier (email ou patterne absent).
 */
function emailMatchesPatterne(email?: string, patterne?: string, prenom?: string, nom?: string): boolean | null {
  const e = String(email ?? "").trim().toLowerCase()
  const pat = String(patterne ?? "").trim()
  if (!e || !pat || !pat.includes("@")) return null
  const p = normForRx(prenom)
  const n = normForRx(nom)
  let rx = ""
  let last = 0
  const tokenRe = /\{prenom\}|\{nom\}|\{p\}|\{n\}/g
  let m: RegExpExecArray | null
  while ((m = tokenRe.exec(pat)) !== null) {
    rx += escapeRegex(pat.slice(last, m.index))
    const tok = m[0]
    if (tok === "{prenom}") rx += p ? escapeRegex(p) : "[a-z]+"
    else if (tok === "{nom}") rx += n ? escapeRegex(n) : "[a-z]+"
    else if (tok === "{p}") rx += p ? escapeRegex(p[0]) : "[a-z]"
    else rx += n ? escapeRegex(n[0]) : "[a-z]"
    last = m.index + tok.length
  }
  rx += escapeRegex(pat.slice(last))
  try {
    return new RegExp("^" + rx + "$", "i").test(e)
  } catch {
    return null
  }
}

export default function LeadList({ leads }: { leads: string }) {
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
  const [stagingHistory, setStagingHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [emailPattern, setEmailPattern] = useState<string>("{prenom}.{nom}@{domaine}.{extension}")
  const [applyingEmailPattern, setApplyingEmailPattern] = useState(false)
  const [savingEmailPattern, setSavingEmailPattern] = useState(false)
  const [sendingToOptimized, setSendingToOptimized] = useState(false)
  const [deletingClean, setDeletingClean] = useState(false)
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
  const isStaging = leads === "staging"
  const isSelectableList = leads === "staging" || leads === "clean" || leads === "incomplete" || leads === "complete"
  const isSteagingApplique = leads === "staging"

  const rawData = Usefetch(`${process.env.NEXT_PUBLIC_API_URL}/${leads}?refresh=${refresh}`).data || []
  // Ajout refresh pour éviter cache/stale data côté mobile/DT
  const societes = Usefetch(`${process.env.NEXT_PUBLIC_API_URL}/societe?refresh=${refresh}`).data || []
  
  const normalizeTextKey = (v: any) =>
    String(v ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")

  const data = useMemo(() => {
    if (!isSteagingApplique) return rawData
    const bestByKey = new Map<string, any>()

    const getKey = (lead: any) => {
      const email = String(lead?.email ?? "").trim().toLowerCase()
      if (email && email !== "nan" && email !== "none" && email !== "null") return `e:${email}`
      const nom = normalizeTextKey(lead?.nom)
      const prenom = normalizeTextKey(lead?.prenom)
      const societe = normalizeTextKey(lead?.societe)
      return `nps:${nom}|${prenom}|${societe}`
    }

    const toTime = (v: any) => {
      const t = Date.parse(String(v ?? ""))
      return Number.isFinite(t) ? t : -1
    }

    for (const lead of rawData as any[]) {
      const key = getKey(lead)
      const existing = bestByKey.get(key)
      if (!existing) {
        bestByKey.set(key, lead)
        continue
      }
      // garder le plus récent (created_at), sinon plus grand id
      const a = toTime(existing?.created_at)
      const b = toTime(lead?.created_at)
      if (b > a) bestByKey.set(key, lead)
      else if (b === a) {
        const ida = Number(existing?.id)
        const idb = Number(lead?.id)
        if (Number.isFinite(idb) && (!Number.isFinite(ida) || idb > ida)) bestByKey.set(key, lead)
      }
    }
    return Array.from(bestByKey.values())
  }, [rawData, isSteagingApplique])

  // Règle "cadre vert": égalité stricte (trim + lower) entre societe_leads.nom et lead.societe
  const societeExactKey = (s: any) =>
    String(s ?? "")
      // retire les caractères invisibles fréquents (zero‑width, BOM)
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // normalise les espaces unicode en espace simple
      .replace(/[\u00A0\u202F\u2007]/g, " ")
      .trim()
      .toLowerCase()
  // Normalisation forte (utilisée pour dédup et noms/prénoms)
  const normalizeSociete = (s: any) =>
    String(s ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")
  const societesSet = useMemo(() => {
    const set = new Set<string>()
    for (const s of societes as any[]) {
      // backend retourne généralement { nom, domaine, extension }
      if (s?.nom) set.add(societeExactKey(s.nom))
    }
    return set
  }, [societes])

  const societesMap = useMemo(() => {
    const map = new Map<string, { patterne: string }>()
    for (const s of societes as any[]) {
      const key = s?.nom ? societeExactKey(s.nom) : ""
      if (!key) continue
      map.set(key, {
        patterne: String(s?.patterne ?? "").trim(),
      })
    }
    return map
  }, [societes])

  const normalizeToken = (v: any) =>
    String(v ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")

  // L'email est généré côté backend lors de "Envoyer à Optimized"

  useEffect(() => {
    setSelectedLeadIds(new Set())
  }, [leads, refresh])

  useEffect(() => {
    const fetchStagingHistory = async () => {
      if (leads !== "staging") return
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

  useEffect(() => {
    const fetchPattern = async () => {
      if (leads !== "incomplete") return
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
  const isIncompleteView = leads === "incomplete"
  const isVerifiableView = leads === "incomplete" || leads === "complete" || leads === "staging"
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

  const selectAllGreenLeads = () => {
    const ids = (data ?? [])
      .filter((d: any) => societesSet.has(societeExactKey(d?.societe)))
      .map((d: any) => Number(d.id))
      .filter((n: number) => Number.isFinite(n))
    setSelectedLeadIds(new Set(ids))
  }

  const sendSelectedToOptimized = async () => {
    if (!isSteagingApplique) return
    const ids = Array.from(selectedLeadIds)
    if (ids.length === 0) return
    setSendingToOptimized(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staging/to-optimized`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, pattern: emailPattern }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail || `Erreur serveur : ${res.status}`)
      setCleanResult({ message:`Envoyé vers Optimized: ${json?.moved_to_incomplete ?? 0} | déjà en Optimized supprimés: ${json?.deleted_already_in_optimized ?? 0} | doublons supprimés: ${json?.deleted_duplicates ?? 0} | ignorés: ${json?.skipped ?? 0}` })
      clearSelection()
      setRefresh((p) => p + 1)
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'envoi vers Optimized")
    } finally {
      setSendingToOptimized(false)
    }
  }

  const deleteSelectedFromClean = async () => {
    if (leads !== "clean") return
    const ids = Array.from(selectedLeadIds)
    if (ids.length === 0) return
    setDeletingClean(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clean/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail || `Erreur serveur : ${res.status}`)
      setCleanResult({ message:`Supprimés: ${json?.deleted ?? 0}` })
      clearSelection()
      setRefresh((p) => p + 1)
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la suppression")
    } finally {
      setDeletingClean(false)
    }
  }

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

  useEffect(() => {
    if (!shouldUseDataTable) return
    if (!isSteagingApplique) return
    const nodes = document.querySelectorAll<HTMLElement>(".dt-email-pill")
    nodes.forEach((el) => {
      const socRaw = decodeURIComponent(el.dataset.soc || "")
      const soc = societeExactKey(socRaw)
      const companyExists = soc && societesSet.has(soc)
      el.style.border = companyExists ? "1px solid rgba(34,197,94,0.55)" : "1px solid var(--app-border)"
      el.style.background = companyExists ? "rgba(34,197,94,0.10)" : "transparent"
      el.style.color = companyExists ? "#059669" : "var(--app-text-secondary)"

      const txt = (el.textContent || "").trim()
      if (companyExists) {
        if (txt === "Email manquant") el.textContent = "Email générable"
      } else {
        if (txt === "Email générable") el.textContent = "Email manquant"
      }
    })
  }, [societesSet, shouldUseDataTable, isSteagingApplique])

  // Coloration des emails selon leur conformité au patterne de la société (vérif regex).
  // Vert = conforme, rouge = non conforme. Ne touche que les pastilles ayant un email réel.
  useEffect(() => {
    if (!shouldUseDataTable) return
    if (!isSelectableList && !isSteagingApplique) return
    const byId = new Map<number, any>()
    for (const d of (data as any[])) {
      const idn = Number(d?.id)
      if (Number.isFinite(idn)) byId.set(idn, d)
    }
    document.querySelectorAll<HTMLElement>(".dt-email-pill").forEach((el) => {
      const lead = byId.get(Number(el.dataset.id))
      if (!lead) return
      const email = String(lead?.email ?? "").trim()
      if (!email || email.toLowerCase() === "nan") return // pas d'email -> laissé aux autres effets
      const patterne = societesMap.get(societeExactKey(lead?.societe))?.patterne || ""
      const match = emailMatchesPatterne(email, patterne, lead?.prenom, lead?.nom)
      if (match === null) return // société inconnue / sans patterne -> on ne juge pas
      el.style.border = match ? "1px solid rgba(34,197,94,0.55)" : "1px solid rgba(244,63,94,0.55)"
      el.style.background = match ? "rgba(34,197,94,0.10)" : "rgba(244,63,94,0.10)"
      el.style.color = match ? "#059669" : "#e11d48"
      el.title = match
        ? "Email conforme au patterne de la société"
        : `Email NON conforme au patterne (${patterne})`
    })
  }, [data, societesMap, shouldUseDataTable, isSelectableList, isSteagingApplique])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Le fichier importé doit avoir l'extension .csv ou .xlsx (.xls accepté)
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setError("Format invalide : seuls les fichiers .csv, .xlsx ou .xls sont acceptés.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    setUploading(true)
    setError(null)
    setCleanResult(null)
    setMobileMenuOpen(false)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userid", userId.toString())
      // Pour l'export manager (Historique des imports)
      formData.append("username", String(user?.firstName || (user as any)?.publicMetadata?.firstName || ""))
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`)
      const payload = await res.json()
      if (payload?.message) {
        setCleanResult(payload)
      }
      setUploadedFilename(file.name)
      setUploadedRows(Number(payload?.inserted_rows || 0))
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
        db = "import_leads"
      }
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

  const handleApplyEmailPatternOptimized = async () => {
    setApplyingEmailPattern(true)
    setError(null)
    setCleanResult(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/optimized/complete-email`, {
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
      setCleanResult({ message:"Pattern enregistré" })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingEmailPattern(false)
    }
  }

  const handleToComplete = async (leadId: number) => {
    setError(null)
    setCleanResult(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tocomplete/${leadId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      setCleanResult({ message: data.message || "Lead promu Complete avec succès !" })
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
      setCleanResult({ message: json?.message ||`${emails.length} emails vérifiés` })
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
        [leadId]: { status: isValid ?"valid" :"invalid", message: data.status || (isValid ?"Email livré" :"Email introuvable") },
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

  const downloadCSV = () => {
    openApi(`${process.env.NEXT_PUBLIC_API_URL}/download-leads-csv/${leads}`)
    setMobileMenuOpen(false)
  }
  const downloadXlsx = () => {
    openApi(`${process.env.NEXT_PUBLIC_API_URL}/download-leads-xlsx/${leads}`)
    setMobileMenuOpen(false)
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

  const badge = getLeadBadge(leads)

  // Composant Carte mobile
  const MobileCard = ({ lead, index }: { lead: any; index: number }) => {
    const isExpanded = expandedCard === index
    const hasActionButtons = leads === "complete" || leads === "prod" || leads === "incomplete"
    const id = Number(lead?.id)
    const isSelected = Number.isFinite(id) && selectedLeadIds.has(id)
    // Conformité de l'email au patterne de la société (regex) : true / false / null (non évaluable)
    const leadPatterne = societesMap.get(societeExactKey(lead?.societe))?.patterne || ""
    const emailMatch = emailMatchesPatterne(lead?.email, leadPatterne, lead?.prenom, lead?.nom)

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
              {isSelectableList && Number.isFinite(id) && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => toggleLeadSelected(id, e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#4f46e5" }}
                />
              )}
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
            {(lead.email || isSteagingApplique) && (
              <div
                className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg"
                style={{
                  border:
                    emailMatch === true ? "1px solid rgba(34,197,94,0.55)"
                    : emailMatch === false ? "1px solid rgba(244,63,94,0.55)"
                    : isSteagingApplique && societesSet.has(societeExactKey(lead?.societe))
                      ? "1px solid rgba(34,197,94,0.55)"
                      : "1px solid var(--app-border)",
                  background:
                    emailMatch === true ? "rgba(34,197,94,0.10)"
                    : emailMatch === false ? "rgba(244,63,94,0.10)"
                    : isSteagingApplique && societesSet.has(societeExactKey(lead?.societe))
                      ? "rgba(34,197,94,0.10)"
                      : "transparent",
                }}
              >
                <Mail size={12} style={{ color: "var(--app-text-faint)" }} />
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="text-blue-400 text-xs truncate flex-1 min-w-0">
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-xs truncate flex-1 min-w-0" style={{ color: "var(--app-text-muted)" }}>
                    {isSteagingApplique && societesSet.has(societeExactKey(lead?.societe)) ? "Email générable" : "Email manquant"}
                  </span>
                )}
                {emailMatch !== null && (
                  <span
                    className="text-[10px] font-semibold whitespace-nowrap px-1.5 py-0.5 rounded"
                    title={emailMatch ? "Email conforme au patterne de la société" : `Non conforme au patterne (${leadPatterne})`}
                    style={emailMatch
                      ? { color: "#059669", background: "rgba(34,197,94,0.12)" }
                      : { color: "#e11d48", background: "rgba(244,63,94,0.12)" }}
                  >
                    {emailMatch ? "patterne" : "hors patterne"}
                  </span>
                )}
              </div>
            )}
            {isVerifiableView && lead.email && (
              <div>
                <button
                  onClick={() => handleVerifyEmail(Number(lead.id), lead.email)}
                  disabled={verifyingEmailId === Number(lead.id)}
                  className="app-btn app-btn-sm app-btn-soft w-full"
                >
                  {verifyingEmailId === Number(lead.id) ? "Vérification..." : "Vérifier email"}
                </button>
                {emailVerifyResults[Number(lead.id)] && (
                  <p className="text-xs mt-1 px-1" style={{ color: emailVerifyResults[Number(lead.id)].status === "valid" ? "#059669" : "#e11d48" }}>
                    {emailVerifyResults[Number(lead.id)].message}
                  </p>
                )}
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
              {leads === "incomplete" && (
                <button
                  onClick={() => handleToComplete(lead.id)}
                  className="app-btn app-btn-sm app-btn-warning flex-1"
                >
                  Promouvoir Complete
                </button>
              )}
              {(leads === "complete" || leads === "prod") && (
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
        const soc = societeExactKey(socRaw)
        const companyExists = isSteagingApplique && soc && societesSet.has(soc)
        const border = companyExists ? "1px solid rgba(34,197,94,0.55)" : "1px solid var(--app-border)"
        const bg = companyExists ? "rgba(34,197,94,0.10)" : "transparent"
        const color = companyExists ? "#059669" : "var(--app-text-secondary)"
        const value = val ? String(val) : ""
        const text =
          value
            ? value
            : isSteagingApplique
              ? (companyExists ? "Email générable" : "Email manquant")
              : ""
        const opacity = value ? 1 : 0.55
        const pill = `<span class="dt-email-pill" data-soc="${encodeURIComponent(socRaw)}" data-id="${id}" style="display:block;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:4px 8px;border-radius:8px;border:${border};background:${bg};color:${color};opacity:${opacity};">${text || ""}</span>`
        const verifyBtn = isVerifiableView && value
          ? `<button data-id="${id}" data-type="verify-email" data-email="${encodeURIComponent(value)}" class="dt-verify-email-btn" style="display:block;margin-top:4px;padding:2px 8px;border-radius:5px;border:1px solid rgba(129,140,248,0.3);color:#4338ca;background:rgba(129,140,248,0.1);cursor:pointer;font-size:10px;font-weight:600;width:100%;text-align:center;">Vérifier email</button>`
          : ""
        return `<div>${pill}${verifyBtn}</div>`
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
  const selectColumn = {
    data: "__select__",
    title: "",
    orderable: false,
    searchable: false,
    width: "34px",
    render: (_: any, _t: any, row: any) => {
      const id = Number(row?.id)
      const checked = Number.isFinite(id) && selectedLeadIds.has(id)
      return `<input type="checkbox" class="dt-select-row" data-id="${id}" ${checked ? "checked" : ""} style="width:14px;height:14px;accent-color:#4f46e5;cursor:pointer;" />`
    },
  }
  const blackColumn = { data: "eliminer", title: "Eliminer", defaultContent: "" }
  const prodColumn = { data: "id", title: "Action", orderable: false, render: (id: number) => `<div style="display:flex;gap:6px;flex-wrap:wrap;"><button data-id="${id}" data-type="Unsubscribe" class="dt-action-btn" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(244,63,94,0.4);color:#e11d48;background:rgba(244,63,94,0.08);cursor:pointer;font-size:11px;font-weight:600;">Désabonner</button><button data-id="${id}" data-type="archive" class="dt-action-btn" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(148,163,184,0.3);color:#64748b;background:rgba(148,163,184,0.08);cursor:pointer;font-size:11px;font-weight:600;">Archiver</button></div>` }
  const completeColumn = { data:"id", title:"Action", orderable: false, render: (id: number) =>`<button data-id="${id}" data-type="to-complete" class="dt-action-btn" style="padding:4px 12px;border-radius:6px;border:1px solid rgba(245,158,11,0.4);color:#d97706;background:rgba(245,158,11,0.08);cursor:pointer;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;">Complete</button>` }
  const dateColumn = { data: "created_at", title: "Date", render: (val: string, type: string) => (type === "sort" || type === "type") ? (val ? new Date(val).getTime() : 0) : (val ? new Date(val).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "") }
  const columns = [
    ...(isSelectableList ? [selectColumn] : []),
    ...baseColumns,
    ...(leads === "black" ? [blackColumn] : []),
    ...(leads === "complete" || leads === "prod" ? [prodColumn] : []),
    ...(leads === "incomplete" ? [completeColumn] : []),
    dateColumn,
  ]
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
          ? `<a href="${val}" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;text-decoration:underline;">LinkedIn</a>`
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
          complete: { label: "Complete", color: "#d97706", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)" },
          incomplete: { label: "Incomplete", color: "var(--app-text-muted)", bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.35)" },
          clean: { label: "Clean", color: "#059669", bg: "rgba(110,231,183,0.15)", border: "rgba(110,231,183,0.35)" },
          staging: { label: "Staging", color: "#4338ca", bg: "rgba(129,140,248,0.15)", border: "rgba(129,140,248,0.35)" },
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
    if (type === "to-complete") handleToComplete(id)
    else if (type === "verify-email") handleVerifyEmail(id, decodeURIComponent(btn.dataset.email || ""))
    else handelclick(type, id)
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
            <div className="hidden md:flex gap-2">
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
              {leads === "staging" && <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="app-btn app-btn-sm app-btn-soft"><Upload size={13} />{uploading ? "Chargement..." : "Importer"}</button>}
              {isSelectableList && (
                <>
                  <div className="app-chip">
                    <span className="text-[11px] font-semibold" style={{ color: "var(--app-text-muted)" }}>
                      Sélection: <span className="text-[color:var(--app-text)]">{selectedLeadIds.size}</span>
                    </span>
                  </div>
                  {isSteagingApplique && (
                    <button
                      onClick={selectAllGreenLeads}
                      disabled={(data?.length || 0) === 0}
                      className="app-btn app-btn-sm app-btn-success"
                    >
                      Sélectionner verts
                    </button>
                  )}
                  <button
                    onClick={() => (selectedLeadIds.size === (data?.length || 0) ? clearSelection() : selectAllLeads())}
                    disabled={(data?.length || 0) === 0}
                    className="app-btn app-btn-sm app-btn-soft"
                  >
                    {selectedLeadIds.size === (data?.length || 0) ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                  {isSteagingApplique && (
                    <button
                      onClick={sendSelectedToOptimized}
                      disabled={selectedLeadIds.size === 0 || sendingToOptimized}
                      className="app-btn app-btn-sm app-btn-secondary"
                    >
                      {sendingToOptimized ? "Envoi..." : "Envoyer à Optimized"}
                    </button>
                  )}
                  {isVerifiableView && (
                    <button
                      onClick={handleBulkVerifyEmails}
                      disabled={selectedLeadIds.size === 0 || sendingBulkVerify}
                      className="app-btn app-btn-sm app-btn-soft"
                    >
                      {sendingBulkVerify ? "Vérification..." : "Vérifier emails"}
                    </button>
                  )}
                  {leads === "clean" && (
                    <button
                      onClick={deleteSelectedFromClean}
                      disabled={selectedLeadIds.size === 0 || deletingClean}
                      className="app-btn app-btn-sm app-btn-danger"
                    >
                      {deletingClean ? "Suppression..." : "Supprimer"}
                    </button>
                  )}
                </>
              )}
              {leads === "staging" && !isManager && <><button onClick={downloadLastImportCSV} disabled={!userId} className="app-btn app-btn-sm app-btn-success"><Download size={13} />Dernier CSV</button><button onClick={downloadLastImportXlsx} disabled={!userId} className="app-btn app-btn-sm app-btn-info"><Download size={13} />Dernier XLSX</button></>}
              {leads === "staging" && <button onClick={handleClean} disabled={cleaning || data.length === 0} className="app-btn app-btn-sm app-btn-warning"><Sparkles size={13} />{cleaning ? "Nettoyage..." : "Nettoyer"}</button>}
              {leads === "complete" && <><button onClick={downloadCSV} className="app-btn app-btn-sm app-btn-success"><Download size={13} />CSV</button><button onClick={downloadXlsx} className="app-btn app-btn-sm app-btn-info"><Download size={13} />XLSX</button></>}
              {(leads === "incomplete" || leads === "complete") && <button onClick={handleReformulerLocalisation} disabled={reformulatingLocation} className="app-btn app-btn-sm app-btn-soft"><MapPin size={13} />{reformulatingLocation ? "Reformulation..." : "Reformuler localisation"}</button>}
            </div>
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
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          {leads === "staging" && <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="app-btn app-btn-soft w-full"><Upload size={14} />{uploading ? "Chargement..." : "Importer"}</button>}
          {leads === "staging" && !isManager && <><button onClick={downloadLastImportCSV} disabled={!userId} className="app-btn app-btn-success w-full"><Download size={14} />Exporter dernier CSV</button><button onClick={downloadLastImportXlsx} disabled={!userId} className="app-btn app-btn-info w-full"><Download size={14} />Exporter dernier XLSX</button></>}
          {leads === "staging" && <button onClick={handleClean} disabled={cleaning || data.length === 0} className="app-btn app-btn-warning w-full"><Sparkles size={14} />{cleaning ? "Nettoyage..." : "Nettoyer"}</button>}
          {leads === "complete" && <><button onClick={downloadCSV} className="app-btn app-btn-success w-full"><Download size={14} />Télécharger CSV</button><button onClick={downloadXlsx} className="app-btn app-btn-info w-full"><Download size={14} />Télécharger XLSX</button></>}
          <button onClick={() => { setRefresh((p) => p + 1); setMobileMenuOpen(false); }} className="app-btn app-btn-secondary w-full"><RefreshCw size={14} />Actualiser</button>
        </div>
      )}

      {/* Messages d'erreur / succès (inchangés) */}
      {err && <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background:"rgba(244,63,94,0.07)", border:"1px solid rgba(244,63,94,0.22)", color:"#e11d48" }}>{err}</div>}
      {cleanResult && cleanResult.message && !cleanResult.moved_to_complete && !cleanResult.total_deleted && <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background:"rgba(110,231,183,0.07)", border:"1px solid rgba(110,231,183,0.22)", color:"#059669" }}>{cleanResult.message}</div>}
      <ResultSummary cleanResult={cleanResult} uploadedRows={uploadedRows} />

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
        {leads === "incomplete" && (
          <div
            className="mb-3 rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-2"
            style={{ background: "var(--app-bg-subtle)", border: "1px solid var(--app-border)" }}
          >
            <div className="text-xs sm:text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>
              Pattern email
            </div>
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <input
                value={emailPattern}
                onChange={(e) => setEmailPattern(e.target.value)}
                disabled={!isManager}
                className="px-3 py-2 rounded-lg text-xs sm:text-sm w-full"
                style={{ background: "var(--app-surface-hover)", border: "1px solid var(--app-border)", color: "var(--app-text-secondary)", outline: "none", opacity: !isManager ? 0.75 : 1 }}
                placeholder="{prenom}.{nom}@{domaine}.{extension}"
              />
              <button
                onClick={handleApplyEmailPatternOptimized}
                disabled={applyingEmailPattern}
                className="app-btn app-btn-success"
              >
                {applyingEmailPattern ? "Application..." : "Appliquer pattern email"}
              </button>
              {isManager && (
                <button
                  onClick={handleSaveEmailPattern}
                  disabled={savingEmailPattern}
                  className="app-btn app-btn-soft"
                >
                  {savingEmailPattern ? "Enregistrement..." : "Enregistrer"}
                </button>
              )}
            </div>
          </div>
        )}
        {!DTableComponent && shouldUseDataTable ? (
          <div className="app-empty"><Loader2 size={28} className="animate-spin" /><p className="text-sm">Chargement...</p></div>
        ) : data.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--app-text-faint)" }}><Inbox size={34} className="mx-auto mb-3" /><p className="text-base font-medium" style={{ color: "var(--app-text-faint)" }}>Aucune donnée disponible</p>{leads === "staging" && <p className="text-xs mt-2" style={{ color: "var(--app-text-faint)" }}>Importez un fichier CSV ou Excel pour commencer</p>}</div>
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
                            const color = isValid ? "#059669" : "#e11d48"
                            btn.textContent = isValid ?"Vérifié" :"Introuvable"
                            btn.style.borderColor = isValid ? "rgba(34,197,94,0.4)" : "rgba(244,63,94,0.4)"
                            btn.style.color = color
                            btn.style.background = isValid ? "rgba(34,197,94,0.1)" : "rgba(244,63,94,0.1)"
                            setEmailVerifyResults((prev) => ({ ...prev, [leadId]: { status: isValid ? "valid" : "invalid", message: data.status || "" } }))
                          } catch (err: any) {
                            btn.textContent ="Erreur"
                            btn.style.color = "#e11d48"
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

        {leads === "staging" && (
          <div
            className="mt-6 rounded-xl p-3 sm:p-4"
            style={{
              background: "var(--app-bg-subtle)",
              border: "1px solid var(--app-border)",
            }}
          >
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="text-sm sm:text-base font-semibold text-[color:var(--app-text)]">
                Historique des imports
              </h3>
              <span className="flex items-center gap-2 text-xs" style={{ color: "var(--app-text-faint)" }}>
                
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md" style={{ background: "var(--app-surface-hover)", border: "1px solid var(--app-border)" }}>
                  {historyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </span>
            </button>

            {historyOpen && (loadingHistory ? (
              <p className="text-xs sm:text-sm" style={{ color: "var(--app-text-muted)" }}>
                Chargement de l'historique...
              </p>
            ) : stagingHistory.length === 0 ? (
              <p className="text-xs sm:text-sm" style={{ color: "var(--app-text-faint)" }}>
                Aucun lead importe precedemment.
              </p>
            ) : (
              <div className="w-full overflow-x-auto history-dt-wrapper">
                {DTableComponent && (
                  <DTableComponent
                    key={`history-${stagingHistory.length}`}
                    data={stagingHistory}
                    columns={historyColumns}
                    className="display w-full"
                    options={{
                      order: [[0, "desc"]],
                      pageLength: isMobile ? 5 : 10,
                      responsive: true,
                      scrollX: isMobile,
                      initComplete: function (this: any) {
                        const api = (this as any).api()
                        if (!isMobile) injectSearchIcons(api, historyColumns, historySearchableCols, "imported_at")
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
                      <tr>{historyColumns.map((col, i) => <th key={i}>{col.title}</th>)}</tr>
                    </thead>
                  </DTableComponent>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}