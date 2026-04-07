"use client";
import { useState } from "react";
import { createUser } from "@/api/user-actions";  

const ROLES = [
  { value: "manager", label: "Manager", icon: "🧑‍💼" },
  { value: "agent", label: "Agent", icon: "👨‍💻" },
];

interface SignUpFormProps {
  onSuccess: () => void;
}

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!role) {
      setError("Veuillez sélectionner un rôle");
      return;
    }

    setLoading(true);
    setError(null);
    console.log(role);
    

    try {
      const result = await createUser(email, {
        firstName,
        lastName,
        role,
      });

      if (result.success) {
        console.log(result);
        
        // RÉUSSITE
        setFirstName("");
        setLastName("");
        setEmail("");
        setRole("");
        onSuccess(); 
      } else {
        setError(result.error || "Une erreur est survenue");
      }
    } catch (err) {
      setError("Une erreur inattendue est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", fontFamily: "'Inter', sans-serif" }}>
      {/* Header réduit car déjà dans une modale */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px",
          boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
          fontSize: 18,
        }}>⚡</div>
        <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
          Ajouter un agent
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Champs de saisie */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>PRÉNOM</label>
            <input
              type="text"
              placeholder="Jean"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>NOM</label>
            <input
              type="text"
              placeholder="Dupont"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>ADRESSE EMAIL</label>
          <input
            type="email"
            placeholder="jean@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        {/* Sélecteur de rôle */}
        <div>
          <label style={labelStyle}>RÔLE</label>
          <div style={{ display: "flex", gap: 8 }}>
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10,
                  cursor: "pointer", transition: "all 0.15s",
                  background: role === r.value ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                  border: role === r.value ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: 16, marginBottom: 2 }}>{r.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: role === r.value ? "#818cf8" : "rgba(255,255,255,0.4)" }}>
                  {r.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 8, padding: "12px", borderRadius: 10, border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #818cf8)",
            color: "#fff", fontWeight: 600, fontSize: 14,
            boxShadow: loading ? "none" : "0 4px 15px rgba(99,102,241,0.3)",
          }}
        >
          {loading ? "Création..." : "Créer le compte"}
        </button>
      </form>
    </div>
  );
}

// Styles réutilisables pour plus de clarté
const labelStyle = { 
  display: "block", color: "rgba(255,255,255,0.5)", fontSize: 10, 
  fontWeight: 600, marginBottom: 6, letterSpacing: "0.5px" 
};

const inputStyle = {
  width: "100%", boxSizing: "border-box" as const,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 10, padding: "10px 12px",
  color: "#fff", fontSize: 14, outline: "none",
};

const errorStyle = {
  background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)",
  borderRadius: 8, padding: "10px", color: "#f87171", fontSize: 12,
};
