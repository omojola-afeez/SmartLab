import { createClient } from "@/lib/supabase/server";
import { Users, Monitor, TriangleAlert as AlertTriangle, Computer, TrendingUp, Activity, Clock } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardOverview() {
  const supabase = createClient();

  const [sessionsResult, studentsResult, violationsResult, computersResult, recentSessions, recentViolations] = await Promise.all([
    supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("violations").select("*", { count: "exact", head: true }).gte("created_at", new Date().toISOString().split("T")[0]),
    supabase.from("computers").select("*", { count: "exact", head: true }).eq("status", "online"),
    supabase
      .from("sessions")
      .select("id, login_at, status, students(full_name, student_number), computers(hostname)")
      .order("login_at", { ascending: false })
      .limit(5),
    supabase
      .from("violations")
      .select("id, type, description, severity, created_at, students(full_name, student_number), computers(hostname)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const activeSessions = sessionsResult.count ?? 0;
  const totalStudents = studentsResult.count ?? 0;
  const violationsToday = violationsResult.count ?? 0;
  const onlineComputers = computersResult.count ?? 0;

  const stats = [
    {
      label: "Active Sessions",
      value: activeSessions,
      icon: Monitor,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      ring: "ring-emerald-500/20",
    },
    {
      label: "Registered Students",
      value: totalStudents,
      icon: Users,
      color: "text-[#5B8DEF]",
      bg: "bg-[#2F5FDE]/10",
      ring: "ring-[#2F5FDE]/20",
    },
    {
      label: "Violations Today",
      value: violationsToday,
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      ring: "ring-amber-500/20",
    },
    {
      label: "Computers Online",
      value: onlineComputers,
      icon: Computer,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      ring: "ring-cyan-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <h1 className="font-display text-2xl font-bold text-white lg:text-3xl">
          Lab Overview
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Real-time status of your computer lab
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`card card-hover p-5 animate-slide-up`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="mt-2 font-display text-3xl font-bold text-white">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} ${stat.color} ring-1 ${stat.ring}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent sessions */}
        <div className="card animate-slide-up" style={{ animationDelay: "320ms" }}>
          <div className="flex items-center justify-between border-b border-[#2A3550] px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-500" />
              <h2 className="font-display text-base font-semibold text-white">
                Recent Sessions
              </h2>
            </div>
            <Link
              href="/dashboard/sessions"
              className="text-xs font-medium text-[#5B8DEF] transition-colors hover:text-[#2F5FDE]"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#2A3550]">
            {recentSessions.data && recentSessions.data.length > 0 ? (
              recentSessions.data.map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#1A2440]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2F5FDE]/10 text-[#5B8DEF]">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {session.students?.full_name ?? "Unknown student"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {session.computers?.hostname ?? "Unknown PC"} · {formatDistanceToNow(session.login_at)}
                    </p>
                  </div>
                  {session.status === "active" && (
                    <span className="badge bg-emerald-500/10 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                      Active
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center">
                <Clock className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-3 text-sm text-slate-500">No sessions yet</p>
                <p className="mt-1 text-xs text-slate-600">
                  Sessions appear here when the Windows agent reports logins
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent violations */}
        <div className="card animate-slide-up" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center justify-between border-b border-[#2A3550] px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-slate-500" />
              <h2 className="font-display text-base font-semibold text-white">
                Recent Violations
              </h2>
            </div>
            <Link
              href="/dashboard/violations"
              className="text-xs font-medium text-[#5B8DEF] transition-colors hover:text-[#2F5FDE]"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#2A3550]">
            {recentViolations.data && recentViolations.data.length > 0 ? (
              recentViolations.data.map((violation: any) => (
                <div
                  key={violation.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#1A2440]"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      violation.severity === "critical"
                        ? "bg-red-500/10 text-red-400"
                        : violation.severity === "warning"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-sky-500/10 text-sky-400"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {violation.students?.full_name ?? "Unknown student"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {violation.type} · {formatDistanceToNow(violation.created_at)}
                    </p>
                  </div>
                  <span
                    className={`badge capitalize ${
                      violation.severity === "critical"
                        ? "bg-red-500/10 text-red-400"
                        : violation.severity === "warning"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-sky-500/10 text-sky-400"
                    }`}
                  >
                    {violation.severity}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-3 text-sm text-slate-500">No violations recorded</p>
                <p className="mt-1 text-xs text-slate-600">
                  Violations appear here when the agent detects policy breaches
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
