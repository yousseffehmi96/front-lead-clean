"use client";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
      }}
    >
      <SignIn 
        forceRedirectUrl="/lead/staging" 
        appearance={{
          layout: {
            hideByline: true,
          },
          variables: {
            colorPrimary: "#818cf8",
            colorText: "white",
            colorBackground: "transparent",
          },
          elements: {
            card: {
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(20px)",
              boxShadow: "none",
              width: "400px",
              padding: "40px",
            },
            headerTitle: {
              // On cache le titre original (ex: "Continue to My Application")
              fontSize: "0px !important", 
              color: "transparent !important",
              "&::before": {
                content: '"LeadsCleaner"', // Ton titre
                display: "block",
                fontSize: "26px",
                fontWeight: "700",
                color: "white",
                textAlign: "center",
                visibility: "visible",
              },
            },
            headerSubtitle: {
              // On cache le sous-titre original
              fontSize: "0px !important",
              color: "transparent !important",
              marginTop: "8px",
              "&::before": {
                // ON AJOUTE TA PHRASE ICI
                content: '"Heureux de vous revoir ! Connectez-vous."', 
                display: "block",
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.5)",
                textAlign: "center",
                visibility: "visible",
              },
            },
            formFieldInput: {
              background: "white",
              color: "black",
              borderRadius: "8px",
            },
            formFieldLabel: {
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "11px",
              textTransform: "uppercase",
              marginBottom: "8px",
            },
            formButtonPrimary: {
              background: "linear-gradient(90deg, #818cf8, #6366f1)",
              borderRadius: "8px",
              textTransform: "none",
              marginTop: "10px",
            },
            footer: { display: "none" },
          }
        }}
      />
    </div>
  );
}