"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Computer, ComputerStatus } from "@/lib/types";
import { Search, Plus, Computer as ComputerIcon, X, Trash2, Pencil, Wifi, WifiOff, Wrench } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const statusConfig: Record<ComputerStatus, { label: string; badge: string; icon: any; ring: string }> = {
  online: {
    label: "Online",
    badge: "bg-emerald-500/10 text-emerald-400",
    icon: Wifi,
    ring: "ring-emerald-500/20",
  },
  offline: {
    label: "Offline",
    badge: "bg-slate-500/10 text-slate-400",
    icon: WifiOff,
    ring: "ring-slate-500/20",
  },
  maintenance: {
    label: "Maintenance",
    badge: "bg-amber-500/10 text-amber-400",
    icon: Wrench,
    ring: "ring-amber-500/20",
  },
};

export default function ComputersPage() {
  const supabase = createClient();
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Computer | null>(null);
  const [form, setForm] = useState({
    hostname: "",
    location: "",
    status: "offline" as ComputerStatus,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadComputers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("computers")
      .select("*")
      .order("hostname", { ascending: true });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setComputers((data as unknown as Computer[]) ?? []);
    setLoading(false);
  }, [supabase, statusFilter]);

  useEffect(() => {
    loadComputers();
  }, [loadComputers]);

  const filtered = computers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.hostname.toLowerCase().includes(q) ||
      (c.location ?? "").toLowerCase().includes(q)
    );
  });

  function openAdd() {
    setEditing(null);
    setForm({ hostname: "", location: "", status: "offline" });
    setError("");
    setShowModal(true);
  }

  function openEdit(computer: Computer) {
    setEditing(computer);
    setForm({
      hostname: computer.hostname,
      location: computer.location ?? "",
      status: computer.status,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      hostname: form.hostname,
      location: form.location || null,
      status: form.status,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from("computers")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("computers").insert(payload);
        if (error) throw error;
      }

      setShowModal(false);
      await loadComputers();
    } catch (err: any) {
      setError(err.message ?? "Failed to save computer");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(computer: Computer) {
    if (!confirm(`Delete ${computer.hostname}? This cannot be undone.`)) return;
    const { error } = await supabase.from("computers").delete().eq("id", computer.id);
    if (error) {
      alert(error.message);
      return;
    }
    await loadComputers();
  }

  const counts = computers.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-white lg:text-3xl">
            Computers
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Lab computers and their real-time status
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary shrink-0">
          <Plus className="h-4 w-4" />
          Add Computer
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: "80ms" }}>
        {(["online", "offline", "maintenance"] as ComputerStatus[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <div
              key={status}
              className={`card flex items-center gap-3 p-4 ring-1 ${config.ring}`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.badge}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-white">
                  {counts[status] ?? 0}
                </p>
                <p className="text-xs text-slate-500">{config.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row animate-slide-up" style={{ animationDelay: "160ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hostname or location..."
            className="input-field pl-11"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field sm:w-44"
        >
          <option value="all">All statuses</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Grid */}
      <div className="animate-slide-up" style={{ animationDelay: "240ms" }}>
        {loading ? (
          <div className="flex h-48 items-center justify-center card">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2F5FDE]/30 border-t-[#2F5FDE]" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((computer) => {
              const config = statusConfig[computer.status];
              const Icon = config.icon;
              return (
                <div
                  key={computer.id}
                  className="card card-hover group p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.badge} ring-1 ${config.ring}`}>
                        <ComputerIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-white">
                          {computer.hostname}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {computer.location ?? "No location set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(computer)}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-[#2A3550] hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(computer)}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`badge ${config.badge}`}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </span>
                    {computer.last_seen && (
                      <span className="text-xs text-slate-600">
                        {formatDateTime(computer.last_seen)}
                      </span>
                    )}
                  </div>

                  {computer.os_info && (
                    <p className="mt-3 truncate border-t border-[#2A3550] pt-3 text-xs text-slate-500">
                      {computer.os_info}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card flex h-48 flex-col items-center justify-center px-5 text-center">
            <ComputerIcon className="h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">
              {search || statusFilter !== "all"
                ? "No computers match your filters"
                : "No computers registered yet"}
            </p>
            {!search && statusFilter === "all" && (
              <button onClick={openAdd} className="mt-4 btn-secondary text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add your first computer
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#2A3550] bg-[#131C31] p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">
                {editing ? "Edit Computer" : "Add Computer"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Hostname
                </label>
                <input
                  type="text"
                  value={form.hostname}
                  onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                  placeholder="LAB-PC-01"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Room A, Seat 3"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as ComputerStatus })
                  }
                  className="input-field"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : editing ? (
                    "Save Changes"
                  ) : (
                    "Add Computer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
