"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AdminProfile } from "@/lib/types";
import { LayoutDashboard, Users, Monitor, TriangleAlert as AlertTriangle, Computer, LogOut, Menu, X, ChevronDown } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Students", icon: Users },
  { href: "/dashboard/sessions", label: "Sessions", icon: Monitor },
  { href: "/dashboard/violations", label: "Violations", icon: AlertTriangle },
  { href: "/dashboard/computers", label: "Computers", icon: Computer },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(data as unknown as AdminProfile | null);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2F5FDE]/30 border-t-[#2F5FDE]" />
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#2A3550] bg-[#0E1628] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#2A3550] px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2F5FDE]">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-white">
              SmartLab
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#2F5FDE]/15 text-[#5B8DEF]"
                    : "text-slate-400 hover:bg-[#1A2440] hover:text-slate-200"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active
                      ? "text-[#5B8DEF]"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5B8DEF] animate-pulse-dot" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#2A3550] p-3">
          <div className="relative">
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-[#2A3550] bg-[#131C31] p-1 shadow-xl animate-fade-in">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-[#1A2440] hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[#1A2440]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2F5FDE] to-[#2650C4] text-sm font-semibold text-white">
                {profile?.full_name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {profile?.full_name ?? "Unknown"}
                </p>
                <p className="truncate text-xs capitalize text-slate-500">
                  {profile?.role ?? "teacher"}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[#2A3550] bg-[#0B1120]/80 px-4 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-display text-lg font-bold text-white">
            SmartLab
          </span>
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-4 lg:p-8 lg:min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
