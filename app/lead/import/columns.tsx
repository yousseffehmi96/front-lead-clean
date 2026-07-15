"use client"

import { ColumnDef } from "@tanstack/react-table"

export type RawRow = Record<string, string>

export type FieldKey =
  | "prenom"
  | "nom"
  | "email"
  | "societe"
  | "fonction"
  | "telephone"
  | "localisation"
  | "linkedin"

const FIELDS: { key: FieldKey; label: string; required?: boolean }[] = [
  { key: "prenom", label: "Prénom", required: true },
  { key: "nom", label: "Nom", required: true },
  { key: "email", label: "Email", required: true },
  { key: "societe", label: "Société" },
  { key: "fonction", label: "Fonction" },
  { key: "telephone", label: "Téléphone" },
  { key: "localisation", label: "Localisation" },
  { key: "linkedin", label: "LinkedIn" },
]

// Champs dont le mapping est obligatoire avant l'import
export const REQUIRED_FIELDS = FIELDS.filter((f) => f.required) as {
  key: FieldKey
  label: string
}[]

export function buildColumns(
  fileHeaders: string[],
  mapping: Record<FieldKey, string>,
  setMapping: (m: Record<FieldKey, string>) => void
): ColumnDef<RawRow>[] {
  return FIELDS.map(({ key, label, required }) => ({
    id: key,
    header: () => {
      const isMapped = Boolean(mapping[key])
      const missingRequired = Boolean(required) && !isMapped
      return (
        <div className="min-w-[150px] py-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isMapped
                  ? "bg-teal-400"
                  : missingRequired
                  ? "bg-rose-400"
                  : "bg-slate-600"
              }`}
            />
            <span className="text-[13px] font-semibold uppercase tracking-wider text-slate-300">
              {label}
              {required && (
                <span
                  className={missingRequired ? "ml-0.5 text-rose-400" : "ml-0.5 text-teal-400"}
                  title="Champ obligatoire"
                >
                  *
                </span>
              )}
            </span>
          </div>
          <select
            value={mapping[key] ?? ""}
            onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
            className={`mt-1.5 w-full rounded-md border px-2 py-2 text-sm font-normal outline-none transition-colors ${
              isMapped
                ? "border-teal-400/40 bg-teal-400/10 text-teal-200 focus:border-teal-400/70"
                : missingRequired
                ? "border-rose-400/40 bg-rose-400/10 text-rose-200 focus:border-rose-400/70"
                : "border-white/10 bg-white/5 text-slate-400 focus:border-teal-400/50"
            }`}
          >
            <option value="" className="bg-slate-900 text-slate-400">— Ignorer —</option>
            {fileHeaders.map((h) => (
              <option key={h} value={h} className="bg-slate-900 text-slate-200">{h}</option>
            ))}
          </select>
        </div>
      )
    },
    cell: ({ row }) => {
      const sourceCol = mapping[key]
      const value = sourceCol ? row.original[sourceCol] : undefined
      if (!value) {
        return <span className="text-slate-600">—</span>
      }
      return (
        <span
          title={value}
          className={key === "email" ? "text-slate-100" : "text-slate-200"}
        >
          {value}
        </span>
      )
    },
  }))
}