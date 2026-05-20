import { auth, signOut } from "@/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Bell, User, UserCheck, ShieldAlert, RefreshCcw } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { loginWithEmail } from "@/app/actions/auth-actions"

const roleBadgeStyles: Record<string, string> = {
  EMPLOYEE: "bg-cyan/10 text-cyan border-cyan/20",
  MANAGER: "bg-primary/10 text-primary border-primary/20",
  ADMIN: "bg-warning/10 text-warning border-warning/20",
}

function RoleSwitcher() {
  const isDemo = process.env.DEMO_MODE === "true" || process.env.NODE_ENV === "development"
  if (!isDemo) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border hover:bg-muted/80 transition-colors outline-none text-xs font-semibold text-muted-foreground">
        <RefreshCcw className="w-3 h-3" />
        Switch Role
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 bg-popover border-border" align="end">
        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Demo Accounts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={async () => { "use server"; await loginWithEmail("employee@demo.com") }}>
            <DropdownMenuItem nativeButton={true} render={<button type="submit" className="w-full flex items-center gap-2 cursor-pointer" />}>
                <User className="w-3.5 h-3.5" /> Employee
            </DropdownMenuItem>
        </form>
        <form action={async () => { "use server"; await loginWithEmail("manager@demo.com") }}>
            <DropdownMenuItem nativeButton={true} render={<button type="submit" className="w-full flex items-center gap-2 cursor-pointer" />}>
                <UserCheck className="w-3.5 h-3.5" /> Manager
            </DropdownMenuItem>
        </form>
        <form action={async () => { "use server"; await loginWithEmail("admin@demo.com") }}>
            <DropdownMenuItem nativeButton={true} render={<button type="submit" className="w-full flex items-center gap-2 cursor-pointer" />}>
                <ShieldAlert className="w-3.5 h-3.5" /> Admin
            </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export async function Topbar() {
  const session = await auth()
  const role = session?.user?.role || "EMPLOYEE"

  const unreadCount = session?.user?.id
    ? await prisma.notification.count({ where: { userId: session.user.id, read: false } })
    : 0

  const initials = session?.user?.name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <div className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      {/* Left: subtle breadcrumb placeholder */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-foreground font-semibold text-sm">GoalTracker</span>
      </div>

      {/* Right: actions + user */}
      <div className="flex items-center gap-3">
        {/* Role Switcher for Demo */}
        <RoleSwitcher />

        {/* Notification bell */}
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
          )}
        </Link>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-muted transition-colors outline-none">
            <Avatar className="h-7 w-7 border border-border">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-foreground leading-none">{session?.user?.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">{role.toLowerCase()}</div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 bg-popover border-border" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-sm">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground font-normal">{session?.user?.email}</p>
                <span className={`text-[10px] mt-1 inline-flex w-fit px-2 py-0.5 rounded-full border font-semibold ${roleBadgeStyles[role] || ""}`}>
                  {role}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/notifications" className="flex items-center gap-2 cursor-pointer w-full h-full" />}>
              <Bell className="w-4 h-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto text-xs bg-primary text-white rounded-full px-1.5 py-0.5 font-bold">{unreadCount}</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={async () => {
              "use server"
              const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
              await signOut({ redirectTo: `${baseUrl}/login` })
            }}>
              <button className="w-full relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
