"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LabSession, SessionStatus } from "@/lib/types";
import { Search, Monitor, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime, formatDuration } from "@/lib/utils";

const statusStyles: Record<SessionStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  closed: "bg-slate-500/10 text-slate-400",
  terminated: "bg-red-500/10 text-red-400",
};

const PAGE_SIZE = 20;

export default function SessionsPage() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("sessions")
      .select(
        "id, student_id, computer_id, login_at, logout_at, duration_minutes, status, created_at, students(full_name, student_number), computers(hostname, location)"
      )
      .order("login_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setSessions((data as unknown as LabSession[]) ?? []);
    setLoading(false);
  }, [supabase, statusFilter, page]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const filtered = sessions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.students?.full_name ?? "").toLowerCase().includes(q) ||
      (s.students?.student_number ?? "").toLowerCase().includes(q) ||
      (s.computers?.hostname ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="font-display text-2xl font-bold text-white lg:text-3xl">
          Sessions
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Student login sessions on lab computers
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row animate-slide-up" style={{ animationDelay: "80ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or computer..."
            className="input-field pl-11"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field sm:w-44"
        >
          <option value="all">All sessions</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: "160ms" }}>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2F5FDE]/30 border-t-[#2F5FDE]" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A3550] text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Computer</th>
                  <th className="px-5 py-3 font-medium">Login Time</th>
                  <th className="px-5 py-3 font-medium">Logout Time</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3550]">
                {filtered.map((session) => (
                  <tr
                    key={session.id}
                    className="group transition-colors hover:bg-[#1A2440]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2F5FDE]/10 text-[#5B8DEF]">
                          <Monitor className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {session.students?.full_name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {session.students?.student_number ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">
                      {session.computers?.hostname ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">
                      {formatDateTime(session.login_at)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">
                      {session.logout_at ? formatDateTime(session.logout_at) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">
                      {formatDuration(session.duration_minutes)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge capitalize ${statusStyles[session.status]}`}>
                        {session.status === "active" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                        )}
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center px-5 text-center">
            <Clock className="h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">
              {search || statusFilter !== "all"
                ? "No sessions match your filters"
                : "No sessions recorded yet"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Sessions appear here when the Windows agent reports student logins
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Page {page + 1}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary px-3 py-2 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={filtered.length < PAGE_SIZE}
              className="btn-secondary px-3 py-2 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
