"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import {
  History,
  CheckCircle2,
  Calendar,
  MapPin,
  Loader2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { SeverityLevel } from "@/types/database";

interface CompletedTaskItem {
  id: string;
  completed_at: string;
  proof_photo_url: string | null;
  reports: {
    id: string;
    photo_url: string;
    address_text: string | null;
    fungsi_jalan?: string | null;
    priority_scores?:
      | {
          severity_level: string;
          priority_value: number;
        }
      | {
          severity_level: string;
          priority_value: number;
        }[];
  };
}

export default function RiwayatTugasPetugasPage() {
  const [tasks, setTasks] = useState<CompletedTaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getPriorityScore = (rep: any) => {
    if (!rep?.priority_scores) return null;
    return Array.isArray(rep.priority_scores)
      ? rep.priority_scores[0]
      : rep.priority_scores;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/assignments?status=selesai");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Gagal memuat riwayat tugas");
        }
        setTasks(json.data?.assignments || []);
      } catch (err: any) {
        console.error("Gagal memuat riwayat tugas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Riwayat Perbaikan Lapangan
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Daftar seluruh tugas yang telah berhasil Anda selesaikan beserta dokumentasi before & after.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-text-secondary flex flex-col items-center justify-center bg-base rounded-2xl border border-border">
          <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
          <p className="text-xs font-medium">Memuat arsip riwayat pengerjaan...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center text-text-secondary bg-base rounded-2xl border border-border shadow-card">
          <History className="h-10 w-10 text-border mx-auto mb-3" />
          <p className="text-sm font-semibold text-text-primary">Belum Ada Riwayat Selesai</p>
          <p className="text-xs mt-1 text-text-secondary max-w-xs mx-auto">
            Tugas yang Anda tandai selesai dan diunggah bukti fotonya akan tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const report = task.reports;
            const priorityScore = getPriorityScore(report);
            const rawSev = priorityScore?.severity_level;
            const severity: SeverityLevel =
              rawSev === "critical" || rawSev === "high" || rawSev === "medium" || rawSev === "low"
                ? rawSev
                : "medium";
            const priorityVal = priorityScore?.priority_value;

            return (
              <Link
                key={task.id}
                href={`/petugas/tugas/${task.id}`}
                className="block group transition-transform active:scale-[0.99]"
              >
                <Card className="border-border hover:border-primary/50 shadow-xs bg-base overflow-hidden rounded-2xl transition-all">
                  <CardHeader className="p-3.5 sm:p-4 pb-3 flex flex-row items-center justify-between border-b border-border/80 bg-surface/40">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-feedback-success shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-text-primary">Tuntas Dikerjakan</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className="text-[11px] font-medium text-text-secondary">
                        {task.completed_at
                          ? new Date(task.completed_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardHeader>

                  <div className="p-3.5 sm:p-4 space-y-3">
                    {/* Metadata Baris: Priority, Skor, Fungsi Jalan */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge level={severity} />
                      {priorityVal !== undefined && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface text-text-secondary border border-border/60 text-[10px] font-medium">
                          Skor: <strong className="ml-1 text-primary font-bold font-mono">{priorityVal}</strong>
                        </span>
                      )}
                      {report?.fungsi_jalan && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold capitalize">
                          Jalan {report.fungsi_jalan}
                        </span>
                      )}
                    </div>

                    {/* Alamat Laporan (Maksimal 2 baris, wrap natural) */}
                    <p className="text-xs sm:text-sm font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {report?.address_text || "Lokasi perbaikan"}
                    </p>

                    {/* Before vs After Perbandingan Foto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Foto Awal (Before) */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                          Sebelum (Laporan)
                        </span>
                        <div className="relative w-full aspect-[16/9] sm:aspect-[4/3] max-h-[220px] rounded-xl overflow-hidden bg-surface border border-border/80">
                          {report?.photo_url ? (
                            <Image
                              src={report.photo_url}
                              alt="Foto Sebelum Perbaikan"
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-text-tertiary text-xs">
                              Foto Laporan
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Foto Bukti (After) */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-feedback-success uppercase tracking-wider block">
                          Sesudah (Bukti Petugas)
                        </span>
                        <div className="relative w-full aspect-[16/9] sm:aspect-[4/3] max-h-[220px] rounded-xl overflow-hidden bg-surface border border-emerald-300">
                          {task.proof_photo_url ? (
                            <Image
                              src={task.proof_photo_url}
                              alt="Foto Sesudah Perbaikan"
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-text-tertiary text-xs">
                              Bukti Selesai
                            </div>
                          )}
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
  );
}
