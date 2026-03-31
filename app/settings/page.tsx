"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, Save, X } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("rules")

  // ---------------- RULES STATE ----------------
  const [rules, setRules] = useState<any[]>([])
  const [editingRule, setEditingRule] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    key: "",
    description: ""
  })

  // ---------------- FETCH RULES ----------------
  const fetchRules = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validation-rules`)
      const data = await res.json()
      setRules(data)
    } catch (err) {
      console.error("Erreur fetch rules:", err)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  // ---------------- CRUD ----------------

  const addRule = async () => {
    try {
      const newRule = {
        name: "Nouvelle règle",
        key: "nouvelle_regle",
        description: "Description..."
      }
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validation-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRule)
      })
      fetchRules()
    } catch (err) {
      console.error("Erreur addRule:", err)
    }
  }

  const startEdit = (rule: any) => {
    setEditingRule(rule.id)
    setEditForm({
      name: rule.name,
      key: rule.key,
      description: rule.description || ""
    })
  }

  const saveEdit = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validation-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })
      fetchRules()
      setEditingRule(null)
    } catch (err) {
      console.error("Erreur saveEdit:", err)
    }
  }

  const deleteRule = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validation-rules/${id}`, { method: "DELETE" })
      fetchRules()
    } catch (err) {
      console.error("Erreur deleteRule:", err)
    }
  }

  // ---------------- TABS ----------------
  const tabs = [
    { id: "rules", label: "Règles de validation" },
    { id: "roles", label: "Rôles" },
    { id: "users", label: "Utilisateurs" },
    { id: "tokens", label: "Tokens" }
  ]

  return (
    <div className="min-h-screen p-8" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)" }}>
      {/* 🔥 MENU HORIZONTAL */}
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

      {/* ---------------- CONTENT ---------------- */}

      {/* RULES */}
      {activeTab === "rules" && (
        <div>
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Règles de validation</h2>
              <p className="text-sm text-white/40 mt-1">Gérez et configurez vos règles de nettoyage des données</p>
            </div>

            <button
              onClick={addRule}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "white" }}
            >
              <Plus size={16} />
              Nouvelle règle
            </button>
          </div>

          {/* LISTE 3 PAR LIGNE (responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="group p-5 rounded-xl border transition min-w-[250px]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {editingRule === rule.id ? (
                  <div className="space-y-3">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-black/30 text-white"
                      placeholder="Nom de la règle"
                    />
                    <input
                      value={editForm.key}
                      onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-black/30 text-white"
                      placeholder="Clé technique"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-black/30 text-white"
                      placeholder="Description"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(rule.id)} className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400"><Save size={16} /></button>
                      <button onClick={() => setEditingRule(null)} className="px-3 py-2 rounded-lg bg-gray-500/20 text-gray-400"><X size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30">⚙️</div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-white font-semibold">{rule.name}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{rule.key}</span>
                        </div>
                        <p className="text-sm text-white/40 mt-1">{rule.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-2">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => startEdit(rule)} className="p-2 rounded-lg hover:bg-white/10 text-indigo-400"><Edit size={16} /></button>
                        <button onClick={() => deleteRule(rule.id)} className="p-2 rounded-lg hover:bg-white/10 text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUTRES SECTIONS */}
      {activeTab === "roles" && <div className="text-white">Section Rôles (à faire)</div>}
      {activeTab === "users" && <div className="text-white">Section Utilisateurs (à faire)</div>}
      {activeTab === "tokens" && <div className="text-white">Section Tokens (à faire)</div>}
    </div>
  )
}