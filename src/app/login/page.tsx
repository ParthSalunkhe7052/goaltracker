"use client"

import { loginWithEmail } from "@/app/actions/auth-actions"
import { User, UserCheck, ShieldAlert, Loader2, Zap, ArrowRight } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"

const demoAccounts = [
  {
    email: "employee@demo.com",
    type: "employee",
    name: "Jordan Kim",
    role: "Software Engineer",
    description: "Create & track personal goals, submit check-ins",
    icon: User,
    accent: "from-cyan/20 to-cyan/5 border-cyan/20 hover:border-cyan/40",
    iconBg: "bg-cyan/10 text-cyan",
  },
  {
    email: "manager@demo.com",
    type: "manager",
    name: "Alex Rivera",
    role: "Engineering Manager",
    description: "Approve goals, view team progress, add comments",
    icon: UserCheck,
    accent: "from-primary/20 to-primary/5 border-primary/20 hover:border-primary/40",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    email: "admin@demo.com",
    type: "admin",
    name: "Sarah Chen",
    role: "HR & Operations",
    description: "Org analytics, audit logs, cycle management",
    icon: ShieldAlert,
    accent: "from-warning/20 to-warning/5 border-warning/20 hover:border-warning/40",
    iconBg: "bg-warning/10 text-warning",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}
const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, damping: 20 } },
}

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleLogin = async (email: string, type: string) => {
    setLoading(type)
    try {
      await loginWithEmail(email)
    } catch (error) {
      toast.error("Failed to sign in. Please try again.")
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan/5 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #1e2d45 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.4 }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-4 glow-primary">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">GoalTracker</h1>
          <p className="text-muted-foreground mt-2 text-sm">Enterprise Goal Performance &amp; Analytics</p>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-4">
            Select a demo account to continue
          </p>
          {demoAccounts.map((account) => {
            const Icon = account.icon
            const isLoading = loading === account.type
            return (
              <motion.div key={account.type} variants={item}>
                <button
                  onClick={() => handleLogin(account.email, account.type)}
                  disabled={!!loading}
                  className={`w-full text-left p-4 rounded-2xl border bg-gradient-to-br transition-all duration-200 ${account.accent} ${!!loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"} group`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${account.iconBg} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{account.name}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{account.role}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{account.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{account.email}</p>
                    </div>
                    <div className="shrink-0">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />}
                    </div>
                  </div>
                </button>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 text-center text-xs text-muted-foreground/50">
          Demo environment · No password required
        </motion.p>
      </motion.div>
    </div>
  )
}
