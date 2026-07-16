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
        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
        padding: "24px 16px",
      }}
    >
      {/* Halos décoratifs en fond */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-160px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "480px",
          height: "480px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(129,140,248,0.28) 0%, rgba(129,140,248,0) 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-140px",
          right: "-80px",
          width: "360px",
          height: "360px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(45,212,191,0.16) 0%, rgba(45,212,191,0) 70%)",
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
            background: "linear-gradient(135deg, #818cf8, #6366f1)",
            boxShadow: "0 10px 30px -8px rgba(99,102,241,0.6)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />
          </svg>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
            LeadsCleaner
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
            Heureux de vous revoir ! Connectez-vous.
          </p>
        </div>
      </div>

      <SignIn
        forceRedirectUrl="/lead/import"
        appearance={{
          variables: {
            colorPrimary: "#818cf8",
            colorForeground: "white",
            colorBackground: "transparent",
          },
          elements: {
            card: {
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6)",
              borderRadius: "20px",
              width: "min(400px, calc(100vw - 32px))",
              maxWidth: "100%",
              padding: "clamp(20px, 4vw, 36px)",
            },
            header: { display: "none" },
            formFieldInput: {
              background: "rgba(255,255,255,0.95)",
              color: "#0f172a",
              borderRadius: "10px",
              minHeight: "44px",
              border: "1px solid transparent",
            },
            formFieldLabel: {
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "8px",
            },
            formButtonPrimary: {
              background: "linear-gradient(90deg, #818cf8, #6366f1)",
              borderRadius: "10px",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              minHeight: "44px",
              marginTop: "12px",
              boxShadow: "0 8px 24px -8px rgba(99,102,241,0.7)",
            },
            footer: { display: "none" },
          },
        }}
      />
    </div>
  );
}
