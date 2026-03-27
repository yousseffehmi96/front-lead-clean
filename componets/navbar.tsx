"use client"
import {
  Database,
  Shield,
  Building2,
  Sparkles,
  LayoutDashboard,
  ChevronRight,
  Zap,
  Settings,
  Upload,
} from "lucide-react"
import { usePathname } from "next/navigation"

// Flow 1 — chemin principal des leads
const flow1Links = [
  {
    id: "Staging",
    href: "/lead/staging",
    text: "Staging",
    icon: <Zap size={16} />,
    badge: "1",
    badgeColor: "#f59e0b",
    desc: "Import & brut",
  },
  {
    id: "Silver",
    href: "/lead/silver",
    text: "Silver",
    icon: <Database size={16} />,
    badge: "2",
    badgeColor: "#94a3b8",
    desc: "Incomplets",
  },
  {
    id: "Gold",
    href: "/lead/gold",
    text: "Gold",
    icon: <Sparkles size={16} />,
    badge: "3",
    badgeColor: "#f59e0b",
    desc: "Complets",
  },
]

// Flow 2 — gestion des problèmes
const flow2Links = [
  {
    id: "Clean",
    href: "/lead/clean",
    text: "Clean",
    icon: <Sparkles size={16} />,
    badge: "✦",
    badgeColor: "#6ee7b7",
    desc: "À corriger",
  },
  {
    id: "Blacklist",
    href: "/lead/black",
    text: "Blacklist",
    icon: <Shield size={16} />,
    badge: "⛔",
    badgeColor: "#f43f5e",
    desc: "Bannis",
  },
]

// Settings
const settingsLinks = [
  {
    id: "Dashboard",
    href: "/dashboard",
    text: "Dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  {
    id: "Upload",
    href: "/upload",
    text: "Upload",
    icon: <Upload size={16} />,
  },
  {
    id: "Company",
    href: "/company",
    text: "Sociétés",
    icon: <Building2 size={16} />,
  },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <div
      className="h-screen w-60 flex flex-col flex-shrink-0"
      style={{
        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 0 12px rgba(99,102,241,0.5)",
            }}
          >
            <Zap size={15} color="white" fill="white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">LeadsCleaner</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Data Pipeline</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">

        {/* Flow 1 */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-2">
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              Flow principal
            </p>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Flèches de flow */}
          <div className="flex flex-col gap-0.5">
            {flow1Links.map((link, i) => (
              <div key={link.id}>
                <NavItem link={link} active={pathname === link.href} showDesc />
                {i < flow1Links.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="rgba(255,255,255,0.15)" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <polyline points="19 12 12 19 5 12"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Flow 2 */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-2">
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              Gestion
            </p>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div className="flex flex-col gap-0.5">
            {flow2Links.map((link) => (
              <NavItem key={link.id} link={link} active={pathname === link.href} showDesc />
            ))}
          </div>
        </div>

        {/* Settings */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-2">
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              Settings
            </p>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div className="flex flex-col gap-0.5">
            {settingsLinks.map((link) => (
              <NavItem key={link.id} link={link} active={pathname === link.href} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({ link, active, showDesc = false }: { link: any; active: boolean; showDesc?: boolean }) {
  return (
    <a
      href={link.href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group relative"
      style={{
        background: active
          ? "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))"
          : "transparent",
        border: active ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
        color: active ? "#c7d2fe" : "rgba(255,255,255,0.45)",
      }}
    >
      {active && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
          style={{ background: "#818cf8" }}
        />
      )}

      <span style={{ color: active ? "#818cf8" : "rgba(255,255,255,0.35)" }}>
        {link.icon}
      </span>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block">{link.text}</span>
        {showDesc && link.desc && (
          <span className="text-xs block" style={{ color: "rgba(255,255,255,0.2)" }}>
            {link.desc}
          </span>
        )}
      </div>

      {link.badge && (
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
      )}

      {!link.badge && (
        <ChevronRight
          size={12}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.3)" }}
        />
      )}
    </a>
  )
}