"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  ClipboardList,
  MapPin,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Clock,
} from "lucide-react";
import { SeverityLevel, ReportStatus } from "@/types/database";

interface AssignmentTask {
  id: string; // assignment id
  status: "ditugaskan" | "dikerjakan" | "selesai";
  assigned_at: string;
  reports: {
    id: string;
    photo_url: string;
    latitude: number;
    longitude: number;
    address_text: string | null;
    description: string | null;
    fungsi_jalan?: string | null;
    status: ReportStatus;
    priority_scores?:
      | {
          severity_level: SeverityLevel;
          priority_value: number;
        }
      | {
          severity_level: SeverityLevel;
          priority_value: number;
        }[];
  };
}

export default function PetugasTugasPage() {
  const [tasks, setTasks] = useState<AssignmentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const getPriorityScore = (report: any) => {
    if (!report?.priority_scores) return null;
    return Array.isArray(report.priority_scores)
      ? report.priority_scores[0]
      : report.priority_scores;
  };

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const res = await fetch("/api/assignments?status=aktif");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Gagal memuat tugas petugas");
        }
        setTasks(json.data?.assignments || []);
      } catch (err: any) {
        console.error("Gagal memuat tugas petugas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, []);

  // Sort by priority value jika tersedia
  const sortedTasks = [...tasks].sort((a, b) => {
    const scoreA = getPriorityScore(a.reports)?.priority_value ?? 0;
    const scoreB = getPriorityScore(b.reports)?.priority_value ?? 0;
    return scoreB - scoreA;
  });

  const dikerjakanCount = tasks.filter((t) => t.status === "dikerjakan").length;
  const ditugaskanCount = tasks.filter((t) => t.status === "ditugaskan").length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header Petugas & Status Operasional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4 sm:pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Daftar Tugas Perbaikan
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Penugasan perbaikan jalan yang didelegasikan oleh Dinas untuk ditindaklanjuti.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs flex items-center gap-2 font-bold shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            <span>{dikerjakanCount} Sedang Dikerjakan</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs flex items-center gap-2 font-bold shadow-2xs">
            <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
            <span>{ditugaskanCount} Menunggu</span>
          </div>
        </div>
      </div>

      {/* 2. Banner Sorotan Tugas Aktif (Jika Ada Tugas yang Sedang Dikerjakan) */}
      {tasks.find((t) => t.status === "dikerjakan") && (
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-[#B45309] text-white shadow-card border border-amber-600">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-xs">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                TUGAS AKTIF SEDANG DIKERJAKAN
              </div>
              <h3 className="text-base sm:text-lg font-bold leading-tight line-clamp-1">
                {tasks.find((t) => t.status === "dikerjakan")?.reports?.address_text || "Lokasi Tugas Terjadwal"}
              </h3>
              <p className="text-xs sm:text-sm text-white/90">
                Selesaikan pengerjaan fisik di lokasi, ambil foto bukti pengerjaan, dan submit hasil akhir.
              </p>
            </div>
            <Button
              asChild
              size="default"
              className="bg-white text-amber-900 hover:bg-white/90 font-bold shadow-float rounded-xl shrink-0 h-10 text-xs px-4"
            >
              <Link href={`/petugas/tugas/${tasks.find((t) => t.status === "dikerjakan")?.id}`}>
                Lanjutkan Penanganan &rarr;
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* List Tugas Aktif */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 tracking-tight">
            <ClipboardList className="h-4 w-4 text-primary" />
            Tugas Aktif ({sortedTasks.length})
          </h2>
          <span className="text-[11px] text-text-muted font-medium">Diurutkan berdasarkan prioritas</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-text-secondary flex flex-col items-center justify-center bg-base rounded-2xl border border-border">
            <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
            <p className="text-xs font-medium">Memeriksa penugasan Anda...</p>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="p-12 text-center text-text-secondary bg-base rounded-2xl border border-border shadow-xs">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-text-primary">Tidak Ada Tugas Aktif</p>
            <p className="text-xs mt-1 text-text-secondary max-w-xs mx-auto">
              Semua penugasan telah selesai dikerjakan atau belum ada tugas baru dari Admin Dinas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map((item) => {
              const report = item.reports;
              const priorityScore = getPriorityScore(report);
              const severity: SeverityLevel =
                priorityScore?.severity_level || "medium";
              const priorityVal = priorityScore?.priority_value;

              return (
                <Link
                  key={item.id}
                  href={`/petugas/tugas/${item.id}`}
                  className="block group transition-transform active:scale-[0.99]"
                >
                  <Card className="border-border hover:border-primary/50 shadow-xs bg-base transition-all overflow-hidden">
                    <div className="p-3.5 sm:p-4">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        {/* 1. Thumbnail */}
                        <div className="relative h-[76px] w-[76px] sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-surface shrink-0 border border-border/80 self-start mt-0.5 sm:mt-0">
                          {report?.photo_url ? (
                            <Image
                              src={report.photo_url}
                              alt="Foto Kerusakan"
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-text-tertiary text-xs">
                              Foto
                            </div>
                          )}
                        </div>

                        {/* 2. Content Info */}
                        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                          {/* Priority & Status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <SeverityBadge level={severity} />
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold px-2 py-0.5 ${
                                item.status === "dikerjakan"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {item.status === "dikerjakan"
                                ? "Sedang Dikerjakan"
                                : "Belum Dimulai"}
                            </Badge>
                          </div>

                          {/* Alamat (Maksimal 2 baris, wrap natural) */}
                          <p className="text-xs sm:text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
                            {report?.address_text || "Lokasi kerusakan terdata"}
                          </p>

                          {/* Tanggal & Waktu Penugasan */}
                          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                            <Clock className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                            <span>
                              Ditugaskan{" "}
                              {new Date(item.assigned_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              WIB
                            </span>
                          </div>

                          {/* Skor Urgensi pada Mobile */}
                          {priorityVal !== undefined && (
                            <div className="sm:hidden pt-0.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface text-text-secondary border border-border/60 text-[10px] font-medium">
                                Skor Urgensi: <strong className="ml-1 text-primary font-bold font-mono">{priorityVal}</strong>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 3. Supporting & Navigation (Desktop Skor + Chevron) */}
                        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 self-center pl-1 sm:pl-2">
                          {priorityVal !== undefined && (
                            <div className="hidden sm:block text-right">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface text-text-secondary border border-border/70 text-xs font-medium">
                                Skor Urgensi: <strong className="ml-1.5 text-primary font-bold font-mono">{priorityVal}</strong>
                              </span>
                            </div>
                          )}
                          <div className="text-text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
