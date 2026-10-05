"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import ruasLogo from "@/ruas-logo.png";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/queue", label: "Queue Laporan", icon: Inbox },
  { href: "/admin/petugas", label: "Manajemen Petugas", icon: Users },
  { href: "/admin/analitik", label: "Laporan & Analitik", icon: BarChart3 },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

export const AdminSidebar: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* 1. Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-base border-b border-border/80 shadow-subtle">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src={ruasLogo}
            alt="RUAS — Sistem Prioritas Jalan"
            priority
            className="h-6 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center gap-2">
          <NotificationDropdown align="right" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* 2. Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-20 bg-black/30 backdrop-blur-xs">
          <div className="bg-base border-b border-border/80 p-4 space-y-1.5 shadow-float">
            {adminNavItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150",
                    isActive
                      ? "bg-primary-soft text-primary font-bold border border-primary/15"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-border/80">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-feedback-error hover:bg-feedback-error/10 gap-2.5 text-xs font-semibold"
              >
                <LogOut className="h-4 w-4" />
                Keluar Sesi Admin
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Desktop Fixed Left Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-64 border-r border-border/80 bg-base p-6 fixed inset-y-0 left-0 z-20 shadow-subtle">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <Link href="/admin" className="flex items-center gap-2">
              <Image
                src={ruasLogo}
                alt="RUAS — Sistem Prioritas Jalan"
                priority
                className="h-7 w-auto object-contain"
              />
            </Link>
            <NotificationDropdown align="left" />
          </div>

          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150",
                    isActive
                      ? "bg-primary-soft text-primary font-bold border border-primary/20 shadow-subtle"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary border border-transparent"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-text-secondary")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-border/80 space-y-3">
          <div className="flex items-center gap-2.5 px-2 text-xs text-text-secondary">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="truncate font-medium">Dinas Bina Marga</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-feedback-error hover:bg-feedback-error/10 gap-2.5 text-xs font-semibold"
          >
            <LogOut className="h-4 w-4" />
            Keluar Sesi
          </Button>
        </div>
      </aside>

      {/* 4. Main Admin Content Area */}
      <div className="flex-1 md:ml-64 min-h-screen">{children}</div>
    </div>
  );
};
