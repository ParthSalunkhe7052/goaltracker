"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts"

const COLORS = {
  DRAFT: "#64748b",
  SUBMITTED: "#f59e0b",
  APPROVED: "#10b981",
  LOCKED: "#6366f1",
  primary: "#6366f1",
  cyan: "#06b6d4",
  emerald: "#10b981",
  warning: "#f59e0b",
}

const tooltipStyle = {
  backgroundColor: "#161b27",
  border: "1px solid #1e2d45",
  borderRadius: "12px",
  color: "#f1f5f9",
  fontSize: 12,
}

type Stats = {
  statusCounts: Record<string, number>
  quarterlyAvg: Record<string, number>
  teamData?: { name: string; approved: number; submitted: number; draft: number }[]
}

export function AnalyticsCharts({ stats }: { stats: Stats }) {
  const goalDist = [
    { name: "Draft", value: stats.statusCounts.DRAFT || 0, color: COLORS.DRAFT },
    { name: "Submitted", value: stats.statusCounts.SUBMITTED || 0, color: COLORS.SUBMITTED },
    { name: "Approved", value: stats.statusCounts.APPROVED || 0, color: COLORS.APPROVED },
    { name: "Locked", value: stats.statusCounts.LOCKED || 0, color: COLORS.LOCKED },
  ].filter(d => d.value > 0)

  const quarterlyTrend = [
    { name: "Q1", avg: stats.quarterlyAvg.Q1 || 0 },
    { name: "Q2", avg: stats.quarterlyAvg.Q2 || 0 },
    { name: "Q3", avg: stats.quarterlyAvg.Q3 || 0 },
    { name: "Q4", avg: stats.quarterlyAvg.Q4 || 0 },
  ]

  const teamBarData = stats.teamData || []

  const total = goalDist.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Donut chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Goal Status Distribution</CardTitle>
            <CardDescription className="text-xs">Organization-wide goal lifecycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={goalDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {goalDist.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#f1f5f9" }} />
                  <Legend
                    formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 flex-wrap">
              {goalDist.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-muted-foreground">{d.name}: <strong className="text-foreground">{d.value}</strong></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* QoQ Line chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Quarterly Progress Trends</CardTitle>
            <CardDescription className="text-xs">Average completion % across check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quarterlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Avg Progress"]} />
                  <Line
                    type="monotone" dataKey="avg" stroke={COLORS.primary}
                    strokeWidth={2.5} dot={{ r: 5, fill: COLORS.primary, strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: COLORS.cyan }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team bar chart */}
      {teamBarData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Team Goal Status Breakdown</CardTitle>
            <CardDescription className="text-xs">Goals by status per team member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1e2535" }} />
                  <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
                  <Bar dataKey="approved" name="Approved" fill={COLORS.APPROVED} radius={[3, 3, 0, 0]} stackId="a" />
                  <Bar dataKey="submitted" name="Submitted" fill={COLORS.SUBMITTED} radius={[3, 3, 0, 0]} stackId="a" />
                  <Bar dataKey="draft" name="Draft" fill={COLORS.DRAFT} radius={[3, 3, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border text-center p-4">
          <div className="text-3xl font-bold gradient-text">{total}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Goals Tracked</div>
        </Card>
        <Card className="bg-card border-border text-center p-4">
          <div className="text-3xl font-bold text-emerald">{stats.statusCounts.APPROVED || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Manager Approved</div>
        </Card>
        <Card className="bg-card border-border text-center p-4">
          <div className="text-3xl font-bold text-primary">{stats.statusCounts.LOCKED || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Cycle Locked</div>
        </Card>
      </div>
    </div>
  )
}
