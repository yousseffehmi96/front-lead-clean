"use client"
import { useState, useEffect } from "react"
import { openApi } from "@/lib/api"
import { Plus, Trash2, X, AlertTriangle, Clipboard } from "lucide-react"
import { deleteUser, getAllUsers } from "@/api/user-actions" 
import SignUpForm from "@/componets/SignUpForm"
import { useUser } from "@clerk/nextjs"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("users")
  const { user, isLoaded } = useUser()
  const userRole = ((user?.publicMetadata?.role as string) || "agent").toLowerCase()
  const isManager = userRole === "manager"

  // ---------------- STATE USERS ----------------
  const [users, setUsers] = useState<any[]>([]) 
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)


  // ---------------- STATE TOKENS ----------------
const [tokens, setTokens] = useState<any[]>([])
const [loadingTokens, setLoadingTokens] = useState(false)
const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false)
const [newTokenName, setNewTokenName] = useState("")
const [token, setToken] = useState<string>("")
const [tokenToDelete, setTokenToDelete] = useState<string | null>(null)

  // ---------------- FETCH DATA ----------------
  const fetchUsers = async () => {
    setLoadingUsers(true)
    const result = await getAllUsers()
    if (result.success) {
      setUsers(result.users || [])
    }
    setLoadingUsers(false)
  }

  useEffect(() => {
  if (activeTab === "users") fetchUsers()
  if (activeTab === "tokens") fetchTokens()
}, [activeTab])

  const tabs = [
    { id: "users", label: "Utilisateurs" },
    { id: "tokens", label: "Tokens" },
    ...(isManager ? [{ id: "export", label: "Export base" }] : []),
  ]


  //Token


 const fetchTokens = async () => {
  setLoadingTokens(true)
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token`)
    const data = await res.json()

    // 🔥 FIX IMPORTANT
    setTokens(data.tokens || data.data || data || [])
    
  } catch (err) {
    console.error("Erreur tokens:", err)
    setTokens([]) // sécurité
  }
  setLoadingTokens(false)
} 
  const createToken = async () => {
  if (!newTokenName.trim()) return
 if (!token.trim()) return
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTokenName,token:token })
    })

    if (res.ok) {
      await fetchTokens()
      setIsAddTokenModalOpen(false)
      setNewTokenName("")
      setToken("")
    }
  } catch (err) {
    console.error(err)
  }
}

const deleteToken = async (id: string) => {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/${id}`, {
      method: "DELETE"
    })
    await fetchTokens()
  } catch (err) {
    console.error(err)
  }
  setTokenToDelete(null)
}

const copyToken = (token: string) => {
  navigator.clipboard.writeText(token)
}

  return (
    <div className="min-h-screen p-4 pl-14 md:p-8" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)" }}>

      {/* MENU TABS */}
      <div className="flex gap-3 mb-8 border-b border-white/10 pb-3 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-lg transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-white/50 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- CONTENT : EXPORT BASE (MANAGER) --- */}
      {activeTab === "export" && isManager && (
        <div className="animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Export base</h2>
              <p className="text-sm text-white/40 mt-1">Télécharger toute la base (ZIP de CSV)</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 max-w-3xl">
            <button
              onClick={() => openApi(`${process.env.NEXT_PUBLIC_API_URL}/export/database-zip?is_manager=true`)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25 transition text-sm font-semibold"
            >
              Exporter toute la base (.zip)
            </button>
            <p className="mt-3 text-xs text-white/40">
              Le fichier contient un CSV par table (séparateur ;).
            </p>
          </div>
        </div>
      )}

      {/* --- CONTENT : USERS --- */}
      {activeTab === "users" && (
        <div className="animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Gestion des utilisateurs</h2>
              <p className="text-sm text-white/40 mt-1">Liste des agents et managers accédant à la plateforme</p>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/20"
              style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "white" }}
            >
              <Plus size={16} />
              Ajouter un agent
            </button>
          </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-indigo-950/60 backdrop-blur-xl overflow-x-auto shadow-xl">

  <table className="min-w-[600px] w-full text-xs md:text-sm">

    {/* HEADER */}
    <thead className="bg-white/5 backdrop-blur-md">
      <tr className="text-white/50 uppercase text-[10px] tracking-wider">
        <th className="px-3 md:px-6 py-3 text-left">Utilisateur</th>
        <th className="px-3 md:px-6 py-3 text-center">Rôle</th>
        <th className="px-3 md:px-6 py-3 text-center">Dernière connexion</th>
        <th className="px-3 md:px-6 py-3 text-right">Actions</th>
      </tr>
    </thead>

    {/* BODY */}
    <tbody className="divide-y divide-white/5">

      {loadingUsers ? (
        <tr>
          <td colSpan={4} className="text-center py-8 text-white/30">
            Chargement...
          </td>
        </tr>
      ) : users.map((u, idx) => (

        <tr
          key={u.id}
          className={`transition-all duration-200 group ${
            idx % 2 === 0 ? "bg-white/[0.01]" : "bg-transparent"
          } hover:bg-indigo-500/10`}
        >

          {/* USER */}
          <td className="px-3 md:px-6 py-4">
            <div className="flex items-center gap-3">

              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500/30 to-indigo-400/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-xs font-bold text-indigo-300 shadow">
                {u.firstName?.[0]}
              </div>

              <div>
                <p className="text-white text-xs md:text-sm font-medium">
                  {u.firstName}
                </p>
                <p className="text-[10px] text-white/40">
                  {u.email}
                </p>
              </div>

            </div>
          </td>

          {/* ROLE */}
          <td className="px-3 md:px-6 py-4 text-center">
            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${
              u.role === "manager"
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {u.role}
            </span>
          </td>

          {/* DATE */}
          <td className="px-3 md:px-6 py-4 text-center text-white/40 text-xs">
            {u.lastSignInAt
              ? new Date(u.lastSignInAt).toLocaleDateString()
              : "—"}
          </td>

          {/* ACTION */}
          <td className="px-3 md:px-6 py-4 text-right">
            <button
              onClick={() => setUserToDelete(u.id)}
              className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </td>

        </tr>
      ))}

    </tbody>
  </table>
</div>

          {/* MODAL AJOUT UTILISATEUR */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20} /></button>
                <SignUpForm onSuccess={() => { setIsModalOpen(false); fetchUsers(); }} />
              </div>
            </div>
          )}

          {/* MODAL CONFIRM DELETE USER */}
          {userToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="text-red-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Confirmer la suppression</h3>
                    <p className="text-white/50 text-sm">Cette action est irréversible</p>
                  </div>
                </div>
                
                <p className="text-white/70 text-sm mb-6">
                  Êtes-vous sûr de vouloir supprimer cet utilisateur ? Toutes ses données seront perdues définitivement.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-all text-sm font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      if (!userToDelete) return
                      setLoadingDelete(true)
                      const result = await deleteUser(userToDelete)
                      if (result.success) {
                        setUsers(users.filter(u => u.id !== userToDelete))
                      } else {
                        console.error(result.error)
                      }
                      setLoadingDelete(false)
                      setUserToDelete(null)
                    }}
                    disabled={loadingDelete}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-white font-semibold transition-all text-sm shadow-lg shadow-red-500/30 ${
                      loadingDelete
                        ? "bg-red-400/50 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {loadingDelete ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- CONTENT : TOKENS --- */}
     {/* --- CONTENT : TOKENS --- */}
{activeTab === "tokens" && (
  <div className="animate-in fade-in duration-500">

    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Tokens API</h2>
        <p className="text-sm text-white/40">Gérez vos clés API</p>
      </div>

      <button
        onClick={() => setIsAddTokenModalOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition"
      >
        <Plus size={16} /> Nouveau token
      </button>
    </div>

    <div className="space-y-4">
      {loadingTokens ? (
        <p className="text-white/30">Chargement...</p>
      ) : tokens.length === 0 ? (
        <p className="text-white/30">Aucun token</p>
      ) : (
        tokens.map((t) => (
          <div key={t.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
            
            <div>
              <p className="text-white font-medium">{t.name}</p>
              <p className="text-xs text-white/40">
                Créé le {new Date(t.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-indigo-300 mt-1 font-mono">
                {t.token.slice(0, 8)}••••••••
              </p>
            </div>

            <div className="flex gap-2">
              <button
  onClick={() => copyToken(t.token)}
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-md hover:shadow-lg"
>
  <Clipboard size={16} />
  Copier
</button>

              <button
                onClick={() => setTokenToDelete(t.id)}
                className="px-3 py-1 rounded bg-red-500/20 text-red-300 text-xs"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))
      )}
    </div>

    {/* MODAL CREATE TOKEN */}
    {isAddTokenModalOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60">
        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-sm">
          <h3 className="text-white mb-4">Créer un token</h3>

          <input
            type="text"
            placeholder="Nom du token"
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            className="w-full p-2 rounded bg-white/5 border border-white/10 text-white mb-4"
          />
          <input
            type="text"
            placeholder="Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 rounded bg-white/5 border border-white/10 text-white mb-4"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setIsAddTokenModalOpen(false)}
              className="flex-1 border border-white/10 text-white/70 py-2 rounded"
            >
              Annuler
            </button>

            <button
              onClick={createToken}
              className="flex-1 bg-indigo-500 text-white py-2 rounded"
            >
              Créer
            </button>
          </div>
        </div>
      </div>
    )}

    {/* DELETE MODAL */}
    {tokenToDelete && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60">
        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-sm">
          <p className="text-white mb-4">Supprimer ce token ?</p>

          <div className="flex gap-2">
            <button
              onClick={() => setTokenToDelete(null)}
              className="flex-1 border border-white/10 text-white py-2 rounded"
            >
              Annuler
            </button>

            <button
              onClick={() => deleteToken(tokenToDelete)}
              className="flex-1 bg-red-500 text-white py-2 rounded"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
)}
    </div>
  )
}
