"use client"

import Link from "next/link"
import { X } from "lucide-react"
import { useImportJob } from "./ImportJobProvider"

/**
 * Carte de progression de l'import, affichée dans la sidebar.
 *
 * Visible depuis n'importe quelle page : c'est ce qui permet de lancer un
 * import, aller travailler ailleurs, et voir où il en est.
 * Ne rend rien quand aucun import n'est en cours ni récemment terminé.
 */
export default function ImportProgress() {
  const { job, dismiss } = useImportJob()

  if (!job || job.status === "unknown" || job.status === "none") return null

  const running = job.status === "running"
  const failed = job.status === "error"
  const percent = Math.max(0, Math.min(100, running ? job.percent : failed ? job.percent : 100))

  return (
    <div className="px-3 pb-2">
      <div className="app-card p-3">
        <div className="flex items-start justify-between gap-2">
          {/* L'état se lit sur la couleur de la barre et le libellé : pas d'icône. */}
          <p className="app-eyebrow">
            {running ? "Import en cours" : failed ? "Import échoué" : "Import terminé"}
          </p>
          {!running && (
            <button
              onClick={dismiss}
              aria-label="Masquer"
              className="rounded p-0.5 text-[color:var(--app-text-faint)] transition-colors hover:bg-[var(--app-surface-hover)] hover:text-[color:var(--app-text)]"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <p
          className="mt-1 truncate text-[12px] font-medium text-[color:var(--app-text)]"
          title={job.filename || undefined}
        >
          {job.filename || "Fichier"}
        </p>

        {/* Barre de progression */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-surface-hover)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              failed ? "bg-rose-500" : running ? "bg-[var(--app-accent)]" : "bg-emerald-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] text-[color:var(--app-text-muted)]">
            {failed ? job.error || "Échec" : job.label || (running ? "En cours" : "Terminé")}
          </span>
          <span className="text-[10px] font-semibold tabular-nums text-[color:var(--app-text-secondary)]">
            {percent}%
          </span>
        </div>

        <Link
          href="/lead/import"
          className="mt-2 block text-[10px] font-semibold text-[color:var(--app-accent)] hover:underline"
        >
          Voir le détail
        </Link>
      </div>
    </div>
  )
}
