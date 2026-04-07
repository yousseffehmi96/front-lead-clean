"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, X, Mail, ShieldCheck, Calendar, AlertTriangle, Clipboard } from "lucide-react"
import { deleteUser, getAllUsers } from "@/api/user-actions" 
import SignUpForm from "../sign-up/page"

export default function SettingsPage() {

  const [activeTab, setActiveTab] = useState("rules")

  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  const [tokens, setTokens] = useState<any[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false)
  const [newTokenName, setNewTokenName] = useState("")
  const [token, setToken] = useState("")
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null)

  const tabs = [
    { id: "users", label: "Utilisateurs" },
    { id: "tokens", label: "Tokens" }
  ]

  // ---------------- USERS ----------------
  const fetchUsers = async () => {
    setLoadingUsers(true)
    const result = await getAllUsers()
    if (result.success) setUsers(result.users || [])
    setLoadingUsers(false)
  }

  // ---------------- TOKENS ----------------
  const fetchTokens = async () => {
    setLoadingTokens(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token`)
      const data = await res.json()
      setTokens(data.tokens || data || [])
    } catch {
      setTokens([])
    }
    setLoadingTokens(false)
  }

  const createToken = async () => {
    if (!newTokenName || !token) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTokenName, token })
    })
    fetchTokens()
    setIsAddTokenModalOpen(false)
    setNewTokenName("")
    setToken("")
  }

  const deleteToken = async (id: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/${id}`, { method: "DELETE" })
    fetchTokens()
    setTokenToDelete(null)
  }

  const copyToken = (t: string) => navigator.clipboard.writeText(t)

  useEffect(() => {
    if (activeTab === "users") fetchUsers()
    if (activeTab === "tokens") fetchTokens()
  }, [activeTab])

  return (
    <div className="min-h-screen p-3 md:p-8 bg-gradient-to-br from-slate-900 to-indigo-900 text-white">

      {/* TABS */}
      <div className="flex gap-2 md:gap-3 mb-6 border-b border-white/10 pb-3 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm rounded-lg whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-white/50 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* USERS */}
      {activeTab === "users" && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold">Utilisateurs</h2>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-x-auto">
            <table className="min-w-[600px] w-full text-xs md:text-sm">
              <thead className="bg-white/5">
                <tr className="text-white/40 uppercase">
                  <th className="px-3 md:px-6 py-3 text-left">User</th>
                  <th className="px-3 md:px-6 py-3">Rôle</th>
                  <th className="px-3 md:px-6 py-3">Date</th>
                  <th className="px-3 md:px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {loadingUsers ? (
                  <tr><td colSpan={4} className="text-center py-6">Chargement...</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5">
                    
                    <td className="px-3 md:px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-xs">
                          {u.firstName?.[0]}
                        </div>
                        <div>
                          <p className="text-xs md:text-sm">{u.firstName}</p>
                          <p className="text-[10px] text-white/40">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 md:px-6 py-3 text-xs">
                      {u.role}
                    </td>

                    <td className="px-3 md:px-6 py-3 text-xs text-white/40">
                      {u.lastSignInAt
                        ? new Date(u.lastSignInAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-3 md:px-6 py-3 text-right">
                      <button onClick={() => setUserToDelete(u.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TOKENS */}
      {activeTab === "tokens" && (
        <>
          <div className="flex justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">Tokens</h2>

            <button
              onClick={() => setIsAddTokenModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600"
            >
              <Plus size={16} /> Token
            </button>
          </div>

          <div className="space-y-3">
            {tokens.map(t => (
              <div key={t.id} className="p-4 bg-white/5 rounded-xl flex flex-col md:flex-row justify-between gap-3">

                <div>
                  <p>{t.name}</p>
                  <p className="text-xs text-white/40">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-indigo-300">
                    {t.token.slice(0, 8)}••••
                  </p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => copyToken(t.token)} className="bg-indigo-600 px-3 py-1 rounded">
                    Copier
                  </button>
                  <button onClick={() => setTokenToDelete(t.id)} className="bg-red-500 px-3 py-1 rounded">
                    Supprimer
                  </button>
                </div>

              </div>
            ))}
          </div>
        </>
      )}

    </div>
  )
}