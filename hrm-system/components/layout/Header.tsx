"use client";

import { useApiCall } from "@/lib/hooks/client";
import { useRouter } from "next/navigation";
import { LogOut, Bell, Search, User as UserIcon, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/components/ui";

interface HeaderProps {
  profile: {
    full_name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export default function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPrivileged = profile?.role === "admin" || profile?.role === "super_admin";
  const roleLabel =
    profile?.role === "super_admin" ? "Super admin" : profile?.role === "admin" ? "Admin" : "Employee";

  const initials = (profile?.full_name ?? "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "—";

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      await callApi("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/employees?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-16",
        "bg-surface-canvas/80 backdrop-blur-md",
        "border-b border-line-subtle",
      )}
    >
      <div className="h-full flex items-center justify-between pl-5 pr-4">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div
            className={cn(
              "w-7 h-7 rounded-sm flex items-center justify-center shrink-0",
              "bg-ink-primary text-white",
              "transition-transform duration-base ease-out-expo group-hover:scale-[1.03]",
            )}
          >
            <span className="text-[10px] font-semibold tracking-[0.02em]">TAG</span>
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-[13px] font-medium text-ink-primary tracking-[-0.005em]">TAG Solutions</span>
            <span className="text-[10px] text-ink-tertiary font-mono tracking-wide uppercase">HRM</span>
          </div>
        </Link>

        {/* Right rail */}
        <div className="flex items-center gap-1.5">
          {/* Search — command palette trigger style */}
          {isPrivileged && (
            <div className="relative">
              {showSearch ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search employees…"
                    autoFocus
                    onBlur={() => setTimeout(() => setShowSearch(false), 150)}
                    className={cn(
                      "h-8 px-3 w-72 text-[13px] rounded-sm",
                      "bg-surface-raised border border-line text-ink-primary",
                      "placeholder:text-ink-quaternary",
                      "focus:outline-none focus:border-accent focus:shadow-focus",
                      "transition-shadow duration-base",
                    )}
                  />
                </form>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className={cn(
                    "flex items-center gap-2 h-8 pl-2.5 pr-1.5 rounded-sm",
                    "bg-surface-sunken border border-line-subtle",
                    "text-ink-tertiary hover:text-ink-primary hover:border-line",
                    "transition-colors duration-base ease-out-expo",
                  )}
                  aria-label="Search"
                >
                  <Search className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span className="text-[12px] hidden md:inline">Search employees</span>
                  <span className="hidden md:inline-flex items-center gap-0.5 ml-3 px-1.5 py-0.5 rounded-xs bg-surface-raised border border-line-subtle text-[10px] font-mono text-ink-quaternary">
                    <span className="text-[11px] leading-none">⌘</span>K
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Notifications */}
          <Link
            href="/notifications"
            aria-label="Notifications"
            className={cn(
              "relative w-8 h-8 flex items-center justify-center rounded-sm",
              "text-ink-tertiary hover:text-ink-primary hover:bg-surface-muted",
              "transition-colors duration-base ease-out-expo",
            )}
          >
            <Bell className="w-4 h-4" strokeWidth={1.75} />
          </Link>

          <span className="w-px h-5 bg-line-subtle mx-1" aria-hidden />

          {/* Profile menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "flex items-center gap-2.5 h-9 pl-1.5 pr-2 rounded-sm",
                "hover:bg-surface-muted transition-colors duration-base",
                menuOpen && "bg-surface-muted",
              )}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span
                className={cn(
                  "w-7 h-7 rounded-sm flex items-center justify-center shrink-0",
                  "bg-surface-sunken border border-line-subtle",
                  "text-[11px] font-medium text-ink-secondary tracking-wide",
                )}
              >
                {initials}
              </span>
              <div className="hidden md:flex flex-col leading-tight text-left">
                <span className="text-[12px] text-ink-primary font-medium truncate max-w-[140px]">
                  {profile?.full_name ?? "—"}
                </span>
                <span className="text-[10px] text-ink-tertiary font-mono uppercase tracking-wide">
                  {roleLabel}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-ink-tertiary hidden md:block",
                  "transition-transform duration-base",
                  menuOpen && "rotate-180",
                )}
                strokeWidth={1.75}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className={cn(
                  "absolute right-0 top-full mt-2 w-60 py-1.5",
                  "bg-surface-raised border border-line-subtle rounded-md shadow-e3",
                  "overflow-hidden",
                )}
              >
                <div className="px-3 py-2.5 border-b border-line-subtle">
                  <div className="text-[13px] text-ink-primary font-medium truncate">
                    {profile?.full_name ?? "—"}
                  </div>
                  {profile?.email && (
                    <div className="text-[11px] text-ink-tertiary font-mono truncate">
                      {profile.email}
                    </div>
                  )}
                  <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-surface-sunken border border-line-subtle">
                    <span className="text-[9px] font-mono uppercase tracking-wide text-ink-tertiary">
                      {roleLabel}
                    </span>
                  </div>
                </div>
                <MenuItem href="/profile" icon={<UserIcon className="w-3.5 h-3.5" />} onClose={() => setMenuOpen(false)}>
                  My profile
                </MenuItem>
                <button
                  onClick={handleSignOut}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-left",
                    "text-[13px] text-ink-secondary hover:bg-surface-muted hover:text-[var(--danger-text)]",
                    "transition-colors duration-fast",
                  )}
                  role="menuitem"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  href,
  icon,
  children,
  onClose,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      role="menuitem"
      className={cn(
        "flex items-center gap-2.5 px-3 py-2",
        "text-[13px] text-ink-secondary hover:bg-surface-muted hover:text-ink-primary",
        "transition-colors duration-fast",
      )}
    >
      <span className="text-ink-tertiary">{icon}</span>
      {children}
    </Link>
  );
}
