"use client";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        overflow: "hidden",
        background: "var(--app-bg)",
        padding: "24px 16px",
      }}
    >
      {/* Halos décoratifs en fond — teintes très diluées sur le blanc */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-180px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "520px",
          height: "520px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0) 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-160px",
          right: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(45,212,191,0.12) 0%, rgba(45,212,191,0) 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      {/* En-tête de marque */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            height: "56px",
            width: "56px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 12px 28px -10px rgba(79,70,229,0.55)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />
          </svg>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "var(--app-text)", letterSpacing: "-0.02em" }}>
            LeadsCleaner
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "14px", color: "var(--app-text-muted)" }}>
            Heureux de vous revoir ! Connectez-vous.
          </p>
        </div>
      </div>

      <SignIn
        forceRedirectUrl="/lead/import"
        appearance={{
          variables: {
            colorPrimary: "#4f46e5",
            colorForeground: "#0f172a",
            colorBackground: "transparent",
          },
          elements: {
            card: {
              background: "#ffffff",
              border: "1px solid #e4e8ef",
              boxShadow: "0 20px 45px rgba(15,23,42,0.10)",
              borderRadius: "20px",
              width: "min(400px, calc(100vw - 32px))",
              maxWidth: "100%",
              padding: "clamp(20px, 4vw, 36px)",
            },
            header: { display: "none" },
            formFieldInput: {
              background: "#ffffff",
              color: "#0f172a",
              borderRadius: "10px",
              minHeight: "44px",
              border: "1px solid #e4e8ef",
            },
            formFieldLabel: {
              color: "#64748b",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "8px",
            },
            formButtonPrimary: {
              background: "#4f46e5",
              borderRadius: "10px",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              minHeight: "44px",
              marginTop: "12px",
              boxShadow: "0 8px 20px -10px rgba(79,70,229,0.6)",
            },
            footer: { display: "none" },
          },
        }}
      />
    </div>
  );
}
