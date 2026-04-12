"use client";

import { useApiCall } from "@/lib/hooks/client";
import { useRouter } from "next/navigation";
import { LogOut, Bell, Search, User } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  profile: any;
}

export default function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    try {
      await callApi("/api/auth/logout", {
        method: "POST",
      });
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
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid var(--tag-border)',
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ backgroundColor: 'var(--tag-orange)' }}
          >
            <span className="text-white text-sm font-normal">TAG</span>
          </div>
          <span className="text-lg font-light" style={{ letterSpacing: '-0.22px' }}>
            HRM System
          </span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search */}
          {(profile?.role === "admin" || profile?.role === "super_admin") && (
            <div className="relative">
              {showSearch ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search employees..."
                    autoFocus
                    className="px-3 py-1.5 rounded text-sm w-64"
                    style={{
                      border: '1px solid var(--tag-border)',
                      backgroundColor: 'var(--tag-bg)',
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSearch(false), 200);
                    }}
                  />
                </form>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded hover:bg-opacity-50 transition-colors"
                  style={{ backgroundColor: 'var(--tag-bg-warm)' }}
                >
                  <Search className="w-4 h-4" style={{ color: 'var(--tag-label)' }} />
                </button>
              )}
            </div>
          )}

          {/* Notifications */}
          <Link
            href="/notifications"
            className="p-2 rounded hover:bg-opacity-50 transition-colors relative"
            style={{ backgroundColor: 'var(--tag-bg-warm)' }}
          >
            <Bell className="w-4 h-4" style={{ color: 'var(--tag-label)' }} />
            {/* Notification badge - placeholder */}
            {/* <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--tag-danger)' }} /> */}
          </Link>

          {/* Profile Menu */}
          <div className="flex items-center gap-3 pl-3 border-l" style={{ borderColor: 'var(--tag-border)' }}>
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--tag-bg-warm)' }}
              >
                <User className="w-4 h-4" style={{ color: 'var(--tag-orange)' }} />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-normal">{profile?.full_name}</p>
                <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
                  {profile?.role === "super_admin" ? "Super Admin" : profile?.role === "admin" ? "Admin" : "Employee"}
                </p>
              </div>
            </Link>

            <button
              onClick={handleSignOut}
              className="p-2 rounded hover:bg-opacity-50 transition-colors"
              style={{ backgroundColor: 'var(--tag-bg-warm)' }}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" style={{ color: 'var(--tag-label)' }} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
