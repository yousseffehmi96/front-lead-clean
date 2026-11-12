"use client"

import {
  Award,
  CheckCircle2,
  Hash,
  Mail,
  Medal,
  Puzzle,
  Recycle,
  Sparkles,
  Trash2,
  TriangleAlert,
  User,
} from "lucide-react"

/**
 * Récapitulatif d'un traitement de leads (déduplication puis nettoyage).
 *
 * Ce bloc était dupliqué à l'identique dans LeadList, Clean, Optimized et
 * Staging. Il est extrait ici en une seule version, avec des icônes vectorielles
 * à la place des émoticônes.
 */

type Props = {
  cleanResult: any
  /** Lignes du dernier import, pour signaler un fichier entièrement dédoublonné. */
  uploadedRows?: number
}

const tileClass =
  "px-2 sm:px-3 py-2 rounded-lg text-center border bg-white/70"

export default function ResultSummary({ cleanResult, uploadedRows = 0 }: Props) {
  if (!cleanResult) return null

  const deduped = cleanResult.total_deleted !== undefined
  const cleaned = cleanResult.moved_to_complete !== undefined
  if (!deduped && !cleaned) return null

  const dedupTiles = [
    { label: "Total", val: cleanResult.total_deleted, Icon: Hash },
    { label: "Doublons en Complete", val: cleanResult.staging_vs_complete, Icon: Medal },
    { label: "Doublons en Incomplete", val: cleanResult.staging_vs_incomplete, Icon: Award },
    { label: "Doublons interne", val: cleanResult.staging_internal, Icon: Recycle },
    { label: "Doublons Staging", val: cleanResult.staging_vs_applique, Icon: Puzzle },
  ]

  const cleanTiles = [
    { label: "Complete", val: cleanResult.moved_to_complete, Icon: Medal },
    { label: "Incomplete", val: cleanResult.moved_to_incomplete, Icon: Award },
    { label: "Clean", val: cleanResult.moved_to_clean, Icon: Sparkles },
    { label: "Staging", val: cleanResult.moved_to_steaging_applique, Icon: Puzzle },
    { label: "Emails complétés", val: cleanResult.emails_completed, Icon: Mail },
    { label: "Noms complétés", val: cleanResult.nom_prenom_completed, Icon: User },
  ]

  const allDuplicates =
    uploadedRows > 0 && Number(cleanResult.total_deleted || 0) === uploadedRows

  return (
    <>
      {deduped && (
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-rose-700">
          <p className="mb-2 flex items-center gap-1.5 font-semibold">
            <Trash2 size={14} />
            Suppression des doublons terminée
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {dedupTiles.map(({ label, val, Icon }) => (
              <div key={label} className={`${tileClass} border-rose-200`}>
                <p className="flex items-center justify-center gap-1 text-[11px] text-rose-600/80">
                  <Icon size={11} />
                  {label}
                </p>
                <p className="text-sm font-bold sm:text-base">{val ?? 0}</p>
              </div>
            ))}
          </div>
          {allDuplicates && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold sm:text-sm">
              <TriangleAlert size={14} />
              Tu as déjà traité ce fichier : tous les leads importés ont été supprimés comme doublons.
            </p>
          )}
        </div>
      )}

      {cleaned && (
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-emerald-800">
          <p className="mb-2 flex items-center gap-1.5 font-semibold">
            <CheckCircle2 size={14} />
            Nettoyage terminé
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {cleanTiles.map(({ label, val, Icon }) => (
              <div key={label} className={`${tileClass} border-emerald-200`}>
                <p className="flex items-center justify-center gap-1 text-[11px] text-emerald-700/80">
                  <Icon size={11} />
                  {label}
                </p>
                <p className="text-sm font-bold sm:text-base">{val ?? 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
