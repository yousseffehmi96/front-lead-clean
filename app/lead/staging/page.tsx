"use client"
import Usefetch from "@/hooks/SocieteFetch"
import { useEffect, useMemo, useRef, useState } from "react"
import { Upload, Sparkles, RefreshCw, Download, Trash2, Menu, X, ChevronDown, ChevronUp, Filter, Eye, Phone, Mail, Building, User, Briefcase, Linkedin, Calendar, MapPin } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useSelector } from "react-redux"

export default function SteagingAppliquePage() {
  const leads = "staging"
  const [DTableComponent, setDTableComponent] = useState<any>(null)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [stat, setstat] = useState<string | null>(null)
  const [err, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState<number>(0)
  // Refresh dédié à la liste des sociétés (ne remonte pas le tableau des leads)
  const [societeRefresh, setSocieteRefresh] = useState<number>(0)
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
  // Ref toujours à jour : évite que les redraw DataTable décochent les cases (closure figée)
  const selectedLeadIdsRef = useRef<Set<number>>(selectedLeadIds)
  selectedLeadIdsRef.current = selectedLeadIds
  const [emailPattern, setEmailPattern] = useState<string>("{prenom}.{nom}@{domaine}.{extension}")
  const [sendingToOptimized, setSendingToOptimized] = useState(false)
  const [sendingBulkVerify, setSendingBulkVerify] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; disponible: number; non_disponible: number } | null>(null)
  const [verifyingEmailId, setVerifyingEmailId] = useState<number | null>(null)
  const [emailVerifyResults, setEmailVerifyResults] = useState<Record<number, { status: "valid" | "invalid" | "error"; message: string }>>({})
  // Emails générés en place (sans recharger la page)
  const [generatedEmails, setGeneratedEmails] = useState<Record<number, string>>({})
  const userId = useSelector((state:any) => state.user.userId)
  const email = useSelector((state:any) => state.user.email)
  const { user, isLoaded } = useUser()
  const userRole = ((user?.publicMetadata?.role as string) || "agent").toLowerCase()
  const isManager = userRole === "manager"
  const isStaging = false
  const isSelectableList = false
  const isSteagingApplique = true

  const { data: fetchedLeads, loading: loadingLeads } = Usefetch(
    `${process.env.NEXT_PUBLIC_API_URL}/${leads}?refresh=${refresh}`
  )
  const rawData = fetchedLeads || []
  // Refetch la liste sociétés sur `refresh` (actions leads) ET `societeRefresh` (focus fenêtre)
  const societes = Usefetch(`${process.env.NEXT_PUBLIC_API_URL}/societe?refresh=${refresh}&s=${societeRefresh}`).data || []

  // Les messages (erreur / résultat) s'effacent tout seuls au bout de 10 s.
  // Le timer repart à zéro à chaque nouveau message.
  useEffect(() => {
    if (!err && !cleanResult) return
    const timer = setTimeout(() => {
      setError(null)
      setCleanResult(null)
    }, 10000)
    return () => clearTimeout(timer)
  }, [err, cleanResult])

  const normalizeTextKey = (v: any) =>
    String(v ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
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
  const societesSet = useMemo(() => {
    const set = new Set<string>()
    for (const s of societes as any[]) {
      // backend retourne généralement { nom, domaine, extension }
      if (s?.nom) set.add(societeExactKey(s.nom))
    }
    return set
  }, [societes])

  const societesMap = useMemo(() => {
    const map = new Map<string, { domaine: string; extension: string }>()
    for (const s of societes as any[]) {
      const key = s?.nom ? societeExactKey(s.nom) : ""
      if (!key) continue
      map.set(key, {
        domaine: String(s?.domaine ?? "").trim().toLowerCase(),
        extension: String(s?.extension ?? "").trim().toLowerCase(),
      })
    }
    return map
  }, [societes])

  const normalizeToken = (v: any) =>
    String(v ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "")

  // L'email est généré côté backend lors de "Envoyer à Optimized"

  useEffect(() => {
    setSelectedLeadIds(new Set())
  }, [leads, refresh])

  // Re-synchronise la liste des sociétés quand l'onglet reprend le focus
  // (ex. après avoir ajouté une société dans l'onglet Company) — sans recharger la page.
  useEffect(() => {
    const refetchSocietes = () => {
      if (document.visibilityState === "visible") setSocieteRefresh((p) => p + 1)
    }
    window.addEventListener("focus", refetchSocietes)
    document.addEventListener("visibilitychange", refetchSocietes)
    return () => {
      window.removeEventListener("focus", refetchSocietes)
      document.removeEventListener("visibilitychange", refetchSocietes)
    }
  }, [])

  // Détection mobile
  const [isMobile, setIsMobile] = useState(false)
  const isIncompleteView = false
  // Vérification manuelle par lead désactivée : le cron vérifie automatiquement
  // les emails après import et promeut les disponibles vers Optimized.
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

  // Sélectionne uniquement les leads dont l'email est vérifié "disponible"
  const selectAllGreenLeads = () => {
    const ids = (data ?? [])
      .filter((d: any) => String(d?.statu ?? "").trim().toLowerCase() === "disponible")
      .map((d: any) => Number(d.id))
      .filter((n: number) => Number.isFinite(n))
    setSelectedLeadIds(new Set(ids))
  }

  const sendSelectedToOptimized = async () => {
    if (!isSteagingApplique) return
    const isUnavailable = (d: any) => String(d?.statu ?? "").trim().toLowerCase() === "non disponible"
    const selected = (data as any[]).filter((d: any) => selectedLeadIds.has(Number(d.id)))
    const blockedCount = selected.filter(isUnavailable).length
    // On exclut les emails vérifiés "non disponible"
    const ids = selected.filter((d: any) => !isUnavailable(d)).map((d: any) => Number(d.id))
    if (ids.length === 0) {
      setError(blockedCount > 0
        ? "Envoi impossible : tous les leads sélectionnés ont un email non disponible."
        : "Aucun lead sélectionné.")
      return
    }
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
      // Non envoyés = exclus côté front (non disponibles) + ignorés côté backend → restés dans Applique
      const notSent = (Number(json?.skipped) || 0) + blockedCount
      setCleanResult({ message: `✅ Envoyé vers Optimized: ${json?.moved_to_incomplete ?? 0} | déjà en Optimized supprimés: ${json?.deleted_already_in_optimized ?? 0} | doublons supprimés: ${json?.deleted_duplicates ?? 0} | non envoyés (restés dans Applique): ${notSent}` })
      clearSelection()
      setRefresh((p) => p + 1)
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'envoi vers Optimized")
    } finally {
      setSendingToOptimized(false)
    }
  }

  // Vérification par lead (regex -> sinon email généré depuis patterne -> test SMTP)
  const handleVerifyEmail = async (leadId: number) => {
    setVerifyingEmailId(leadId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staging/verify/${leadId}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      const isValid = data.statu === "disponible"
      const note = data.regenerated && data.email ? ` (email généré : ${data.email})` : ""
      setEmailVerifyResults((prev) => ({
        ...prev,
        [leadId]: { status: isValid ? "valid" : "invalid", message: (isValid ? "✅ Disponible" : "❌ Non disponible") + note },
      }))
      setRefresh((p) => p + 1)
    } catch (e: any) {
      setEmailVerifyResults((prev) => ({ ...prev, [leadId]: { status: "error", message: e.message || "Erreur de vérification" } }))
    } finally {
      setVerifyingEmailId(null)
    }
  }

  // Génère l'email d'un lead depuis le patterne de sa société (sans vérif, sans envoi Silver)
  // Affichage EN PLACE : pas de rechargement de page.
  // Logique de vérif d'un bouton "Vérifier email" desktop (réutilisée par le drawCallback et après génération)
  const runDesktopVerify = async (btn: HTMLElement) => {
    const leadId = Number(btn.dataset.id)
    if (!Number.isFinite(leadId)) return
    btn.textContent = "Vérification..."
    btn.style.opacity = "0.6"
    btn.setAttribute("disabled", "true")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staging/verify/${leadId}`, { method: "POST" })
      const data = await res.json()
      const isValid = data.statu === "disponible"
      const color = isValid ? "#86efac" : "#fda4af"
      btn.textContent = isValid ? "✅ Disponible" : "❌ Non disponible"
      btn.style.borderColor = isValid ? "rgba(34,197,94,0.4)" : "rgba(244,63,94,0.4)"
      btn.style.color = color
      btn.style.background = isValid ? "rgba(34,197,94,0.1)" : "rgba(244,63,94,0.1)"
      if (data.regenerated && data.email) btn.title = `Email généré : ${data.email}`
      const tr = btn.closest("tr")
      if (data.email) {
        const pill = tr?.querySelector(".dt-email-pill") as HTMLElement | null
        if (pill && pill.textContent !== data.email) pill.textContent = data.email
      }
      const table = tr?.closest("table")
      let statuIdx = -1
      table?.querySelectorAll("thead th").forEach((th, i) => {
        if ((th.textContent || "").trim().toLowerCase().startsWith("statut")) statuIdx = i
      })
      const cell = statuIdx >= 0 ? (tr?.children[statuIdx] as HTMLElement | undefined) : undefined
      if (cell) {
        const v = isValid ? "disponible" : "non disponible"
        const bgc = isValid ? "rgba(34,197,94,0.1)" : "rgba(244,63,94,0.1)"
        const bd = isValid ? "rgba(34,197,94,0.3)" : "rgba(244,63,94,0.3)"
        cell.innerHTML = `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;color:${color};background:${bgc};border:1px solid ${bd};white-space:nowrap;">${v}</span>`
      }
    } catch {
      btn.textContent = "❌ Erreur"
      btn.style.color = "#fda4af"
    } finally {
      btn.style.opacity = "1"
      btn.removeAttribute("disabled")
    }
  }

  // Crée le bouton "Vérifier email" (desktop) prêt à l'emploi
  const makeVerifyBtn = (leadId: number): HTMLButtonElement => {
    const b = document.createElement("button")
    b.className = "dt-verify-email-btn"
    b.dataset.id = String(leadId)
    b.dataset.vl = "1"
    b.textContent = "Vérifier email"
    b.setAttribute("style", "display:block;margin-top:4px;padding:2px 8px;border-radius:5px;border:1px solid rgba(129,140,248,0.3);color:#a5b4fc;background:rgba(129,140,248,0.1);cursor:pointer;font-size:10px;font-weight:600;width:100%;text-align:center;")
    b.addEventListener("click", (e) => { e.stopPropagation(); runDesktopVerify(b) })
    return b
  }

  const handleGenerateEmail = async (leadId: number) => {
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staging/generate/${leadId}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Erreur serveur : ${res.status}`)
      if (data.error) {
        setError(data.error === "societe_inconnue"
          ? "Société inconnue : impossible de générer l'email."
          : "Génération impossible (prénom/nom manquant ou patterne invalide).")
        return
      }
      const email = String(data.email || "")
      // Vue mobile (React) : override local
      setGeneratedEmails((prev) => ({ ...prev, [leadId]: email }))
      // Vue desktop (DataTable) : maj DOM en place de la pastille
      const pill = document.querySelector(`.dt-email-pill[data-id="${leadId}"]`) as HTMLElement | null
      if (pill) {
        pill.textContent = email
        // L'email existe désormais -> texte simple, plus de pastille encadrée
        pill.style.border = "none"
        pill.style.background = "transparent"
        pill.style.padding = "0"
        pill.style.color = "#e2e8f0"
        pill.style.opacity = "1"
        pill.style.cursor = ""
        pill.classList.remove("dt-generate-email")
        pill.removeAttribute("title")
        // Injecter le bouton "Vérifier email" (comme si la cellule avait été rendue avec un email)
        const cellDiv = pill.parentElement
        if (email && isVerifiableView && cellDiv && !cellDiv.querySelector(".dt-verify-email-btn")) {
          cellDiv.appendChild(makeVerifyBtn(leadId))
        }
      }
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la génération de l'email")
    }
  }

  // Vérification groupée : lance un job en arrière-plan et suit la progression.
  const handleBulkVerifyEmails = async () => {
    const ids = Array.from(selectedLeadIds)
    console.log(ids);
    
    if (ids.length === 0) return
    setSendingBulkVerify(true)
    setError(null)
    setCleanResult(null)
    setBulkProgress({ done: 0, total: ids.length, disponible: 0, non_disponible: 0 })
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staging/verify-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail || `Erreur serveur : ${res.status}`)
      const jobId = json?.job_id
      const total = Number(json?.total ?? ids.length)
      if (!jobId) throw new Error("Job non démarré")

      // Poll de progression toutes les 1,5 s
      const final = await new Promise<any>((resolve) => {
        const iv = setInterval(async () => {
          try {
            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staging/verify-status/${jobId}`)
            const s = await r.json()
            setBulkProgress({
              done: Number(s?.done ?? 0),
              total: Number(s?.total ?? total),
              disponible: Number(s?.disponible ?? 0),
              non_disponible: Number(s?.non_disponible ?? 0),
            })
            if (s?.status === "done" || s?.status === "unknown") {
              clearInterval(iv)
              resolve(s)
            }
          } catch {
            // on retente au prochain tick
          }
        }, 1500)
      })

      setCleanResult({ message: `✅ Vérification terminée : ${final?.disponible ?? 0} disponible(s), ${final?.non_disponible ?? 0} non disponible(s) sur ${final?.total ?? total}` })
      setRefresh((p) => p + 1)
      clearSelection()
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la vérification en masse")
    } finally {
      setSendingBulkVerify(false)
      setBulkProgress(null)
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
      const txt = (el.textContent || "").trim()
      const hasEmail = txt !== "" && txt !== "Email manquant" && txt !== "Email générable"

      // 3 états : email présent -> texte simple ; manquant mais générable -> pastille
      // verte cliquable ; manquant non générable -> pastille rouge.
      if (hasEmail) {
        el.style.border = "none"
        el.style.background = "transparent"
        el.style.padding = "0"
        el.style.color = "#e2e8f0"
        el.classList.remove("dt-generate-email")
        el.style.cursor = ""
        el.removeAttribute("title")
      } else if (companyExists) {
        el.style.border = "1px solid rgba(34,197,94,0.55)"
        el.style.background = "rgba(34,197,94,0.10)"
        el.style.padding = "4px 8px"
        el.style.color = "#86efac"
        el.textContent = "Email générable"
        // rendre la pastille cliquable pour générer l'email
        el.classList.add("dt-generate-email")
        el.style.cursor = "pointer"
        el.title = "Cliquer pour générer l'email depuis le patterne"
      } else {
        el.style.border = "1px solid rgba(244,63,94,0.55)"
        el.style.background = "rgba(244,63,94,0.10)"
        el.style.padding = "4px 8px"
        el.style.color = "#fda4af"
        el.textContent = "Email manquant"
        el.classList.remove("dt-generate-email")
        el.style.cursor = ""
        el.removeAttribute("title")
      }
    })
  }, [societesSet, shouldUseDataTable, isSteagingApplique])

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

  const badgeConfig: Record<string, { label: string; color: string; bg: string }> = {
    import: { label: "RAW", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    complete: { label: "★ COMPLETE", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    incomplete: { label: "◆ INCOMPLETE", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
    clean: { label: "✦ CLEAN", color: "#6ee7b7", bg: "rgba(110,231,183,0.1)" },
    "staging": { label: "🧩 APPLIQUE", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
    black: { label: "⛔ BLACK", color: "#f43f5e", bg: "rgba(244,63,94,0.1)" },
  }
  const badge = badgeConfig[leads as string] ?? { label: leads, color: "#818cf8", bg: "rgba(129,140,248,0.1)" }

  // Composant Carte mobile
  const MobileCard = ({ lead, index }: { lead: any; index: number }) => {
    const isExpanded = expandedCard === index
    const id = Number(lead?.id)
    const isSelected = Number.isFinite(id) && selectedLeadIds.has(id)
    // email affiché = email généré en place s'il existe, sinon celui du lead
    const displayEmail = generatedEmails[id] ?? lead.email

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
            {(displayEmail || isSteagingApplique) && (
              <div
                className={`flex items-center gap-2 text-sm rounded-lg ${displayEmail ? "" : "px-2 py-1.5"}`}
                style={{
                  // 3 états : email présent -> texte simple ; manquant mais générable -> vert ; manquant -> rouge
                  border: displayEmail
                    ? "none"
                    : societesSet.has(societeExactKey(lead?.societe))
                      ? "1px solid rgba(34,197,94,0.55)"
                      : "1px solid rgba(244,63,94,0.55)",
                  background: displayEmail
                    ? "transparent"
                    : societesSet.has(societeExactKey(lead?.societe))
                      ? "rgba(34,197,94,0.10)"
                      : "rgba(244,63,94,0.10)",
                }}
              >
                <Mail size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                {displayEmail ? (
                  <a href={`mailto:${displayEmail}`} className="text-blue-400 text-xs truncate flex-1 min-w-0">
                    {displayEmail}
                  </a>
                ) : isSteagingApplique && societesSet.has(societeExactKey(lead?.societe)) ? (
                  <button
                    onClick={() => handleGenerateEmail(Number(lead.id))}
                    title="Générer l'email depuis le patterne"
                    className="text-xs truncate flex-1 min-w-0 text-left underline decoration-dotted"
                    style={{ color: "#86efac" }}
                  >
                    Email générable
                  </button>
                ) : (
                  <span className="text-xs truncate flex-1 min-w-0" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Email manquant
                  </span>
                )}
              </div>
            )}
            {isVerifiableView && displayEmail && (
              <div>
                <button
                  onClick={() => handleVerifyEmail(Number(lead.id))}
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
              {new Date(lead.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
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
        const soc = societeExactKey(socRaw)
        const companyExists = isSteagingApplique && soc && societesSet.has(soc)
        const value = val ? String(val) : ""
        const hasEmail = !!value
        // 3 états : email présent -> texte simple ; manquant mais générable -> pastille verte ;
        // manquant non générable -> pastille rouge. Seuls les états "manquant" sont
        // encadrés : ce sont des badges de statut (et le vert est cliquable).
        const border = hasEmail
          ? "none"
          : companyExists ? "1px solid rgba(34,197,94,0.55)" : "1px solid rgba(244,63,94,0.55)"
        const bg = hasEmail
          ? "transparent"
          : companyExists ? "rgba(34,197,94,0.10)" : "rgba(244,63,94,0.10)"
        const color = hasEmail
          ? "#e2e8f0"
          : companyExists ? "#86efac" : "#fda4af"
        const padding = hasEmail ? "0" : "4px 8px"
        const text = value ? value : (companyExists ? "Email générable" : "Email manquant")
        const opacity = value ? 1 : 0.55
        // "Email générable" -> pastille cliquable qui génère l'email depuis le patterne
        const generable = !value && companyExists
        const genCls = generable ? " dt-generate-email" : ""
        const genStyle = generable ? "cursor:pointer;" : ""
        const genTitle = generable ? ' title="Cliquer pour générer l\'email depuis le patterne"' : ""
        const pill = `<span class="dt-email-pill${genCls}" data-soc="${encodeURIComponent(socRaw)}" data-id="${id}"${genTitle} style="display:block;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:${padding};border-radius:8px;border:${border};background:${bg};color:${color};opacity:${opacity};${genStyle}">${text || ""}</span>`
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
      const checked = Number.isFinite(id) && selectedLeadIdsRef.current.has(id)
      return `<input type="checkbox" class="dt-select-row" data-id="${id}" ${checked ? "checked" : ""} style="width:14px;height:14px;accent-color:#818cf8;cursor:pointer;" />`
    },
  }
  const dateColumn = { data: "created_at", title: "Date", render: (val: string, type: string) => (type === "sort" || type === "type") ? (val ? new Date(val).getTime() : 0) : (val ? new Date(val).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "") }
  const columns = [
    selectColumn,
    ...baseColumns,
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
    const genPill = (e.target as HTMLElement).closest(".dt-generate-email") as HTMLElement | null
    if (genPill) {
      const id = Number(genPill.dataset.id)
      if (Number.isFinite(id)) handleGenerateEmail(id)
      return
    }
    const btn = (e.target as HTMLElement).closest(".dt-action-btn") as HTMLElement | null
    if (!btn) return
    const id = Number(btn.dataset.id)
    const type = btn.dataset.type!
    handelclick(type, id)
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
                  {isSteagingApplique && (
                    <button
                      onClick={selectAllGreenLeads}
                      disabled={(data?.length || 0) === 0}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
                      style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.30)", color: "#86efac" }}
                    >
                      Sélectionner verts
                    </button>
                  )}
                  <button
                    onClick={() => (selectedLeadIds.size === (data?.length || 0) ? clearSelection() : selectAllLeads())}
                    disabled={(data?.length || 0) === 0}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
                    style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", color: "#a5b4fc" }}
                  >
                    {selectedLeadIds.size === (data?.length || 0) ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                  {isSteagingApplique && (
                    <button
                      onClick={sendSelectedToOptimized}
                      disabled={selectedLeadIds.size === 0 || sendingToOptimized}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
                      style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.28)", color: "#e2e8f0" }}
                    >
                      {sendingToOptimized ? "Envoi..." : "Envoyer à Lead"}
                    </button>
                  )}
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
      {bulkProgress && (
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.25)", color: "#a5b4fc" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span>Vérification des emails… {bulkProgress.done}/{bulkProgress.total}</span>
            <span className="text-white/50">✅ {bulkProgress.disponible} · ❌ {bulkProgress.non_disponible}</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full transition-all duration-300" style={{ width: `${bulkProgress.total ? Math.round((bulkProgress.done / bulkProgress.total) * 100) : 0}%`, background: "#818cf8" }} />
          </div>
        </div>
      )}
      {cleanResult && cleanResult.message && !cleanResult.moved_to_complete && !cleanResult.total_deleted && <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)", color: "#6ee7b7" }}>✅ {cleanResult.message}</div>}
      {cleanResult && cleanResult.total_deleted !== undefined && (<div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fda4af" }}><p className="font-semibold mb-2">🗑️ Suppression des doublons terminée</p><div className="grid grid-cols-2 sm:grid-cols-5 gap-2">{[
        { label: "Total", val: cleanResult.total_deleted, icon: "🔢" },
        { label: "Doublons en Complete", val: cleanResult.staging_vs_complete, icon: "🥇" },
        { label: "Doublons en Incomplete", val: cleanResult.staging_vs_incomplete, icon: "🥈" },
        { label: "Doublons Interne", val: cleanResult.staging_internal, icon: "♻️" },
        { label: "Doublons Staging ", val: cleanResult.staging_vs_applique, icon: "🧩" },
      ].map((item) => (<div key={item.label} className="px-2 sm:px-3 py-2 rounded-lg text-center" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.15)" }}><p className="text-xs opacity-70">{item.icon} {item.label}</p><p className="font-bold text-sm sm:text-base">{item.val ?? 0}</p></div>))}</div>{uploadedRows > 0 && Number(cleanResult.total_deleted || 0) === uploadedRows && (<p className="mt-3 text-xs sm:text-sm font-semibold" style={{ color: "#fca5a5" }}>⚠️ Tu as deja traite ce fichier: tous les leads importes ont ete supprimes comme doublons.</p>)}</div>)}
      {cleanResult && cleanResult.moved_to_complete !== undefined && (<div className="mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm" style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)", color: "#6ee7b7" }}><p className="font-semibold mb-2">✅ Nettoyage terminé</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{[
        { label: "🥇 Complete", val: cleanResult.moved_to_complete },
        { label: "🥈 Incomplete", val: cleanResult.moved_to_incomplete },
        { label: "🧹 Clean", val: cleanResult.moved_to_clean },
        { label: "🧩 Staging", val: cleanResult.moved_to_steaging_applique },
        { label: "📧 Emails complètè", val: cleanResult.emails_completed },
        { label: "👤 Noms complètè", val: cleanResult.nom_prenom_completed },
      ].map((item) => (<div key={item.label} className="px-2 sm:px-3 py-2 rounded-lg text-center" style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.15)" }}><p className="text-xs opacity-70">{item.label}</p><p className="font-bold text-sm sm:text-base">{item.val ?? 0}</p></div>))}</div></div>)}


      <div className="px-2 sm:px-3 pb-4 pt-2 overflow-y-auto flex-1 overflow-x-hidden">
        {loadingLeads || (!DTableComponent && shouldUseDataTable) ? (
          // Squelette aux dimensions du tableau : évite le saut de mise en page
          // et le faux message "Aucune donnée" tant que le chargement est en cours.
          <div className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
            <div className="h-11 bg-slate-900/80 border-b border-white/10" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 h-12 border-b border-white/5"
                style={{ background: i % 2 ? "rgba(255,255,255,0.025)" : "transparent" }}
              >
                {Array.from({ length: 5 }).map((__, j) => (
                  <div key={j} className="h-3 rounded bg-white/10" style={{ flex: j === 0 ? 0.5 : 1 }} />
                ))}
              </div>
            ))}
          </div>
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
                      // Attacher les listeners sur les boutons vérifier (logique partagée)
                      document.querySelectorAll<HTMLElement>(".dt-verify-email-btn:not([data-vl])").forEach((btn) => {
                        btn.dataset.vl = "1"
                        btn.addEventListener("click", (e) => { e.stopPropagation(); runDesktopVerify(btn) })
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
