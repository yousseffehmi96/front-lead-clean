"use client"
import {
  Database,
  Shield,

  Building2,
  Sparkles,
  LayoutDashboard,
  ChevronRight,
  Zap,
} from "lucide-react"
import { usePathname } from "next/navigation"

const navLinks = [
  {
    id: "Dashboard",
    href: "/dashboard",
    text: "Dashboard",
    icon: <LayoutDashboard size={16} />,
    group: "main",
  },
 
  {
    id: "Staging",
    href: "/lead/staging",
    text: "Staging",
    icon: <Zap size={16} />,
    group: "leads",
    badge: "RAW",
    badgeColor: "#f59e0b",
  },
  {
    id: "Gold",
    href: "/lead/gold",
    text: "Gold",
    icon: <Sparkles size={16} />,
    group: "leads",
    badge: "★",
    badgeColor: "#f59e0b",
  },
  {
    id: "Silver",
    href: "/lead/silver",
    text: "Silver",
    icon: <Database size={16} />,
    group: "leads",
    badge: "◆",
    badgeColor: "#94a3b8",
  },
  {
    id: "Clean",
    href: "/lead/clean",
    text: "Clean",
    icon: <Sparkles size={16} />,
    group: "leads",
    badge: "✦",
    badgeColor: "#6ee7b7",
  },
  {
    id: "Blacklist",
    href: "/lead/black",
    text: "Blacklist",
    icon: <Shield size={16} />,
    group: "tools",
  },
  {
    id: "Company",
    href: "/company",
    text: "Company",
    icon: <Building2 size={16} />,
    group: "tools",
  },
]

export default function Navbar() {
  const pathname = usePathname()

  const mainLinks  = navLinks.filter((n) => n.group === "main")
  const leadsLinks = navLinks.filter((n) => n.group === "leads")
  const toolsLinks = navLinks.filter((n) => n.group === "tools")

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

        {/* General */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-2"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            General
          </p>
          <div className="flex flex-col gap-0.5">
            {mainLinks.map((link) => (
              <NavItem key={link.id} link={link} active={pathname === link.href} />
            ))}
          </div>
        </div>

        {/* Leads */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-2"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            Leads
          </p>
          <div className="flex flex-col gap-0.5">
            {leadsLinks.map((link) => (
              <NavItem key={link.id} link={link} active={pathname === link.href} />
            ))}
          </div>
        </div>

        {/* Tools */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-2"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            Tools
          </p>
          <div className="flex flex-col gap-0.5">
            {toolsLinks.map((link) => (
              <NavItem key={link.id} link={link} active={pathname === link.href} />
            ))}
          </div>
        </div>
      </div>

     
    </div>
  )
}

function NavItem({ link, active }: { link: any; active: boolean }) {
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
      {/* Active indicator */}
      {active && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
          style={{ background: "#818cf8" }}
        />
      )}

      <span style={{ color: active ? "#818cf8" : "rgba(255,255,255,0.35)" }}>
        {link.icon}
      </span>

      <span className="flex-1 text-sm font-medium">{link.text}</span>

      {/* Badge */}
      {link.badge && (
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded"
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

      {/* Arrow on hover */}
      {!link.badge && (
        <ChevronRight
          size={12}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "rgba(255,255,255,0.3)" }}
        />
      )}
    </a>
  )
}