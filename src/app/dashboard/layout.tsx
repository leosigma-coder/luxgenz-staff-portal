"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface Session {
  userId: number;
  username: string;
  role: "owner" | "admin" | "staff";
  staffRole: string;
}

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  priority: string;
  is_read: number;
  created_at: string;
}

const NAV_ITEMS = [
  {
    href: "/dashboard/overview",
    label: "Overview",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Accounts",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="6" height="6" rx="1" />
        <path d="m3 17 2 2 4-4" />
        <path d="M13 6h8" />
        <path d="M13 12h8" />
        <path d="M13 18h8" />
      </svg>
    ),
  },
  {
    href: "/dashboard/updates",
    label: "Updates",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
        <line x1="10" x2="8" y1="9" y2="9" />
      </svg>
    ),
  },
  {
    href: "/dashboard/events",
    label: "Events",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/docs",
    label: "Docs",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M8 7h6" />
        <path d="M8 11h8" />
      </svg>
    ),
  },
  {
    href: "/dashboard/logs",
    label: "Audit Logs",
    adminOnly: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
      </svg>
    ),
  },
];

const CMD_PAGES = [
  { label: "Overview", href: "/dashboard/overview", keywords: "home dashboard stats server" },
  { label: "Accounts", href: "/dashboard", keywords: "users staff members" },
  { label: "Tasks", href: "/dashboard/tasks", keywords: "assignments todo work" },
  { label: "Updates", href: "/dashboard/updates", keywords: "announcements changelog" },
  { label: "Events", href: "/dashboard/events", keywords: "calendar schedule" },
  { label: "Docs", href: "/dashboard/docs", keywords: "wiki rules commands procedures" },
  { label: "Audit Logs", href: "/dashboard/logs", keywords: "history activity tracking" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [cmdSearch, setCmdSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkSession() {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setSession(data.user);
      setLoading(false);
    }
    checkSession();
  }, [router]);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session, fetchNotifications]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowCmdPalette((v) => !v);
        setCmdSearch("");
      }
      if (e.key === "Escape") {
        setShowCmdPalette(false);
        setShowNotifications(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    fetchNotifications();
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.is_read) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      fetchNotifications();
    }
    if (n.link) {
      router.push(n.link);
      setShowNotifications(false);
    }
  };

  const filteredCmds = CMD_PAGES.filter(
    (p) =>
      !cmdSearch ||
      p.label.toLowerCase().includes(cmdSearch.toLowerCase()) ||
      p.keywords.toLowerCase().includes(cmdSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col items-center border-r border-slate-700/50 bg-slate-900/80 py-6 backdrop-blur-md">
        {/* Logo */}
        <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-lg">
          LG
        </div>

        {/* Nav Icons */}
        <nav className="flex flex-1 flex-col items-center gap-2">
          {NAV_ITEMS.filter((item) => !("adminOnly" in item && item.adminOnly) || (session && session.role !== "staff")).map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-violet-600/20 text-violet-400 shadow-lg shadow-violet-500/10"
                    : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                {item.icon}
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-slate-700/50">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-2 h-px w-6 bg-slate-700/50" />

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="group relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-slate-700/50">
              Notifications
            </span>
          </button>

          {/* Command Palette Trigger */}
          <button
            onClick={() => { setShowCmdPalette(true); setCmdSearch(""); }}
            className="group relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-slate-700/50">
              Search (Ctrl+K)
            </span>
          </button>
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="group relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-slate-700/50">
            Sign Out
          </span>
        </button>
      </aside>

      {/* Notification Panel */}
      {showNotifications && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)} />
          <div className="fixed left-[72px] top-0 z-50 h-screen w-80 border-r border-slate-700/50 bg-slate-900/95 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
              <h3 className="font-semibold text-slate-100">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-violet-400 hover:text-violet-300 transition"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const priorityDot =
                    n.priority === "critical" ? "bg-red-500" :
                    n.priority === "warning" ? "bg-amber-500" :
                    "bg-violet-500";
                  const priorityBg =
                    n.priority === "critical" ? "bg-red-500/5 border-l-2 border-l-red-500/40" :
                    n.priority === "warning" ? "bg-amber-500/5 border-l-2 border-l-amber-500/40" :
                    !n.is_read ? "bg-violet-500/5" : "";
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-800/50 transition hover:bg-slate-800/50 ${priorityBg}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && (
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDot}`} />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-medium ${n.is_read ? "text-slate-400" : "text-white"}`}>
                              {n.title}
                            </p>
                            {n.priority === "critical" && (
                              <span className="rounded bg-red-500/20 px-1 py-0.5 text-[8px] font-bold uppercase text-red-400">critical</span>
                            )}
                            {n.priority === "warning" && (
                              <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-400">warning</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{n.message}</p>
                          <p className="mt-0.5 text-[10px] text-slate-600">
                            {new Date(n.created_at + "Z").toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Command Palette */}
      {showCmdPalette && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm" onClick={() => setShowCmdPalette(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-700/50 px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                autoFocus
                type="text"
                value={cmdSearch}
                onChange={(e) => setCmdSearch(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                placeholder="Search pages..."
              />
              <kbd className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">ESC</kbd>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {filteredCmds.map((cmd) => (
                <button
                  key={cmd.href}
                  onClick={() => {
                    router.push(cmd.href);
                    setShowCmdPalette(false);
                  }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-700/50 hover:text-white"
                >
                  <span className="text-slate-500">Go to</span>
                  <span className="font-medium">{cmd.label}</span>
                </button>
              ))}
              {filteredCmds.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-slate-500">No results found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[70] rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2 ${
          toast.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <main className="ml-[72px] flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
