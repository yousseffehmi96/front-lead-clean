"use client"
import { useState } from "react"
import {
  Database,
  Shield,
  Building2,
  Sparkles,
  LayoutDashboard,
  ChevronRight,
  Zap,
  Settings,
} from "lucide-react"
import { usePathname } from "next/navigation"

// ... flow1Links, flow2Links, settingsLinks comme avant

export default function Navbar() {
  // Flow 1 — chemin principal des leads
const flow1Links = [
  { id: "Staging", href: "/lead/staging", text: "Staging", icon: <Zap size={16} />, badge: "1", badgeColor: "#f59e0b", desc: "Import & brut" },
  { id: "Silver", href: "/lead/silver", text: "Silver", icon: <Database size={16} />, badge: "2", badgeColor: "#94a3b8", desc: "Incomplets" },
  { id: "Gold", href: "/lead/gold", text: "Gold", icon: <Sparkles size={16} />, badge: "3", badgeColor: "#f59e0b", desc: "Complets" },
]

// Flow 2 — gestion des problèmes
const flow2Links = [
  { id: "Clean", href: "/lead/clean", text: "Clean", icon: <Sparkles size={16} />, badge: "✦", badgeColor: "#6ee7b7", desc: "À corriger" },
  { id: "Blacklist", href: "/lead/black", text: "Blacklist", icon: <Shield size={16} />, badge: "⛔", badgeColor: "#f43f5e", desc: "Bannis" },
]

// Settings
const settingsLinks = [
  { id: "Dashboard", href: "/dashboard", text: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "Settings", href: "/settings", text: "Paramètres", icon: <Settings size={16} /> },
  { id: "Company", href: "/company", text: "Sociétés", icon: <Building2 size={16} /> },
]
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-indigo-600 text-white"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-60 flex flex-col flex-shrink-0 bg-gradient-to-br from-slate-900 to-indigo-950 border-r border-white/6 transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex`}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg">
            <Zap size={15} color="white" fill="white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">LeadsCleaner</h1>
            <p className="text-xs text-white/30">Data Pipeline</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
          {/* Flow 1 */}
          <Section title="Flow principal">
            {flow1Links.map((link, i) => (
              <div key={link.id}>
                <NavItem link={link} active={pathname === link.href} showDesc />
                {i < flow1Links.length - 1 && <FlowArrow />}
              </div>
            ))}
          </Section>

          {/* Flow 2 */}
          <Section title="Gestion">
            {flow2Links.map((link) => (
              <NavItem key={link.id} link={link} active={pathname === link.href} showDesc />
            ))}
          </Section>

          {/* Settings */}
          <Section title="Settings">
            {settingsLinks.map((link) => (
              <NavItem key={link.id} link={link} active={pathname === link.href} />
            ))}
          </Section>
        </div>
      </div>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}

// Section, FlowArrow et NavItem comme avant
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/25">{title}</p>
        <div className="flex-1 h-px bg-white/6" />
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-0.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    </div>
  )
}

function NavItem({ link, active, showDesc = false }: { link: any; active: boolean; showDesc?: boolean }) {
  return (
    <a
      href={link.href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group relative"
      style={{
        background: active ? "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))" : "transparent",
        border: active ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
        color: active ? "#c7d2fe" : "rgba(255,255,255,0.45)",
      }}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-indigo-400" />}
      <span style={{ color: active ? "#818cf8" : "rgba(255,255,255,0.35)" }}>{link.icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block">{link.text}</span>
        {showDesc && link.desc && <span className="text-xs block text-white/20">{link.desc}</span>}
      </div>
      {link.badge ? (
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
          style={{
            color: link.badgeColor,
            background: `${link.badgeColor}18`,
            border: `1px solid ${link.badgeColor}30`,
            fontSize: "10px",
          }}
        >
          {link.badge}
        </span>
      ) : (
        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
      )}
    </a>
  )
}