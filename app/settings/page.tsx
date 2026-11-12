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

    // FIX IMPORTANT
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
    <div className="app-page min-h-screen p-4 pl-14 md:p-8">

      {/* MENU TABS */}
      <div className="flex gap-3 mb-8 border-b border-[color:var(--app-border)] pb-3 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`app-btn ${
              activeTab === tab.id ? "app-btn-soft" : "app-btn-ghost"
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
              <h2 className="app-title text-[22px]">Export base</h2>
              <p className="app-subtitle mt-1 text-[13px]">Télécharger toute la base (ZIP de CSV)</p>
            </div>
          </div>

          <div className="app-card p-6 max-w-3xl">
            <button
              onClick={() => openApi(`${process.env.NEXT_PUBLIC_API_URL}/export/database-zip?is_manager=true`)}
              className="app-btn app-btn-lg app-btn-success"
            >
              Exporter toute la base (.zip)
            </button>
            <p className="mt-3 text-xs text-[color:var(--app-text-muted)]">
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
              <h2 className="app-title text-[22px]">Gestion des utilisateurs</h2>
              <p className="app-subtitle mt-1 text-[13px]">Liste des agents et managers accédant à la plateforme</p>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="app-btn app-btn-lg app-btn-primary"
            >
              <Plus size={16} />
              Ajouter un agent
            </button>
          </div>

        <div className="app-card overflow-x-auto">

  <table className="min-w-[600px] w-full text-xs md:text-sm">

    {/* HEADER */}
    <thead className="bg-[var(--app-bg-subtle)] backdrop-blur-md">
      <tr className="text-[color:var(--app-text-muted)] uppercase text-[10px] tracking-wider">
        <th className="px-3 md:px-6 py-3 text-left">Utilisateur</th>
        <th className="px-3 md:px-6 py-3 text-center">Rôle</th>
        <th className="px-3 md:px-6 py-3 text-center">Dernière connexion</th>
        <th className="px-3 md:px-6 py-3 text-right">Actions</th>
      </tr>
    </thead>

    {/* BODY */}
    <tbody className="divide-y divide-[color:var(--app-border-subtle)]">

      {loadingUsers ? (
        <tr>
          <td colSpan={4} className="text-center py-8 text-[color:var(--app-text-faint)]">
            Chargement...
          </td>
        </tr>
      ) : users.map((u, idx) => (

        <tr
          key={u.id}
          className={`transition-all duration-200 group ${
            idx % 2 === 0 ? "bg-[var(--app-bg-subtle)]" : "bg-transparent"
          } hover:bg-indigo-500/10`}
        >

          {/* USER */}
          <td className="px-3 md:px-6 py-4">
            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--app-accent-border)] bg-[var(--app-accent-soft)] text-xs font-bold text-[color:var(--app-accent-hover)]">
                {u.firstName?.[0]}
              </div>

              <div>
                <p className="text-[color:var(--app-text)] text-xs md:text-sm font-medium">
                  {u.firstName}
                </p>
                <p className="text-[10px] text-[color:var(--app-text-muted)]">
                  {u.email}
                </p>
              </div>

            </div>
          </td>

          {/* ROLE */}
          <td className="px-3 md:px-6 py-4 text-center">
            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${
              u.role === "manager"
                ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            }`}>
              {u.role}
            </span>
          </td>

          {/* DATE */}
          <td className="px-3 md:px-6 py-4 text-center text-[color:var(--app-text-muted)] text-xs">
            {u.lastSignInAt
              ? new Date(u.lastSignInAt).toLocaleDateString()
              : "—"}
          </td>

          {/* ACTION */}
          <td className="px-3 md:px-6 py-4 text-right">
            <button
              onClick={() => setUserToDelete(u.id)}
              className="app-btn app-btn-icon app-btn-ghost hover:bg-rose-50! hover:text-rose-600!"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
              <div className="app-card relative w-full max-w-md p-8 shadow-[var(--app-shadow-lg)] animate-in zoom-in duration-200">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)]"><X size={20} /></button>
                <SignUpForm onSuccess={() => { setIsModalOpen(false); fetchUsers(); }} />
              </div>
            </div>
          )}

          {/* MODAL CONFIRM DELETE USER */}
          {userToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
              <div className="app-card relative w-full max-w-md p-8 shadow-[var(--app-shadow-lg)] animate-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="text-red-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-[color:var(--app-text)] font-semibold text-lg">Confirmer la suppression</h3>
                    <p className="text-[color:var(--app-text-muted)] text-sm">Cette action est irréversible</p>
                  </div>
                </div>
                
                <p className="text-[color:var(--app-text-secondary)] text-sm mb-6">
                  Êtes-vous sûr de vouloir supprimer cet utilisateur ? Toutes ses données seront perdues définitivement.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setUserToDelete(null)}
                    className="app-btn app-btn-secondary flex-1"
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
                    className={`flex-1 px-4 py-2.5 rounded-lg text-[color:var(--app-text)] font-semibold transition-all text-sm shadow-lg shadow-red-500/30 ${
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
        <h2 className="app-title text-[22px]">Tokens API</h2>
        <p className="text-sm text-[color:var(--app-text-muted)]">Gérez vos clés API</p>
      </div>

      <button
        onClick={() => setIsAddTokenModalOpen(true)}
        className="app-btn app-btn-lg app-btn-primary"
      >
        <Plus size={16} /> Nouveau token
      </button>
    </div>

    <div className="space-y-4">
      {loadingTokens ? (
        <p className="text-[color:var(--app-text-faint)]">Chargement...</p>
      ) : tokens.length === 0 ? (
        <p className="text-[color:var(--app-text-faint)]">Aucun token</p>
      ) : (
        tokens.map((t) => (
          <div key={t.id} className="app-card flex items-center justify-between p-4">
            
            <div>
              <p className="text-[color:var(--app-text)] font-medium">{t.name}</p>
              <p className="text-xs text-[color:var(--app-text-muted)]">
                Créé le {new Date(t.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-indigo-700 mt-1 font-mono">
                {t.token.slice(0, 8)}••••••••
              </p>
            </div>

            <div className="flex gap-2">
              <button
  onClick={() => copyToken(t.token)}
  className="app-btn app-btn-primary"
>
  <Clipboard size={16} />
  Copier
</button>

              <button
                onClick={() => setTokenToDelete(t.id)}
                className="app-btn app-btn-sm app-btn-danger"
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
        <div className="app-card w-full max-w-sm p-6 shadow-[var(--app-shadow-lg)]">
          <h3 className="text-[color:var(--app-text)] mb-4">Créer un token</h3>

          <input
            type="text"
            placeholder="Nom du token"
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            className="app-input mb-4"
          />
          <input
            type="text"
            placeholder="Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="app-input mb-4"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setIsAddTokenModalOpen(false)}
              className="app-btn app-btn-secondary flex-1"
            >
              Annuler
            </button>

            <button
              onClick={createToken}
              className="app-btn app-btn-primary flex-1"
            >
              Créer
            </button>
          </div>
        </div>
      </div>
    )}

    {/* DELETE MODAL */}
    {tokenToDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
        <div className="app-card w-full max-w-sm p-6 shadow-[var(--app-shadow-lg)]">
          <p className="text-[color:var(--app-text)] mb-4">Supprimer ce token ?</p>

          <div className="flex gap-2">
            <button
              onClick={() => setTokenToDelete(null)}
              className="app-btn app-btn-secondary flex-1"
            >
              Annuler
            </button>

            <button
              onClick={() => deleteToken(tokenToDelete)}
              className="app-btn app-btn-primary flex-1 bg-rose-600! hover:bg-rose-700!"
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
