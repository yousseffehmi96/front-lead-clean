"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, X, Mail, ShieldCheck, Calendar, AlertTriangle, Clipboard } from "lucide-react"
import { deleteUser, getAllUsers } from "@/api/user-actions" 
import SignUpForm from "../sign-up/page"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("rules")

  // ---------------- STATE RULES ----------------
  const [rules, setRules] = useState<any[]>([])
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false)
  const [newRuleForm, setNewRuleForm] = useState({ name: "", key: "", description: "" })
  const [addRuleLoading, setAddRuleLoading] = useState(false)
  const [addRuleError, setAddRuleError] = useState<string | null>(null)
  const [editingRule, setEditingRule] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: "", key: "", description: "" })
  const [ruleToDelete, setRuleToDelete] = useState<number | null>(null)

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
  const fetchRules = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validation-rules`)
      const data = await res.json()
      setRules(data)
    } catch (err) {
      console.error("Erreur fetch rules:", err)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    const result = await getAllUsers()
    if (result.success) {
      setUsers(result.users || [])
    }
    setLoadingUsers(false)
  }

  useEffect(() => {
  if (activeTab === "rules") fetchRules()
  if (activeTab === "users") fetchUsers()
  if (activeTab === "tokens") fetchTokens()
}, [activeTab])

  // ---------------- CRUD RULES ----------------
  const addRule = async () => {
    if (!newRuleForm.name.trim()) {
      setAddRuleError("Le nom de la règle est obligatoire")
      return
    }
    if (!newRuleForm.key.trim()) {
      setAddRuleError("La clé est obligatoire")
      return
    }

    setAddRuleLoading(true)
    setAddRuleError(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validation-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRuleForm)
      })

      if (res.ok) {
        await fetchRules()
        setIsAddRuleModalOpen(false)
        setNewRuleForm({ name: "", key: "", description: "" })
      } else {
        const error = await res.json()
        setAddRuleError(error.message || "Erreur lors de l'ajout de la règle")
      }
    } catch (err) {
      console.error("Erreur ajout règle:", err)
      setAddRuleError("Erreur de connexion au serveur")
    } finally {
      setAddRuleLoading(false)
    }
  }

  const startEdit = (rule: any) => {
    setEditingRule(rule.id)
    setEditForm({ name: rule.name, key: rule.key, description: rule.description || "" })
  }

  const updateRule = async (ruleId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validation-rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      if (res.ok) {
        setEditingRule(null)
        await fetchRules()
      }
    } catch (err) {
      console.error('Erreur mise à jour:', err)
    }
  }

  const deleteRule = async (ruleId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validation-rules/${ruleId}`, {
        method: 'DELETE'
      })
      await fetchRules()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
    setRuleToDelete(null)
  }

  const tabs = [
    { id: "rules", label: "Règles de validation" },
    { id: "users", label: "Utilisateurs" },
    { id: "tokens", label: "Tokens" }
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
    <div className="min-h-screen p-8" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)" }}>

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

      {/* --- CONTENT : RULES --- */}
      {activeTab === "rules" && (
        <div className="animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Règles de validation</h2>
              <p className="text-sm text-white/40 mt-1">Gérez vos règles de nettoyage</p>
            </div>
            <button 
              onClick={() => setIsAddRuleModalOpen(true)} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20"
            >
              <Plus size={16} /> Nouvelle règle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <div key={rule.id} className="group p-5 rounded-xl border border-white/10 bg-white/5 transition hover:border-white/20">
                {editingRule !== rule.id ? (
                  <>
                    {/* Contenu de la carte */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-400">
                        ⚙️
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{rule.name}</h3>
                        <p className="text-xs text-indigo-300 opacity-60">{rule.key}</p>
                        <p className="text-sm text-white/40 mt-2 line-clamp-2">
                          {rule.description}
                        </p>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(rule)} 
                        className="p-2 rounded-lg bg-white/5 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => setRuleToDelete(rule.id)} 
                        className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  /* Formulaire d'édition */
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none"
                      placeholder="Nom de la règle"
                    />
                    <input
                      type="text"
                      value={editForm.key}
                      onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none"
                      placeholder="Clé (ex: email_valid)"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none resize-none"
                      placeholder="Description"
                      rows={3}
                    />
                    
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingRule(null)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => updateRule(rule.id)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* MODAL AJOUT RÈGLE */}
          {isAddRuleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
                <button 
                  onClick={() => {
                    setIsAddRuleModalOpen(false)
                    setNewRuleForm({ name: "", key: "", description: "" })
                    setAddRuleError(null)
                  }} 
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition"
                >
                  <X size={20} />
                </button>

                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-lg text-xl">
                    ⚙️
                  </div>
                  <h3 className="text-xl font-bold text-white">Nouvelle règle</h3>
                  <p className="text-sm text-white/50 mt-1">Créer une règle de validation</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/50 text-xs font-semibold mb-2 tracking-wider">
                      NOM DE LA RÈGLE *
                    </label>
                    <input
                      type="text"
                      placeholder="Email valide"
                      value={newRuleForm.name}
                      onChange={(e) => setNewRuleForm({ ...newRuleForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-white/50 text-xs font-semibold mb-2 tracking-wider">
                      CLÉ UNIQUE *
                    </label>
                    <input
                      type="text"
                      placeholder="email_valid"
                      value={newRuleForm.key}
                      onChange={(e) => setNewRuleForm({ ...newRuleForm, key: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-white/50 text-xs font-semibold mb-2 tracking-wider">
                      DESCRIPTION
                    </label>
                    <textarea
                      placeholder="Vérifie que l'email est valide..."
                      value={newRuleForm.description}
                      onChange={(e) => setNewRuleForm({ ...newRuleForm, description: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none transition resize-none"
                      rows={3}
                    />
                  </div>

                  {addRuleError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-red-400 text-xs">
                      {addRuleError}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setIsAddRuleModalOpen(false)
                        setNewRuleForm({ name: "", key: "", description: "" })
                        setAddRuleError(null)
                      }}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition text-sm font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addRule}
                      disabled={addRuleLoading}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-white font-semibold text-sm shadow-lg transition ${
                        addRuleLoading
                          ? "bg-indigo-500/40 cursor-not-allowed shadow-none"
                          : "bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-indigo-500/30 hover:shadow-indigo-500/50"
                      }`}
                    >
                      {addRuleLoading ? "Création..." : "Créer"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL CONFIRM DELETE RULE */}
          {ruleToDelete && (
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
                  Êtes-vous sûr de vouloir supprimer cette règle de validation ?
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setRuleToDelete(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-all text-sm font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => deleteRule(ruleToDelete)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all text-sm font-medium shadow-lg shadow-red-500/30"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
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

          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Utilisateur</th>
                  <th className="px-6 py-4 font-semibold">Rôle</th>
                  <th className="px-6 py-4 font-semibold">Dernière connexion</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingUsers ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-white/20 italic">Chargement...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-white/20">Aucun utilisateur trouvé.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs border border-indigo-500/30">
                            {u.firstName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{u.firstName} {u.lastName}</p>
                            <p className="text-[11px] text-white/30 flex items-center gap-1">
                              <Mail size={10}/> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          u.role === 'manager' 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          <ShieldCheck size={10} />
                          {u.role || 'agent'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-white/40 flex items-center gap-1">
                          <Calendar size={12} />
                        {u.lastSignInAt 
                          ? new Date(u.lastSignInAt).toLocaleString(undefined, {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}                        
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setUserToDelete(u.id)}
                          className="p-2 text-white/20 hover:text-red-400 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
