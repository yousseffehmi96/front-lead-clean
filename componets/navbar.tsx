"use client";
import { useState } from "react";
// Sidebar en texte seul : ne restent que les commandes (ouverture/fermeture du
// menu mobile, indicateur de dépliage du menu profil).
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import ImportProgress from "./ImportProgress";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();

  // Extraction sécurisée du rôle et du prénom
  const userRole = (user?.publicMetadata?.role as string) || "agent";
  const firstName = (user?.publicMetadata.firstName as string) || "Utilisateur";

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/sign-in";
  };

  // --- CONFIGURATION DES LIENS ---

  const flow1Links = [
    { id: "Import", href: "/lead/import", text: "Import", badge: "1", badgeColor: "#b45309", desc: "Import & brut" },
    { id: "Staging", href: "/lead/staging", text: "Staging", badge: "", badgeColor: "#d97706", desc: "Aucune règle" },
    { id: "Leads", href: "/lead/leads", text: "Optimized", badge: "2", badgeColor: "#b45309", desc: "Complétion & Complete" },
  ];

  const flow2Links = [
    { id: "Clean", href: "/lead/clean", text: "Clean", badge: "", badgeColor: "#059669", desc: "À corriger" },
    { id: "Blacklist", href: "/lead/black", text: "Blacklist", badge: "", badgeColor: "#e11d48", desc: "Bannis" },
    { id: "Historique", href: "/lead/history", text: "Historique", badge: "", badgeColor: "#4f46e5", desc: "Imports" },
  ];

  return (
    <>
      {/* Hamburger mobile */}
      <button
        className={`md:hidden fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-accent)] text-white shadow-[var(--app-shadow-md)] transition-opacity ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        onClick={() => setOpen(!open)}
        aria-label="Ouvrir le menu"
      >
        <Menu size={18} />
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 h-[100dvh] w-60 flex flex-col flex-shrink-0 bg-[var(--app-rail)] border-r border-[color:var(--app-rail-border)] shadow-[1px_0_0_rgba(15,23,42,0.02)] transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex`}
      >
        {/* Logo Section */}
        <div className="px-5 pt-6 pb-5 border-b border-[color:var(--app-rail-border)] flex items-center gap-2.5 relative">
          <button
            className="md:hidden absolute top-4 right-3 app-btn app-btn-ghost app-btn-sm app-btn-icon"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={16} />
          </button>
          <div>
            <h1 className="app-title text-sm tracking-wide">LeadsCleaner</h1>
            <p className="text-[11px] text-[color:var(--app-text-faint)]">Data Pipeline</p>
          </div>
        </div>

        {/* Dashboard en avant */}
        <div className="px-3 pt-3">
          <Link
            href="/dashboard"
            className={`group flex items-center gap-3 rounded-xl border px-3 py-3 transition-all duration-200 ${
              pathname === "/dashboard"
                ? "border-[color:var(--app-accent-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]"
                : "border-[color:var(--app-rail-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-xs)] hover:border-[color:var(--app-accent-border)]"
            }`}
          >
            <div className="flex-1">
              <p className="app-title text-sm">Dashboard</p>
              <p className="text-[10px] text-[color:var(--app-text-muted)]">Vue globale et KPI</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 pt-4 pb-4 flex flex-col gap-5">

          {/* Section 1 */}
          <Section title="Flow principal">
            {flow1Links.map((link, i) => (
              <div key={link.id}>
                <NavItem link={link} active={pathname === link.href} showDesc />
                {i < flow1Links.length - 1 && <FlowArrow />}
              </div>
            ))}
          </Section>

          {/* Section 2 */}
          <Section title="Gestion">
            {flow2Links.map((link) => (
              <NavItem key={link.id} link={link} active={pathname === link.href} showDesc />
            ))}
          </Section>

        </div>

        {/* Progression de l'import en cours, visible depuis toutes les pages */}
        <ImportProgress />

        {/* User Profile Section — épinglée en bas, le menu s'ouvre vers le haut */}
        {user && (
          <div className="relative mt-auto flex-shrink-0 border-t border-[color:var(--app-rail-border)] px-3 py-3">
            {profileOpen && (
              <div className="app-card absolute bottom-full left-3 right-3 z-50 mb-2 overflow-hidden p-1 shadow-[var(--app-shadow-lg)]">
                {userRole === "manager" && (
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[color:var(--app-text-secondary)] transition-colors hover:bg-[var(--app-surface-hover)] hover:text-[color:var(--app-text)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    Paramètres
                  </Link>
                )}
                <Link
                  href="/company"
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[color:var(--app-text-secondary)] transition-colors hover:bg-[var(--app-surface-hover)] hover:text-[color:var(--app-text)]"
                  onClick={() => setProfileOpen(false)}
                >
                  Sociétés
                </Link>
                <button
                  onClick={async () => {
                    setProfileOpen(false);
                    await handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50"
                >
                  Se déconnecter
                </button>
              </div>
            )}

            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-[var(--app-surface)]"
              aria-label="Ouvrir le menu profil"
              aria-expanded={profileOpen}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-xs font-bold text-white">
                  {firstName.charAt(0).toUpperCase()}
                </span>
                <span className="truncate text-sm font-medium text-[color:var(--app-text)]">{firstName}</span>
              </span>
              <ChevronDown
                size={14}
                className={`flex-shrink-0 text-[color:var(--app-text-faint)] transition-transform ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

    </>
  );
}

// --- SOUS-COMPOSANTS ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1 px-2">
        <p className="app-eyebrow">{title}</p>
        <div className="flex-1 h-px bg-[var(--app-rail-border)]" />
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

/** Séparateur entre deux étapes du flow (remplace la flèche descendante). */
function FlowArrow() {
  return (
    <div className="flex justify-center py-1">
      <div className="h-3 w-px bg-[var(--app-rail-border)]" />
    </div>
  );
}

function NavItem({ link, active, showDesc = false }: { link: any; active: boolean; showDesc?: boolean }) {
  return (
    <Link
      href={link.href}
      className={`app-nav-item group ${active ? "app-nav-item-active" : ""}`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--app-accent)]" />
      )}

      <div className="flex-1 min-w-0">
        <span className={`block text-sm font-semibold leading-tight ${active ? "" : "text-[color:var(--app-text)]"}`}>
          {link.text}
        </span>
        {showDesc && link.desc && (
          <span className="block text-[10px] text-[color:var(--app-text-muted)]">
            {link.desc}
          </span>
        )}
      </div>

      {link.badge ? (
        <span
          className="app-badge flex-shrink-0 px-1.5 py-0.5 text-[9px] font-black"
          style={{
            color: link.badgeColor,
            background: `${link.badgeColor}14`,
            borderColor: `${link.badgeColor}33`,
          }}
        >
          {link.badge}
        </span>
      ) : null}
    </Link>
  );
}
