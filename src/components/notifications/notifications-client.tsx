"use client"

import { useState, useTransition } from "react"
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/admin-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck, CheckCircle2, Target, Clock, AlertCircle, Zap } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: Date
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  GOAL_APPROVED: { icon: CheckCircle2, color: "text-emerald", bg: "bg-emerald/10 border-emerald/20" },
  GOAL_REJECTED: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  PENDING_APPROVAL: { icon: Clock, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
  CHECKIN_REMINDER: { icon: Target, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  SYSTEM: { icon: Zap, color: "text-cyan", bg: "bg-cyan/10 border-cyan/20" },
}

export function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications)
  const [pending, startTransition] = useTransition()

  const unreadCount = items.filter(n => !n.read).length

  function handleMarkRead(id: string) {
    startTransition(async () => {
      try {
        await markNotificationRead(id)
        setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      } catch (e: unknown) {
        toast.error((e as Error).message)
      }
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      try {
        await markAllNotificationsRead()
        setItems(prev => prev.map(n => ({ ...n, read: true })))
        toast.success("All notifications marked as read")
      } catch (e: unknown) {
        toast.error((e as Error).message)
      }
    })
  }

  if (items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border border-dashed border-border rounded-2xl">
        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-base font-semibold text-foreground">No notifications</h3>
        <p className="text-sm text-muted-foreground mt-1">You&apos;re all caught up!</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-primary">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleMarkAllRead} disabled={pending} className="gap-2 text-xs border-primary/20 hover:bg-primary/10">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {items.map(notification => {
          const config = typeConfig[notification.type] || typeConfig.SYSTEM
          const Icon = config.icon

          return (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl border transition-all",
                notification.read
                  ? "bg-card border-border opacity-60"
                  : "bg-card border-border shadow-sm"
              )}
            >
              <div className={cn("p-2.5 rounded-xl border shrink-0", config.bg)}>
                <Icon className={cn("w-4 h-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm leading-relaxed", notification.read ? "text-muted-foreground" : "text-foreground font-medium")}>
                  {notification.message}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {!notification.read && (
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">New</Badge>
                  )}
                </div>
              </div>
              {!notification.read && (
                <Button size="sm" variant="ghost" onClick={() => handleMarkRead(notification.id)} disabled={pending} className="shrink-0 text-xs text-muted-foreground hover:text-foreground h-7 px-2">
                  Mark read
                </Button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
