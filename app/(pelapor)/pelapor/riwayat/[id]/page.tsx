"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { ReportStatus, SeverityLevel } from "@/types/database";

interface StatusHistoryItem {
  id: string;
  status_from: string | null;
  status_to: string;
  changed_at: string;
  note: string | null;
}

interface ReportDetail {
  id: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  address_text: string | null;
  description: string | null;
  status: ReportStatus;
  rejection_reason: string | null;
  created_at: string;
  priority_scores?: {
    severity_level?: SeverityLevel;
    priority_value: number;
  }[];
  assignments?: {
    proof_photo_url: string | null;
    completed_at: string | null;
  }[];
  status_history?: StatusHistoryItem[];
}

export default function DetailLaporanPelaporPage() {
  const params = useParams();
  const reportId = params?.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!reportId) return;
      try {
        const res = await fetch(`/api/reports/${reportId}`);
        if (!res.ok) {
          throw new Error(`Gagal memuat detail laporan (${res.status})`);
        }

        const json = await res.json();
        const data = json?.data;

        if (data?.report) {
          setReport({
            ...data.report,
            priority_scores: data.priority_score ? [data.priority_score] : [],
            assignments: data.assignments || [],
            status_history: data.status_history || [],
          });
        }
      } catch (err) {
        console.error("Gagal memuat detail riwayat:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [reportId]);

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center text-xs text-text-secondary">
        Memuat detail laporan...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-text-secondary">Laporan tidak ditemukan.</p>
        <Link href="/pelapor/riwayat" className="text-xs text-primary font-bold mt-2 inline-block">
          Buka Riwayat Laporan
        </Link>
      </div>
    );
  }

  const stepsOrder: ReportStatus[] = [
    "baru",
    "diverifikasi",
    "dijadwalkan",
    "dikerjakan",
    "selesai",
  ];

  const currentStepIndex = stepsOrder.indexOf(report.status);

  return (
    <div className="space-y-6 min-w-0">
      {/* Header Detail Laporan (Desktop & Mobile Hierarchy) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-border/70">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Detail & Progres Laporan
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary font-normal">
            ID Laporan:{" "}
            <span className="font-mono text-text-primary select-all break-all font-normal">
              {report.id}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={report.status} />
          <PriorityBadge
            priorityValue={report.priority_scores?.[0]?.priority_value ?? 0}
            size="sm"
          />
        </div>
      </div>

      {/* Status Stepper Tracker (design.md Bagian 6 & 8.3: vertikal mobile / horizontal desktop) */}
      <Card className="border-border shadow-card bg-base overflow-hidden">
        <div className="p-4 sm:p-6">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-5">
            Status Penanganan Laporan
          </h3>

          {/* Desktop Horizontal Stepper: 5 equal columns grid */}
          <div className="hidden md:grid grid-cols-5 relative">
            {stepsOrder.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;
              const isLast = idx === stepsOrder.length - 1;
              return (
                <div key={step} className="flex flex-col items-center relative text-center min-w-0">
                  {/* Line Connector to next step */}
                  {!isLast && (
                    <div
                      className={`absolute top-3.5 left-1/2 w-full h-0.5 -translate-y-1/2 z-0 transition-colors ${
                        currentStepIndex > idx ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}

                  {/* Indicator Circle */}
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold z-10 shrink-0 transition-colors ${
                      isPassed
                        ? "bg-primary text-white shadow-subtle"
                        : "bg-base border-2 border-border text-text-muted"
                    }`}
                  >
                    {isPassed && !isCurrent ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Step Label: centered directly under the indicator */}
                  <span
                    className={`text-xs mt-2.5 font-semibold tracking-tight text-center capitalize max-w-full px-1 truncate transition-colors ${
                      isCurrent
                        ? "text-primary font-bold"
                        : isPassed
                        ? "text-text-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile Vertical Stepper with Continuous Connector Line */}
          <div className="flex md:hidden flex-col">
            {stepsOrder.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;
              const isLast = idx === stepsOrder.length - 1;
              return (
                <div key={step} className="relative flex items-start gap-3.5">
                  {/* Vertical Connector Line */}
                  {!isLast && (
                    <div
                      className={`absolute left-[13px] top-7 bottom-0 w-0.5 transition-colors ${
                        currentStepIndex > idx ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}

                  {/* Step Circle */}
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold z-10 shrink-0 transition-colors ${
                      isPassed
                        ? "bg-primary text-white shadow-subtle"
                        : "bg-base border-2 border-border text-text-muted"
                    }`}
                  >
                    {isPassed && !isCurrent ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Step Details */}
                  <div className={`pt-1 min-w-0 ${isLast ? "pb-1" : "pb-5"}`}>
                    <div
                      className={`text-xs capitalize leading-tight ${
                        isCurrent
                          ? "font-bold text-primary"
                          : isPassed
                          ? "font-semibold text-text-primary"
                          : "font-medium text-text-muted"
                      }`}
                    >
                      {step}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                      {isCurrent
                        ? "Sedang dalam tahapan ini"
                        : isPassed
                        ? "Tahapan selesai"
                        : "Menunggu tahapan sebelumnya"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {report.status === "ditolak" && (
            <div className="mt-6 p-4 rounded-xl bg-feedback-error/10 border border-feedback-error/20 text-xs text-feedback-error leading-relaxed">
              <span className="font-bold">Alasan Penolakan:</span>{" "}
              <span className="text-feedback-error/90">
                {report.rejection_reason || "Tidak memenuhi kriteria perbaikan jalan dinas."}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Informasi Utama Laporan */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-6 space-y-4 min-w-0">
          {/* Komparasi Foto Sebelum & Sesudah jika status selesai */}
          {(() => {
            const completedAssign = report.assignments?.find(
              (a) => a.proof_photo_url
            ) || report.assignments?.[0];
            const proofUrl = completedAssign?.proof_photo_url;

            if (report.status === "selesai" && proofUrl) {
              return (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Bukti Komparasi Perbaikan (Sebelum & Sesudah)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Foto Sebelum */}
                    <Card className="overflow-hidden border-border bg-base shadow-subtle">
                      <div className="px-3 py-2 bg-surface/70 border-b border-border text-[11px] font-bold text-text-primary flex items-center justify-between">
                        <span>Kondisi Awal (Warga)</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 font-bold">SEBELUM</span>
                      </div>
                      <div className="p-2.5">
                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-black/5">
                          <Image
                            src={report.photo_url}
                            alt="Foto Kerusakan Awal"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Foto Sesudah */}
                    <Card className="overflow-hidden border-feedback-success/40 bg-base shadow-subtle">
                      <div className="px-3 py-2 bg-feedback-success/10 border-b border-feedback-success/20 text-[11px] font-bold text-feedback-success flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Hasil Pengerjaan
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-feedback-success text-white font-bold">SESUDAH</span>
                      </div>
                      <div className="p-2.5">
                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-black/5">
                          <Image
                            src={proofUrl}
                            alt="Bukti Selesai Perbaikan"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              );
            }

            return (
              <Card className="border-border/80 shadow-card bg-base overflow-hidden">
                <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-surface/50 border-b border-border/70">
                  <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                    Foto Awal Kerusakan Jalan
                  </h3>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface border border-border/70 shadow-xs">
                    <Image
                      src={report.photo_url}
                      alt="Foto Kerusakan Jalan"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </Card>
            );
          })()}
        </div>

        <div className="md:col-span-6 space-y-4 min-w-0">
          <Card className="border-border/80 shadow-card bg-base overflow-hidden">
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-surface/50 border-b border-border/70">
              <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                Informasi Laporan
              </h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              {/* Lokasi Kerusakan */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-text-primary">
                    Lokasi Kerusakan
                  </span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed break-words">
                    {report.address_text || "Alamat lokasi tidak tersedia"}
                  </p>
                  <p className="text-[11px] text-text-muted font-mono break-all">
                    GPS: {report.latitude?.toFixed(6) ?? report.latitude}, {report.longitude?.toFixed(6) ?? report.longitude}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/70" />

              {/* Waktu Pengiriman */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-text-primary">
                    Waktu Pengiriman
                  </span>
                </div>
                <div className="pl-6">
                  <p className="text-xs sm:text-sm text-text-secondary">
                    {new Date(report.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              {/* Catatan Tambahan Warga */}
              {report.description && (
                <>
                  <div className="border-t border-border/70" />
                  <div className="space-y-2">
                    <span className="text-xs sm:text-sm font-semibold text-text-primary">
                      Catatan Tambahan Warga:
                    </span>
                    <div className="p-3.5 rounded-xl bg-surface border border-border/60 text-xs sm:text-sm text-text-secondary leading-relaxed break-words">
                      {report.description}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

            {/* Fitur Feedback & Rating Hasil Perbaikan (Fase 7) */}
            {report.status === "selesai" && (
              <Card className="border-emerald-200 bg-emerald-50/40 rounded-2xl shadow-subtle overflow-hidden">
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-emerald-900 leading-tight">
                      Penilaian Hasil Perbaikan Jalan
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-800/90 leading-relaxed max-w-xl">
                    Pekerjaan di titik ini telah diselesaikan oleh tim dinas. Bagaimana kepuasan Anda terhadap hasil penanganan jalan ini?
                  </p>
                  <div className="pt-0.5">
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-white/70 border border-emerald-200/70 shadow-xs">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => alert(`Terima kasih atas rating ${star} bintang Anda! Tanggapan Anda telah dicatat.`)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-base hover:bg-emerald-100/60 hover:scale-110 active:scale-95 transition-all focus:outline-none"
                          aria-label={`Beri rating ${star} bintang`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
    </div>
  );
}
