"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Target, Users, CheckSquare, BarChart3,
  Settings, FileText, Bell, Zap, ChevronRight, ClipboardList
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

type NavLink = {
  href: string
  icon: React.ElementType
  label: string
  roles: string[]
  badge?: number
}

const navLinks: NavLink[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { href: "/dashboard/goals", icon: Target, label: "My Goals", roles: ["EMPLOYEE"] },
  { href: "/dashboard/checkins", icon: ClipboardList, label: "Check-ins", roles: ["EMPLOYEE"] },
  { href: "/dashboard/notifications", icon: Bell, label: "Notifications", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { href: "/dashboard/team", icon: Users, label: "Team Tracker", roles: ["MANAGER"] },
  { href: "/dashboard/approvals", icon: CheckSquare, label: "Approvals", roles: ["MANAGER"] },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Org Analytics", roles: ["ADMIN"] },
  { href: "/dashboard/audit-logs", icon: FileText, label: "Audit Logs", roles: ["ADMIN"] },
  { href: "/dashboard/settings", icon: Settings, label: "Settings", roles: ["ADMIN"] },
]

const sidebarVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
}

const linkVariants = {
  hidden: { x: -8, opacity: 0 },
  visible: { x: 0, opacity: 1 },
}

export function Sidebar({ role, unreadCount = 0 }: { role: string; unreadCount?: number }) {
  const pathname = usePathname()
  const filtered = navLinks.filter(l => l.roles.includes(role))

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className="w-64 border-r border-border bg-sidebar hidden md:flex flex-col h-full"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center glow-primary">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="font-bold text-foreground tracking-tight">GoalTracker</span>
            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Enterprise</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
        <div className="px-2 mb-3">
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
            {role === "EMPLOYEE" ? "Workspace" : role === "MANAGER" ? "Management" : "Administration"}
          </span>
        </div>

        {filtered.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))
          const badgeCount = link.href === "/dashboard/notifications" ? unreadCount : 0

          return (
            <motion.div key={link.href} variants={linkVariants}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20 shadow-sm"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1">{link.label}</span>
                {badgeCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3 h-3 text-primary/60 ml-auto shrink-0" />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-muted/40">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          <span className="text-xs text-muted-foreground">Q3 2026 Active Cycle</span>
        </div>
      </div>
    </motion.div>
  )
}