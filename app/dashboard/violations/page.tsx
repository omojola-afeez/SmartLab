"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Violation, ViolationSeverity } from "@/lib/types";
import { Search, TriangleAlert as AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const severityStyles: Record<ViolationSeverity, { badge: string; dot: string; icon: string }> = {
  critical: {
    badge: "bg-red-500/10 text-red-400",
    dot: "bg-red-400",
    icon: "bg-red-500/10 text-red-400",
  },
  warning: {
    badge: "bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    icon: "bg-amber-500/10 text-amber-400",
  },
  info: {
    badge: "bg-sky-500/10 text-sky-400",
    dot: "bg-sky-400",
    icon: "bg-sky-500/10 text-sky-400",
  },
};

const PAGE_SIZE = 20;

export default function ViolationsPage() {
  const supabase = createClient();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const loadViolations = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("violations")
      .select(
        "id, student_id, computer_id, session_id, type, description, severity, created_at, students(full_name, student_number), computers(hostname)"
      )
      .order("created_at", { ascending: false });

    if (severityFilter !== "all") {
      query = query.eq("severity", severityFilter);
    }

    const { data } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setViolations((data as unknown as Violation[]) ?? []);
    setLoading(false);
  }, [supabase, severityFilter, page]);

  useEffect(() => {
    loadViolations();
  }, [loadViolations]);

  useEffect(() => {
    setPage(0);
  }, [severityFilter]);

  const filtered = violations.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (v.students?.full_name ?? "").toLowerCase().includes(q) ||
      (v.students?.student_number ?? "").toLowerCase().includes(q) ||
      v.type.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      (v.computers?.hostname ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="font-display text-2xl font-bold text-white lg:text-3xl">
          Violations
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Policy violations detected by the monitoring agent
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row animate-slide-up" style={{ animationDelay: "80ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, type, or computer..."
            className="input-field pl-11"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="input-field sm:w-44"
        >
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      <div className="space-y-3 animate-slide-up" style={{ animationDelay: "160ms" }}>
        {loading ? (
          <div className="flex h-48 items-center justify-center card">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2F5FDE]/30 border-t-[#2F5FDE]" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((violation) => {
            const styles = severityStyles[violation.severity];
            return (
              <div
                key={violation.id}
                className="card card-hover flex items-start gap-4 p-4"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {violation.students?.full_name ?? "Unknown student"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {violation.students?.student_number ?? ""}
                    </span>
                    <span className={`badge capitalize ${styles.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                      {violation.severity}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-300">
                    <span className="font-medium text-slate-200">{violation.type}</span>
                    {" — "}
                    {violation.description}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {violation.computers?.hostname ?? "Unknown PC"} · {formatDateTime(violation.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card flex h-48 flex-col items-center justify-center px-5 text-center">
            <AlertTriangle className="h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">
              {search || severityFilter !== "all"
                ? "No violations match your filters"
                : "No violations recorded"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Violations appear here when the agent detects policy breaches
            </p>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">Page {page + 1}</p>
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
