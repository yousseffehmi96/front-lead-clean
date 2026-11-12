/**
 * Palette d'accents partagée — thème clair.
 *
 * Les pastels du thème sombre (indigo-300, emerald-300…) sont illisibles sur fond
 * blanc : on utilise ici leurs équivalents -600/-700 pour le texte, avec un fond
 * teinté léger et une bordure un peu plus marquée qu'en sombre.
 *
 * Centralisé parce que `CARD_COLORS` (dashboard) et `badgeConfig` (les 6 pages
 * leads) étaient dupliqués à l'identique dans chaque fichier.
 */

export type Accent = { color: string; bg: string; border: string }

/** L'ordre des teintes est celui d'origine : les pages indexent ce tableau. */
export const CARD_COLORS: Accent[] = [
  { color: "#4f46e5", bg: "rgba(79,70,229,0.08)", border: "rgba(79,70,229,0.25)" },   // 0 indigo
  { color: "#e11d48", bg: "rgba(225,29,72,0.08)", border: "rgba(225,29,72,0.25)" },   // 1 rose
  { color: "#059669", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.25)" },   // 2 emerald
  { color: "#d97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.25)" },   // 3 amber
  { color: "#b45309", bg: "rgba(180,83,9,0.08)", border: "rgba(180,83,9,0.25)" },     // 4 amber foncé
  { color: "#475569", bg: "rgba(71,85,105,0.08)", border: "rgba(71,85,105,0.25)" },   // 5 slate
  { color: "#db2777", bg: "rgba(219,39,119,0.08)", border: "rgba(219,39,119,0.25)" }, // 6 pink
  { color: "#0891b2", bg: "rgba(8,145,178,0.08)", border: "rgba(8,145,178,0.25)" },   // 7 cyan
  { color: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.25)" }, // 8 violet
  { color: "#dc2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.25)" },   // 9 red
]

export type LeadBadge = { label: string; color: string; bg: string }

/** Badge d'étape du pipeline, affiché dans les listes de leads. */
export const LEAD_BADGES: Record<string, LeadBadge> = {
  import: { label: "RAW", color: "#b45309", bg: "rgba(180,83,9,0.08)" },
  complete: { label: "COMPLETE", color: "#b45309", bg: "rgba(180,83,9,0.08)" },
  incomplete: { label: "INCOMPLETE", color: "#475569", bg: "rgba(71,85,105,0.08)" },
  clean: { label: "CLEAN", color: "#059669", bg: "rgba(5,150,105,0.08)" },
  staging: { label: "APPLIQUE", color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  black: { label: "BLACK", color: "#e11d48", bg: "rgba(225,29,72,0.08)" },
}

/** Badge de l'étape, avec repli indigo sur une valeur inconnue. */
export function getLeadBadge(step: unknown): LeadBadge {
  return (
    LEAD_BADGES[step as string] ?? {
      label: String(step ?? ""),
      color: "#4f46e5",
      bg: "rgba(79,70,229,0.08)",
    }
  )
}
