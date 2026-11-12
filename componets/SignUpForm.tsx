"use client";
import { useEffect, useState } from "react";
import { createUser } from "@/api/user-actions";  
import { User, UserCog, Zap } from "lucide-react"

const ROLES = [
  { value: "manager", label: "Manager", Icon: UserCog },
  { value: "agent", label: "Agent", Icon: User },
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
          background: "linear-gradient(135deg, #4f46e5, #4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px",
          boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
          color: "#fff",
        }}>
          <Zap size={20} fill="white" />
        </div>
        <h1 style={{ color: "var(--app-text)", fontSize: 18, fontWeight: 700, margin: 0 }}>
          Ajouter un agent
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Champs de saisie */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
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
                  background: role === r.value ? "rgba(99,102,241,0.2)" : "var(--app-bg-subtle)",
                  border: role === r.value ? "1px solid rgba(99,102,241,0.6)" : "1px solid var(--app-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 4, color: role === r.value ? "#4f46e5" : "var(--app-text-muted)" }}>
                  <r.Icon size={16} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: role === r.value ? "#4f46e5" : "var(--app-text-muted)" }}>
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
            background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #4f46e5, #4f46e5)",
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
  display: "block", color: "var(--app-text-muted)", fontSize: 10, 
  fontWeight: 600, marginBottom: 6, letterSpacing: "0.5px" 
};

const inputStyle = {
  width: "100%", boxSizing: "border-box" as const,
  background: "var(--app-surface)",
  border: "1px solid var(--app-border)",
  borderRadius: 10, padding: "10px 12px",
  color: "var(--app-text)", fontSize: 14, outline: "none",
};

const errorStyle = {
  background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)",
  borderRadius: 8, padding: "10px", color: "#dc2626", fontSize: 12,
};
