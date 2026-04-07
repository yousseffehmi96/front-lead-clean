"use client";
import { useState } from "react";
import {
  Database,
  Shield,
  Building2,
  Sparkles,
  LayoutDashboard,
  ChevronRight,
  Zap,
  Settings,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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
    { id: "Staging", href: "/lead/staging", text: "Staging", icon: <Zap size={16} />, badge: "1", badgeColor: "#f59e0b", desc: "Import & brut" },
    { id: "Silver", href: "/lead/silver", text: "Silver", icon: <Database size={16} />, badge: "2", badgeColor: "#94a3b8", desc: "Incomplets" },
    { id: "Gold", href: "/lead/gold", text: "Gold", icon: <Sparkles size={16} />, badge: "3", badgeColor: "#f59e0b", desc: "Complets" },
  ];

  const flow2Links = [
    { id: "Clean", href: "/lead/clean", text: "Clean", icon: <Sparkles size={16} />, badge: "✦", badgeColor: "#6ee7b7", desc: "À corriger" },
    { id: "Blacklist", href: "/lead/black", text: "Blacklist", icon: <Shield size={16} />, badge: "⛔", badgeColor: "#f43f5e", desc: "Bannis" },
  ];

  const settingsLinks = [
    { id: "Dashboard", href: "/dashboard", text: "Dashboard", icon: <LayoutDashboard size={16} /> },
    // "adminOnly: true" signifie que seul un manager peut voir ces liens
    { id: "Settings", href: "/settings", text: "Paramètres", icon: <Settings size={16} /> ,adminOnly: true },
    { id: "Company", href: "/company", text: "Sociétés", icon: <Building2 size={16} />},
  ];

  return (
    <>
      {/* Hamburger mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-indigo-600 text-white"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 h-screen w-60 flex flex-col flex-shrink-0 bg-gradient-to-br from-slate-900 to-indigo-950 border-r border-white/10 transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex`}
      >
        {/* Logo Section */}
        <div className="px-5 pt-6 pb-5 border-b border-white/5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg">
            <Zap size={15} color="white" fill="white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">LeadsCleaner</h1>
            <p className="text-xs text-white/30">Data Pipeline</p>
          </div>
        </div>

        {/* User Profile Section */}
        {user && (
          <div className="px-4 py-4 border-b border-white/5 flex flex-col gap-3 bg-white/2">
            <div className="flex flex-col gap-1">
              <p className="text-white text-sm font-medium">
                Bonjour, {firstName}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{
                  background: userRole === 'manager' ? 'rgba(99,102,241,0.2)' : 'rgba(139,92,246,0.2)',
                  color: userRole === 'manager' ? '#818cf8' : '#a78bfa',
                  border: `1px solid ${userRole === 'manager' ? 'rgba(99,102,241,0.3)' : 'rgba(139,92,246,0.3)'}`,
                }}>
                  {userRole === 'manager' ? '🧑‍💼 Manager' : '👨‍💻 Agent'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={14} />
              Se déconnecter
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
          
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

          {/* Section 3 - Filtrée par rôle */}
          <Section title="Settings">
            {settingsLinks
              .filter(link => !link.adminOnly || userRole === 'manager')
              .map((link) => (
                <NavItem key={link.id} link={link} active={pathname === link.href} />
              ))
            }
          </Section>
        </div>
      </div>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
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
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{title}</p>
        <div className="flex-1 h-px bg-white/5" />
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-1 opacity-20">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    </div>
  );
}

function NavItem({ link, active, showDesc = false }: { link: any; active: boolean; showDesc?: boolean }) {
  return (
    <a
      href={link.href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
      style={{
        background: active ? "rgba(99, 102, 241, 0.12)" : "transparent",
        border: active ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid transparent",
        color: active ? "#fff" : "rgba(255, 255, 255, 0.45)",
      }}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
      
      <span className={`transition-colors ${active ? "text-indigo-400" : "group-hover:text-white"}`}>
        {link.icon}
      </span>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold block leading-tight">{link.text}</span>
        {showDesc && link.desc && (
          <span className="text-[10px] block text-white/20 group-hover:text-white/40 transition-colors">
            {link.desc}
          </span>
        )}
      </div>

      {link.badge ? (
        <span
          className="text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0"
          style={{
            color: link.badgeColor,
            background: `${link.badgeColor}15`,
            border: `1px solid ${link.badgeColor}30`,
          }}
        >
          {link.badge}
        </span>
      ) : (
        <ChevronRight size={14} className={`opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ${active ? "text-indigo-400" : "text-white/20"}`} />
      )}
    </a>
  );
}
