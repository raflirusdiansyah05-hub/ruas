"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { Camera, FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { ReportStatus, SeverityLevel } from "@/types/database";

interface PriorityScoreSummary {
  severity_level?: SeverityLevel;
  priority_value: number;
}

interface ReportItem {
  id: string;
  photo_url: string;
  address_text: string | null;
  status: ReportStatus;
  created_at: string;
  priority_scores?: PriorityScoreSummary | PriorityScoreSummary[];
}

export default function PelaporDashboard() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) {
          throw new Error(`Gagal memuat laporan (${res.status})`);
        }

        const json = await res.json();
        if (json?.data) {
          setReports((json.data as ReportItem[]).slice(0, 5));
        }
      } catch (err) {
        console.error("Gagal memuat data laporan dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const totalReports = reports.length;
  const completedReports = reports.filter((r) => r.status === "selesai").length;
  const pendingReports = reports.filter((r) => r.status !== "selesai" && r.status !== "ditolak").length;

  return (
    <div className="space-y-8">
      {/* 1. Header & Primary Action Hero */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-[#166B44] to-primary-active text-white p-5 sm:p-7 md:p-8 shadow-card border border-primary/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="max-w-lg space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Portal Partisipasi Warga
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Temukan jalan rusak atau berlubang?
            </h1>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              Cukup potret kerusakan jalan. Kecerdasan buatan RUAS akan mendeteksi tingkat keparahan dan meneruskannya ke dinas terkait.
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <Button
              asChild
              size="lg"
              className="w-full md:w-auto bg-white text-primary hover:bg-white/90 hover:text-primary-active font-bold shadow-float px-5 sm:px-6 h-11 sm:h-12 rounded-xl sm:rounded-2xl gap-2.5"
            >
              <Link href="/pelapor/lapor">
                <Camera className="h-5 w-5 text-primary" />
                Lapor Sekarang
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Ringkasan Statistik Laporan Warga */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-5 min-w-0">
        <div className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-base border border-border/80 shadow-subtle flex flex-col justify-between min-w-0">
          <div className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider truncate">Total Laporan</div>
          <div className="text-xl sm:text-3xl lg:text-4xl font-black text-text-primary mt-1.5 sm:mt-2 tracking-tight">
            {totalReports}
          </div>
          <div className="text-[10px] sm:text-[11px] text-text-secondary mt-0.5 sm:mt-1 truncate hidden sm:block">Semua terkirim</div>
        </div>

        <div className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-base border border-border/80 shadow-subtle flex flex-col justify-between min-w-0">
          <div className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider truncate">Dalam Proses</div>
          <div className="text-xl sm:text-3xl lg:text-4xl font-black text-primary mt-1.5 sm:mt-2 tracking-tight">
            {pendingReports}
          </div>
          <div className="text-[10px] sm:text-[11px] text-text-secondary mt-0.5 sm:mt-1 truncate hidden sm:block">Sedang berjalan</div>
        </div>

        <div className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-base border border-border/80 shadow-subtle flex flex-col justify-between min-w-0">
          <div className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider truncate">Telah Selesai</div>
          <div className="text-xl sm:text-3xl lg:text-4xl font-black text-feedback-success mt-1.5 sm:mt-2 tracking-tight">
            {completedReports}
          </div>
          <div className="text-[10px] sm:text-[11px] text-text-secondary mt-0.5 sm:mt-1 truncate hidden sm:block">Perbaikan rampung</div>
        </div>
      </div>

      {/* Daftar Laporan Terbaru */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">Laporan Terbaru Anda</h2>
          <Link
            href="/pelapor/riwayat"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            Lihat Semua
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum Ada Laporan"
            description="Anda belum pernah mengirimkan laporan kerusakan jalan. Ketuk tombol di bawah untuk membuat laporan pertama."
            actionLabel="Lapor Kerusakan Jalan"
            actionHref="/pelapor/lapor"
          />
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => {
              const priorityVal = Array.isArray(rep.priority_scores)
                ? rep.priority_scores[0]?.priority_value ?? 0
                : rep.priority_scores?.priority_value ?? 0;
              return (
                <Link key={rep.id} href={`/pelapor/riwayat/${rep.id}`} className="block transition-transform active:scale-[0.99]">
                  <Card className="hover:border-primary/40 hover:shadow-card-hover transition-all bg-base border-border/80 overflow-hidden">
                    <div className="p-3.5 sm:px-5 sm:py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-5">
                        {/* Thumbnail + Address/Date */}
                        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                          <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-surface border border-border/80 shrink-0">
                            <Image
                              src={rep.photo_url}
                              alt="Foto Kerusakan"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <div className="text-xs sm:text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
                              {rep.address_text || "Lokasi jalan"}
                            </div>
                            <div className="text-[11px] text-text-secondary mt-1 flex items-center gap-1.5">
                              <span>Dilaporkan:</span>
                              <span className="font-medium text-text-primary">
                                {new Date(rep.created_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badges: Desktop horizontal in-line [Status + Priority], mobile natural row below */}
                        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 shrink-0 sm:self-center">
                          <StatusBadge status={rep.status} />
                          <PriorityBadge priorityValue={priorityVal} size="sm" />
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
