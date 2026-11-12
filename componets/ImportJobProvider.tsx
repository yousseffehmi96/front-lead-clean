"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useUser } from "@clerk/nextjs"

/**
 * Suivi de l'import en tâche de fond, partagé par toute l'application.
 *
 * L'état vit ici et non dans la page Import : l'utilisateur doit pouvoir lancer
 * un import, partir sur une autre page, et retrouver la progression (la carte
 * de la sidebar et la page Import lisent le même job, avec un seul polling).
 *
 * Le job_id est mémorisé dans localStorage ; au rechargement on le restaure, et
 * s'il a été perdu on demande au backend l'import courant de l'utilisateur.
 */

const STORAGE_KEY = "leadclean.importJob"
const POLL_MS = 1500

export type ImportJob = {
  job_id: string
  filename?: string | null
  status: "running" | "done" | "error" | "unknown" | "none"
  percent: number
  label?: string | null
  step?: number
  steps_total?: number
  done?: number
  total?: number
  result?: any
  error?: string | null
}

export type StartImportPayload = {
  mapping: Record<string, string>
  rows: Record<string, string>[]
  userid: string
  username: string
  filename: string
}

type ImportJobContextValue = {
  job: ImportJob | null
  starting: boolean
  /** Démarre l'import ; lève une erreur si un autre import tourne déjà (409). */
  startImport: (payload: StartImportPayload) => Promise<ImportJob>
  /** Efface le job terminé de l'affichage. */
  dismiss: () => void
}

const ImportJobContext = createContext<ImportJobContextValue>({
  job: null,
  starting: false,
  startImport: async () => {
    throw new Error("ImportJobProvider manquant")
  },
  dismiss: () => {},
})

export function useImportJob() {
  return useContext(ImportJobContext)
}

const API = () => process.env.NEXT_PUBLIC_API_URL || ""

// localStorage peut lever (navigation privée, cookies bloqués) : jamais sans garde.
function readStoredId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredId(jobId: string | null) {
  try {
    if (jobId) window.localStorage.setItem(STORAGE_KEY, jobId)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // sans persistance on perd juste la reprise après rechargement
  }
}

function normalize(raw: any, fallbackId?: string): ImportJob | null {
  if (!raw || raw.status === "none") return null
  const jobId = raw.job_id || fallbackId
  if (!jobId) return null
  return {
    job_id: jobId,
    filename: raw.filename ?? null,
    status: (raw.status || "unknown") as ImportJob["status"],
    percent: Number(raw.percent ?? 0),
    label: raw.label ?? null,
    step: Number(raw.step ?? 0),
    steps_total: Number(raw.steps_total ?? 0),
    done: Number(raw.done ?? 0),
    total: Number(raw.total ?? 0),
    result: raw.result ?? null,
    error: raw.error ?? null,
  }
}

export default function ImportJobProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [job, setJob] = useState<ImportJob | null>(null)
  const [starting, setStarting] = useState(false)
  // Évite de relancer la reprise à chaque rendu / changement d'utilisateur
  const restored = useRef(false)

  const fetchStatus = useCallback(async (jobId: string): Promise<ImportJob | null> => {
    const res = await fetch(`${API()}/import/status/${jobId}`)
    if (!res.ok) return null
    return normalize(await res.json(), jobId)
  }, [])

  // --- Reprise au montage : localStorage, puis job courant côté serveur ------
  useEffect(() => {
    if (restored.current) return
    const userId = user?.id
    if (!API()) return

    restored.current = true
    let cancelled = false

    ;(async () => {
      const storedId = readStoredId()
      if (storedId) {
        try {
          const fromStorage = await fetchStatus(storedId)
          if (!cancelled && fromStorage && fromStorage.status !== "unknown") {
            setJob(fromStorage)
            return
          }
        } catch {
          // on tente le repli ci-dessous
        }
      }
      // Repli : le job_id local a été perdu (autre navigateur, cache vidé)
      if (!userId) return
      try {
        const res = await fetch(`${API()}/import/current?userid=${encodeURIComponent(userId)}`)
        if (!res.ok) return
        const current = normalize(await res.json())
        if (!cancelled && current) {
          setJob(current)
          writeStoredId(current.job_id)
        } else if (!cancelled) {
          writeStoredId(null)
        }
      } catch {
        // pas de reprise possible, on repart d'un état vide
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, fetchStatus])

  // --- Polling tant que le job tourne ---------------------------------------
  useEffect(() => {
    if (!job || job.status !== "running") return

    let stopped = false
    const iv = setInterval(async () => {
      try {
        const next = await fetchStatus(job.job_id)
        if (stopped || !next) return
        setJob(next)
        if (next.status !== "running") writeStoredId(null)
      } catch {
        // erreur réseau ponctuelle : on retente au prochain tick
      }
    }, POLL_MS)

    return () => {
      stopped = true
      clearInterval(iv)
    }
  }, [job?.job_id, job?.status, fetchStatus])

  const startImport = useCallback(
    async (payload: StartImportPayload) => {
      setStarting(true)
      try {
        const res = await fetch(`${API()}/import/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(data?.detail || `Erreur serveur : ${res.status}`)
        }
        const started: ImportJob = {
          job_id: data.job_id,
          filename: payload.filename,
          status: "running",
          percent: 0,
          label: "Préparation du fichier",
          done: 0,
          total: Number(data.total ?? payload.rows.length),
        }
        writeStoredId(started.job_id)
        setJob(started)
        return started
      } finally {
        setStarting(false)
      }
    },
    []
  )

  const dismiss = useCallback(() => {
    writeStoredId(null)
    setJob(null)
  }, [])

  return (
    <ImportJobContext.Provider value={{ job, starting, startImport, dismiss }}>
      {children}
    </ImportJobContext.Provider>
  )
}
