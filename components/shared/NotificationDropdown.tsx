"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Info,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  related_report_id: string | null;
  created_at: string;
}

interface NotificationDropdownProps {
  align?: "left" | "right" | "auto";
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  align = "auto",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unread_count || 0);
      }
    } catch (err) {
      console.error("Gagal mengambil notifikasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Setup Supabase Realtime channel subscription
    const supabase = createClient();
    let channel: any = null;

    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (!user) return;

      channel = supabase
        .channel(`notifs-realtime-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
    });

    // Active polling interval (3 detik) untuk menjamin pembaruan realtime tanpa refresh
    const timer = setInterval(fetchNotifications, 3000);
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      clearInterval(timer);
    };
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      const url = id ? `/api/notifications?id=${id}` : "/api/notifications";
      await fetch(url, { method: "PATCH" });

      if (id) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Gagal memperbarui status notifikasi:", err);
    }
  };

  return (
    <div className="relative">
      {/* Tombol Bell Icon */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface transition-colors focus:outline-none"
        aria-label="Buka Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-feedback-error text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              "fixed left-4 right-4 top-16 sm:absolute sm:top-full sm:mt-2 sm:w-80 md:w-96 bg-base rounded-2xl border border-border shadow-card z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150",
              align === "left"
                ? "sm:left-0 sm:right-auto"
                : align === "right"
                ? "sm:left-auto sm:right-0"
                : "sm:left-auto sm:right-0 md:left-0 md:right-auto"
            )}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-border flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary">Notifikasi</span>
                {unreadCount > 0 && (
                  <Badge variant="outline" className="bg-primary-soft text-primary border-primary/20 text-[10px]">
                    {unreadCount} baru
                  </Badge>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {loading && notifications.length === 0 ? (
                <div className="p-6 text-center text-text-secondary flex flex-col items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mb-1.5" />
                  <span className="text-xs">Memuat notifikasi...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <Bell className="h-8 w-8 text-border mx-auto mb-2" />
                  <p className="text-xs font-semibold text-text-primary">Belum ada notifikasi</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Pembaruan status laporan dan penugasan akan muncul di sini.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markAsRead(n.id);
                      if (n.related_report_id) {
                        setIsOpen(false);
                        if (typeof window !== "undefined") {
                          if (window.location.pathname.startsWith("/admin")) {
                            window.location.href = `/admin/queue/${n.related_report_id}`;
                          } else if (window.location.pathname.startsWith("/petugas")) {
                            window.location.href = `/petugas/tugas/${n.related_report_id}`;
                          } else {
                            window.location.href = `/pelapor/riwayat/${n.related_report_id}`;
                          }
                        }
                      }
                    }}
                    className={`p-3.5 hover:bg-surface/70 transition-colors cursor-pointer text-left ${
                      !n.is_read ? "bg-primary-soft/30 font-medium" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-text-primary leading-tight">
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1 leading-snug">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-text-secondary mt-2">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>
                        {new Date(n.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
