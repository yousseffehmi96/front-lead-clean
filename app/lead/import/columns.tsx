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
  | "location"
  | "linkedin"

const FIELDS: { key: FieldKey; label: string; required?: boolean }[] = [
  { key: "prenom", label: "Prénom", required: true },
  { key: "nom", label: "Nom", required: true },
  { key: "email", label: "Email", required: true },
  { key: "societe", label: "Société" },
  { key: "fonction", label: "Fonction" },
  { key: "telephone", label: "Téléphone" },
  { key: "location", label: "Localisation" },
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
        <div className="min-w-[120px] py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isMapped
                  ? "bg-emerald-500"
                  : missingRequired
                  ? "bg-rose-400"
                  : "bg-slate-300"
              }`}
            />
            <span className="text-[13px] font-semibold uppercase tracking-wider text-slate-600">
              {label}
              {required && (
                <span
                  className={missingRequired ? "ml-0.5 text-rose-600" : "ml-0.5 text-emerald-600"}
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
            className={`mt-1 w-full rounded-md border px-2 py-1.5 text-sm font-normal outline-none transition-colors ${
              isMapped
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 focus:border-emerald-500"
                : missingRequired
                ? "border-rose-400/40 bg-rose-400/10 text-rose-200 focus:border-rose-400/70"
                : "border-[color:var(--app-border)] bg-white text-slate-500 focus:border-[color:var(--app-accent)]"
            }`}
          >
            <option value="" className="bg-white text-slate-500">— Ignorer —</option>
            {fileHeaders.map((h) => (
              <option key={h} value={h} className="bg-white text-slate-700">{h}</option>
            ))}
          </select>
        </div>
      )
    },
    cell: ({ row }) => {
      const sourceCol = mapping[key]
      const value = sourceCol ? row.original[sourceCol] : undefined
      if (!value) {
        return <span className="text-slate-400">—</span>
      }
      return (
        <span
          title={value}
          className={key === "email" ? "text-slate-900" : "text-slate-700"}
        >
          {value}
        </span>
      )
    },
  }))
}