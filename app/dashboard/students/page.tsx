"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student, StudentStatus } from "@/lib/types";
import { Search, Plus, Users, X, Trash2, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";

const statusStyles: Record<StudentStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  suspended: "bg-red-500/10 text-red-400",
  inactive: "bg-slate-500/10 text-slate-400",
};

export default function StudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({
    student_number: "",
    full_name: "",
    course: "",
    year_level: "1",
    status: "active" as StudentStatus,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadStudents = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setStudents((data as unknown as Student[]) ?? []);
    setLoading(false);
  }, [supabase, statusFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.student_number.toLowerCase().includes(q) ||
      (s.course ?? "").toLowerCase().includes(q)
    );
  });

  function openAdd() {
    setEditing(null);
    setForm({
      student_number: "",
      full_name: "",
      course: "",
      year_level: "1",
      status: "active",
    });
    setError("");
    setShowModal(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    setForm({
      student_number: student.student_number,
      full_name: student.full_name,
      course: student.course ?? "",
      year_level: String(student.year_level),
      status: student.status,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      student_number: form.student_number,
      full_name: form.full_name,
      course: form.course || null,
      year_level: parseInt(form.year_level) || 1,
      status: form.status,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from("students")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("students").insert(payload);
        if (error) throw error;
      }

      setShowModal(false);
      await loadStudents();
    } catch (err: any) {
      setError(err.message ?? "Failed to save student");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(student: Student) {
    if (!confirm(`Delete ${student.full_name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("students").delete().eq("id", student.id);
    if (error) {
      alert(error.message);
      return;
    }
    await loadStudents();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-white lg:text-3xl">
            Students
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage registered lab users
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary shrink-0">
          <Plus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row animate-slide-up" style={{ animationDelay: "80ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or course..."
            className="input-field pl-11"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field sm:w-44"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
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
                  <th className="px-5 py-3 font-medium">ID Number</th>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Year</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Registered</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3550]">
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    className="group transition-colors hover:bg-[#1A2440]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2F5FDE] to-[#2650C4] text-sm font-semibold text-white">
                          {student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">
                          {student.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">
                      {student.student_number}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">
                      {student.course ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">
                      {student.year_level}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge capitalize ${statusStyles[student.status]}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {formatDate(student.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(student)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-[#2A3550] hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center px-5 text-center">
            <Users className="h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">
              {search || statusFilter !== "all"
                ? "No students match your filters"
                : "No students registered yet"}
            </p>
            {!search && statusFilter === "all" && (
              <button onClick={openAdd} className="mt-4 btn-secondary text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add your first student
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-center text-xs text-slate-600">
          Showing {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Modal */}
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
                {editing ? "Edit Student" : "Add Student"}
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
                  Student ID Number
                </label>
                <input
                  type="text"
                  value={form.student_number}
                  onChange={(e) => setForm({ ...form, student_number: e.target.value })}
                  placeholder="2024-0001"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Juan Dela Cruz"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Course
                </label>
                <input
                  type="text"
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  placeholder="BS Computer Science"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Year Level
                  </label>
                  <select
                    value={form.year_level}
                    onChange={(e) => setForm({ ...form, year_level: e.target.value })}
                    className="input-field"
                  >
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as StudentStatus })
                    }
                    className="input-field"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
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
                    "Add Student"
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
