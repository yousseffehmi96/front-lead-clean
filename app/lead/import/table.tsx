"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { useSelector } from "react-redux"
import { DataTable } from "./data-table"
import { buildColumns, REQUIRED_FIELDS, type RawRow, type FieldKey } from "./columns"
import { Button } from "@/components/ui/button"
import { useImportJob } from "@/componets/ImportJobProvider"
import { AlertCircle, ArrowRight, CheckCircle2, Download, FileSpreadsheet, Loader2 } from "lucide-react"


interface LeadsPageProps {
  data: RawRow[]
  filename?: string
  sheetLabel?: string
  hasNextSheet?: boolean
  onNextSheet?: () => void
}

export default function LeadsPage({
  data,
  filename,
  sheetLabel,
  hasNextSheet,
  onNextSheet,
}: LeadsPageProps) {
  // Union des colonnes de toutes les lignes (pas juste la première), pour
  // que la liste déroulante propose bien tous les champs du fichier Excel/CSV
  // même si certaines cellules sont vides sur la première ligne.
  const fileHeaders = React.useMemo(
    () => Array.from(new Set(data.flatMap((row) => Object.keys(row)))),
    [data]
  )

  const userId = useSelector((state: any) => state.user.userId)
  const { user } = useUser()

  const [mapping, setMapping] = React.useState<Record<FieldKey, string>>(
    {} as Record<FieldKey, string>
  )
  const [error, setError] = React.useState<string | null>(null)

  // L'état de l'import vit dans le contexte, pas ici : il doit survivre à un
  // changement de page et à un rechargement.
  const { job, starting, startImport } = useImportJob()
  const importing = starting || job?.status === "running"
  const result = job?.status === "done" ? job.result : null

  const columns = React.useMemo(
    () => buildColumns(fileHeaders, mapping, setMapping),
    [mapping, fileHeaders]
  )

  // Ne garde que les champs réellement associés à une colonne du fichier
  const cleanMapping = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(mapping).filter(([, header]) => header)
      ) as Record<FieldKey, string>,
    [mapping]
  )
  // Champs obligatoires (nom, prénom, email, société) encore non mappés
  const missingRequired = React.useMemo(
    () => REQUIRED_FIELDS.filter((f) => !cleanMapping[f.key]),
    [cleanMapping]
  )
  const allRequiredMapped = missingRequired.length === 0

  const handleImport = async () => {
    if (!allRequiredMapped) {
      setError(
        `Champs obligatoires à associer : ${missingRequired
          .map((f) => f.label)
          .join(", ")}.`
      )
      return
    }
    setError(null)
    try {
      // Le serveur lance le traitement en tâche de fond et rend la main tout de
      // suite : on ne suit plus qu'un job_id. Le token Clerk est ajouté
      // automatiquement par <ApiAuth /> (patch global de fetch).
      await startImport({
        mapping: cleanMapping,
        rows: data,
        userid: userId ?? "",
        username: String(user?.firstName || ""),
        filename: filename || "import-mappe",
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Télécharge le fichier Excel du lot qui vient d'être importé et nettoyé
  const telechargerExport = async (nomFichier: string) => {
    const params = new URLSearchParams({
      filename: nomFichier,
      userid: String(userId ?? ""),
    })
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/export-leads/download-xlsx?${params}`
    )
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      throw new Error(payload?.detail || `Erreur serveur : ${res.status}`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${nomFichier.replace(/\.[^.]+$/, "")}-nettoye.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    // Même gabarit que Staging / Leads / Clean : dégradé indigo + en-tête sticky
    <div className="app-page h-full flex flex-col">
      {/* Header */}
      <div className="app-header pr-3 pl-14 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-start sm:items-center flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <h2 className="app-title text-sm sm:text-base truncate">
              Associer les colonnes
            </h2>
            <span
              className="app-badge"
              style={{ color: "#b45309", background: "rgba(180,83,9,0.08)", borderColor: "rgba(180,83,9,0.25)" }}
            >
              Import
            </span>
            <span className="app-count hidden sm:inline">
              {data.length} entrées
            </span>
            {sheetLabel && (
              <span
                className="app-badge font-medium"
                style={{ color: "#7c3aed", background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.25)" }}
              >
                {sheetLabel}
              </span>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              onClick={handleImport}
              disabled={importing || !allRequiredMapped}
              className="app-btn app-btn-primary"
            >
              {importing ? "Import en cours…" : "Importer & nettoyer"}
            </Button>
          </div>
        </div>
        <p className="app-subtitle mt-1.5">
          Choisissez, pour chaque champ, la colonne correspondante de votre fichier.
          Le mapping et le nettoyage sont appliqués côté serveur.
        </p>
      </div>

      <div className="px-2 sm:px-3 pb-4 pt-2 overflow-y-auto flex-1 overflow-x-hidden">
        <DataTable columns={columns} data={data} />

        {error && (
          <p className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </p>
        )}

        {/* Import en cours : étape et pourcentage, mis à jour par le contexte.
            L'utilisateur peut quitter la page, la carte de la sidebar prend le relais. */}
        {job?.status === "running" && (
          <div className="app-card mt-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-[color:var(--app-text)]">
                <Loader2 size={15} className="animate-spin text-[color:var(--app-accent)]" />
                Import en cours
              </p>
              <span className="text-sm font-semibold tabular-nums text-[color:var(--app-text-secondary)]">
                {job.percent}%
              </span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--app-surface-hover)]">
              <div
                className="h-full rounded-full bg-[var(--app-accent)] transition-all duration-500"
                style={{ width: `${job.percent}%` }}
              />
            </div>
            <p className="app-subtitle mt-2">
              {job.label}
              {job.steps_total ? ` · étape ${(job.step ?? 0) + 1}/${job.steps_total}` : ""}
            </p>
            <p className="app-subtitle mt-0.5">
              Tu peux quitter cette page : la progression reste visible dans le menu de gauche.
            </p>
          </div>
        )}

        {job?.status === "error" && (
          <p className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            <AlertCircle size={15} className="flex-shrink-0" />
            {job.error || "L'import a échoué."}
          </p>
        )}

        {result && (
          <div className="app-card mt-3 border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={15} className="flex-shrink-0" />
              {result.duplicate_file_processed
                ? result.message || "Fichier déjà traité."
                : "Import & nettoyage terminés."}
            </p>
            {!result.duplicate_file_processed && (
              <ul className="mt-1.5 space-y-1 text-[13px] text-emerald-700">
                <li>{Number(result.inserted_rows || 0)} ligne(s) importée(s)</li>
                <li>{Number(result.moved_to_steaging_applique || 0)} déplacée(s) vers Staging</li>
                <li>{Number(result.moved_to_clean || 0)} envoyée(s) vers Clean (incomplètes)</li>
                <li>
                  {/* Incomplete et Complete sont la même table `optimized`,
                      distinguée par la complétion : un seul compteur suffit. */}
                  {Number(result.staging_vs_incomplete || 0) +
                    Number(result.staging_vs_complete || 0)}{" "}
                  doublon(s) vs Optimized
                </li>
                <li>{Number(result.blacklisted_removed || 0)} blacklisté(s) retiré(s)</li>
                <li>{Number(result.emails_completed || 0)} email(s) complété(s)</li>
                <li className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <FileSpreadsheet size={13} />
                  {Number(result.exported_rows || 0)} ligne(s) dans le fichier Excel
                </li>
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {!result.duplicate_file_processed && Number(result.exported_rows || 0) > 0 && (
                <Button
                  onClick={() =>
                    telechargerExport(filename || "import-mappe").catch((e) =>
                      setError(`Téléchargement impossible : ${e.message}`)
                    )
                  }
                  className="app-btn app-btn-info"
                >
                  <Download size={13} />
                  Retélécharger l'Excel
                </Button>
              )}
              {hasNextSheet && (
                <Button
                  onClick={onNextSheet}
                  className="app-btn app-btn-success"
                >
                  Feuille suivante
                  <ArrowRight size={13} />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {data.length} ligne(s) · {Object.keys(cleanMapping).length} champ(s) associé(s)
            {!allRequiredMapped && (
              <span className="ml-2 text-rose-400">
                · Obligatoires manquants : {missingRequired.map((f) => f.label).join(", ")}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
