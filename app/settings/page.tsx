"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, Save, X, Users, Mail, ShieldCheck, Calendar } from "lucide-react"
import { deleteUser, getAllUsers } from "@/api/user-actions" 
import SignUpForm from "../sign-up/page"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("rules")

  // ---------------- STATE ----------------
  const [rules, setRules] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([]) 
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: "", key: "", description: "" })

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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    const result = await deleteUser(userId);
    if (result.success) {
      setUsers(users.filter(u => u.id !== userId));
    } else {
      alert("Erreur : " + result.error);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true)
    const result = await getAllUsers()
    console.log(result.users);
    
    if (result.success) {
      setUsers(result.users || [])
    }
    setLoadingUsers(false)
  }

  useEffect(() => {
    if (activeTab === "rules") fetchRules()
    if (activeTab === "users") fetchUsers()
  }, [activeTab])

  // --- CRUD RULES ---
  const addRule = async () => { /* Ton code addRule ici */ }
  const startEdit = (rule: any) => {
    setEditingRule(rule.id)
    setEditForm({ name: rule.name, key: rule.key, description: rule.description || "" })
  }

  const tabs = [
    { id: "rules", label: "Règles de validation" },
    { id: "users", label: "Utilisateurs" },
    { id: "tokens", label: "Tokens" }
  ]

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
            <button onClick={addRule} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20">
              <Plus size={16} /> Nouvelle règle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <div key={rule.id} className="group p-5 rounded-xl border border-white/10 bg-white/5 transition hover:border-white/20">
                {editingRule !== rule.id && (
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-400">⚙️</div>
                      <div>
                        <h3 className="text-white font-semibold">{rule.name}</h3>
                        <p className="text-xs text-indigo-300 opacity-60">ID: {rule.key}</p>
                        <p className="text-sm text-white/40 mt-2 line-clamp-2">{rule.description}</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition">
                       <button onClick={() => startEdit(rule)} className="p-2 rounded-lg bg-white/5 text-indigo-400 hover:bg-white/10"><Edit size={16} /></button>
                       <button onClick={() => {}} className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-white/10"><Trash2 size={16} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
                          : '—'}                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
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

          {/* MODALE */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20} /></button>
                <SignUpForm onSuccess={() => { setIsModalOpen(false); fetchUsers(); }} />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "tokens" && <div className="text-white p-10 text-center border border-dashed border-white/10 rounded-xl">Gestion des clés API (Prochainement)</div>}
    </div>
  )
}