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
          background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Close */}
        <button
          onClick={() => deletes(false)}
          className="absolute top-4 right-4 p-1 rounded-lg"
          style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)" }}
        >
          <X size={14} />
        </button>

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)" }}
        >
          <AlertTriangle size={22} style={{ color: "#f43f5e" }} />
        </div>

        <h2 className="text-white font-semibold text-base mb-2">
          Confirmer la suppression
        </h2>

        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
          Êtes-vous sûr de vouloir supprimer cette société ? Cette action est irréversible.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => deletes(false)}
            className="flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
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
              color: "#fda4af",
            }}
          >
            <Trash2 size={13} />
            Supprimer
          </button>
        </div>

        {sucee && (
          <div
            className="mt-4 p-3 rounded-lg text-xs text-center font-medium"
            style={{ background: "rgba(110,231,183,0.1)", border: "1px solid rgba(110,231,183,0.2)", color: "#6ee7b7" }}
          >
            ✅ {sucee}
          </div>
        )}

        {err && (
          <div
            className="mt-4 p-3 rounded-lg text-xs text-center font-medium"
            style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#fda4af" }}
          >
            ❌ {err}
          </div>
        )}
      </div>
    </div>
  )
}