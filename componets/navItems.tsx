import Link from "next/link"

interface NavItemProps {
  text: string
  icon: React.ReactNode
  active?: boolean
  href: string
  onClick?: () => void
}

export default function Navitems({ text, icon, active, href, onClick }: NavItemProps) {
  return (
    <Link href={href} onClick={onClick} className={`
      flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer
      ${active
        ? "border-l-4 border-blue-600 bg-blue-50 text-blue-600 font-medium pl-3.5"
        : "text-gray-600 font-medium hover:bg-gray-100"
      }
    `}>
      {icon}
      {text}
    </Link>
  )
}