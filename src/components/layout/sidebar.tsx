"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Target, Users, CheckSquare, BarChart3,
  Settings, FileText, Bell, Zap, ChevronRight, ClipboardList
} from "lucide-react"
import { cn, getActiveQuarterWindow } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useTransition, useState } from "react"
import { loginWithEmail } from "@/app/actions/auth-actions"


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
  const [isPending, startTransition] = useTransition()
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)

  const handleRoleSwitch = (email: string) => {
    const label = email.includes("employee") ? "Employee" : email.includes("manager") ? "Manager" : "Administrator"
    setSwitchingTo(label)
    startTransition(async () => {
      try {
        await loginWithEmail(email)
      } catch (e) {
        console.error(e)
        setSwitchingTo(null)
      }
    })
  }


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
      <div className="p-4 border-t border-border shrink-0 space-y-3">
        {/* Quick Switcher for Demo */}
        <div className="space-y-1.5 p-2 rounded-xl bg-muted/20 border border-border">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block text-center font-semibold">Demo Personas</span>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleRoleSwitch("employee@demo.com")}
              disabled={isPending}
              className={cn(
                "p-1.5 rounded-lg border text-[10px] font-medium flex flex-col items-center gap-1 transition-all cursor-pointer",
                role === "EMPLOYEE" ? "bg-cyan/10 border-cyan/35 text-cyan" : "border-transparent hover:bg-muted text-muted-foreground border-border/20"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              Emp
            </button>
            <button
              onClick={() => handleRoleSwitch("manager@demo.com")}
              disabled={isPending}
              className={cn(
                "p-1.5 rounded-lg border text-[10px] font-medium flex flex-col items-center gap-1 transition-all cursor-pointer",
                role === "MANAGER" ? "bg-primary/10 border-primary/35 text-primary" : "border-transparent hover:bg-muted text-muted-foreground border-border/20"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Mgr
            </button>
            <button
              onClick={() => handleRoleSwitch("admin@demo.com")}
              disabled={isPending}
              className={cn(
                "p-1.5 rounded-lg border text-[10px] font-medium flex flex-col items-center gap-1 transition-all cursor-pointer",
                role === "ADMIN" ? "bg-warning/10 border-warning/35 text-warning" : "border-transparent hover:bg-muted text-muted-foreground border-border/20"
              )}
            >
              <Settings className="w-3.5 h-3.5" />
              Adm
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-muted/40 justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          <span className="text-xs text-muted-foreground font-semibold">
            {(() => {
              const win = getActiveQuarterWindow()
              if (win === "GOAL_SETTING") return "Goal Setting Phase"
              if (win) return `${win} Check-in Phase`
              return "Q3 Check-in (Demo)"
            })()}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isPending && switchingTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[10000] flex flex-col items-center justify-center gap-4"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold text-foreground">Synchronizing Workspace</p>
              <p className="text-xs text-muted-foreground">Recalibrating to {switchingTo} Persona...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>


  )
}