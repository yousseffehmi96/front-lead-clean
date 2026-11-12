import { useState } from "react"
import { Trash2, X, AlertTriangle } from "lucide-react"

type DeleteProps = {
  deletes: React.Dispatch<React.SetStateAction<boolean>>
  setRefresh: React.Dispatch<React.SetStateAction<number>>
  id: number
}

export default function Delete({ deletes, setRefresh, id }: DeleteProps) {
  const [sucee, setsucee] = useState<any>(null)
  const [err, seterror] = useState<any>(null)

  const handledelete = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/societe/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      seterror((await res.json()).detail)
      return
    }

    seterror(null)
    setRefresh((prev) => prev + 1)
    setsucee((await res.json()).message)
    setTimeout(() => deletes(false), 2000)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{
          background: "var(--app-bg)",
          border: "1px solid var(--app-border)",
          boxShadow: "0 20px 40px rgba(15,23,42,0.15)",
        }}
      >
        {/* Close */}
        <button
          onClick={() => deletes(false)}
          className="absolute top-4 right-4 p-1 rounded-lg"
          style={{ color: "var(--app-text-faint)", background: "var(--app-surface-hover)" }}
        >
          <X size={14} />
        </button>

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)" }}
        >
          <AlertTriangle size={22} style={{ color: "#e11d48" }} />
        </div>

        <h2 className="text-[color:var(--app-text)] font-semibold text-base mb-2">
          Confirmer la suppression
        </h2>

        <p className="text-sm mb-6" style={{ color: "var(--app-text-muted)" }}>
          Êtes-vous sûr de vouloir supprimer cette société ? Cette action est irréversible.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => deletes(false)}
            className="flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all"
            style={{
              background: "var(--app-surface-hover)",
              border: "1px solid var(--app-border)",
              color: "var(--app-text-muted)",
            }}
          >
            Annuler
          </button>

          <button
            onClick={handledelete}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg transition-all"
            style={{
              background: "rgba(244,63,94,0.15)",
              border: "1px solid rgba(244,63,94,0.3)",
              color: "#e11d48",
            }}
          >
            <Trash2 size={13} />
            Supprimer
          </button>
        </div>

        {sucee && (
          <div
            className="mt-4 p-3 rounded-lg text-xs text-center font-medium"
            style={{ background: "rgba(110,231,183,0.1)", border: "1px solid rgba(110,231,183,0.2)", color: "#059669" }}
          >
            {sucee}
          </div>
        )}

        {err && (
          <div
            className="mt-4 p-3 rounded-lg text-xs text-center font-medium"
            style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#e11d48" }}
          >
            {err}
          </div>
        )}
      </div>
    </div>
  )
}
