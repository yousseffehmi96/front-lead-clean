"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { useSelector } from "react-redux"
import { DataTable } from "./data-table"
import { buildColumns, REQUIRED_FIELDS, type RawRow, type FieldKey } from "./columns"
import { Button } from "@/components/ui/button"


interface LeadsPageProps {
  data: RawRow[]
  filename?: string
}

export default function LeadsPage({ data, filename }: LeadsPageProps) {
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
  const [importing, setImporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<any>(null)

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
    setImporting(true)
    setError(null)
    setResult(null)
    try {
      // Le token Clerk est injecté automatiquement par <ApiAuth /> (patch global de fetch)
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      }
      const finalName = filename || "import-mappe"

      // 1) Mapping + insertion dans import_leads (staging brut)
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-mapped`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          mapping: cleanMapping,
          rows: data,
          userid: userId ?? "",
          username: String(user?.firstName || ""),
          filename: finalName,
        }),
      })
      const uploadPayload = await uploadRes.json().catch(() => null)
      if (!uploadRes.ok) {
        throw new Error(uploadPayload?.detail || `Erreur serveur : ${uploadRes.status}`)
      }

      // Fichier déjà traité : rien inséré, inutile de lancer le dispatch
      if (uploadPayload?.duplicate_file_processed) {
        setResult(uploadPayload)
        return
      }

      // 2) Nettoyage + déduplication (vs silver/gold/applique) puis déplacement vers staging_leads
      const dispatchRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staging-dispatch/import_leads`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            filename: finalName,
            userid: userId ?? "",
            inserted_rows: Number(uploadPayload?.inserted_rows || 0),
          }),
        }
      )
      const dispatchPayload = await dispatchRes.json().catch(() => null)
      if (!dispatchRes.ok) {
        throw new Error(dispatchPayload?.detail || `Erreur nettoyage : ${dispatchRes.status}`)
      }

      setResult({ ...uploadPayload, ...dispatchPayload })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    // Même gabarit que Staging / Leads / Clean : dégradé indigo + en-tête sticky
    <div
      className="h-full rounded-none flex flex-col"
      style={{
        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 pr-3 pl-14 sm:px-6 py-3 sm:py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "inherit" }}
      >
        <div className="flex justify-between items-start sm:items-center flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm sm:text-base truncate">
              Associer les colonnes
            </h2>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
              style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}
            >
              Import
            </span>
            <span className="text-xs hidden sm:inline" style={{ color: "rgba(255,255,255,0.3)" }}>
              {data.length} entrées
            </span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              onClick={handleImport}
              disabled={importing || !allRequiredMapped}
              className="bg-teal-500 text-slate-950 hover:bg-teal-400 disabled:opacity-40"
            >
              {importing ? "Import en cours…" : "Importer & nettoyer"}
            </Button>
          </div>
        </div>
        <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Choisissez, pour chaque champ, la colonne correspondante de votre fichier.
          Le mapping et le nettoyage sont appliqués côté serveur.
        </p>
      </div>

      <div className="px-2 sm:px-3 pb-4 pt-2 overflow-y-auto flex-1 overflow-x-hidden">
        <DataTable columns={columns} data={data} />

        {error && (
          <p className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-[15px] text-rose-300">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-base text-emerald-300">
            <p className="font-semibold">
              {result.duplicate_file_processed
                ? result.message || "Fichier déjà traité."
                : "Import & nettoyage terminés."}
            </p>
            {!result.duplicate_file_processed && (
              <ul className="mt-1.5 space-y-1 text-sm text-emerald-200/90">
                <li>{Number(result.inserted_rows || 0)} ligne(s) importée(s)</li>
                <li>{Number(result.moved_to_steaging_applique || 0)} déplacée(s) vers Staging</li>
                <li>{Number(result.moved_to_clean || 0)} envoyée(s) vers Clean (incomplètes)</li>
                <li>
                  {Number(result.staging_vs_silver || 0)} doublon(s) vs Silver ·{" "}
                  {Number(result.staging_vs_gold || 0)} vs Gold
                </li>
                <li>{Number(result.blacklisted_removed || 0)} blacklisté(s) retiré(s)</li>
                <li>{Number(result.emails_completed || 0)} email(s) complété(s)</li>
              </ul>
            )}
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
