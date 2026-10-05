"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
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

export default function RiwayatPelaporPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) {
          throw new Error(`Gagal memuat riwayat (${res.status})`);
        }

        const json = await res.json();
        if (json?.data) {
          setReports(json.data as ReportItem[]);
        }
      } catch (err) {
        console.error("Gagal memuat riwayat laporan:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const filteredReports =
    filterStatus === "semua"
      ? reports
      : reports.filter((r) => r.status === filterStatus);

  const filterChips = [
    { key: "semua", label: "Semua" },
    { key: "baru", label: "Baru" },
    { key: "diverifikasi", label: "Diverifikasi" },
    { key: "dikerjakan", label: "Dikerjakan" },
    { key: "selesai", label: "Selesai" },
    { key: "ditolak", label: "Ditolak" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Riwayat Laporan Anda
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Daftar seluruh laporan kerusakan jalan yang telah Anda ajukan.
        </p>
      </div>

        {/* Filter Chip Horizontal Scroll (Mobile & Desktop sesuai design.md Bagian 8.3) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilterStatus(chip.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                filterStatus === chip.key
                  ? "bg-primary text-white border-primary"
                  : "bg-base text-text-secondary border-border hover:border-primary/50"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* List Card (Mobile) & Tabel (Desktop) */}
        {filteredReports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Tidak Ada Laporan"
            description={
              filterStatus === "semua"
                ? "Anda belum memiliki riwayat laporan."
                : `Tidak ada laporan dengan status "${filterStatus}".`
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredReports.map((rep) => {
              const priorityVal = Array.isArray(rep.priority_scores)
                ? rep.priority_scores[0]?.priority_value ?? 0
                : rep.priority_scores?.priority_value ?? 0;
              return (
                <Link key={rep.id} href={`/pelapor/riwayat/${rep.id}`} className="block transition-transform active:scale-[0.99]">
                  <Card className="hover:border-primary/50 transition-colors shadow-subtle hover:shadow-card bg-base overflow-hidden">
                    <div className="p-3.5 sm:px-5 sm:py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-5">
                        {/* Thumbnail + Info */}
                        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                          <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-surface border border-border/70 shrink-0">
                            <Image
                              src={rep.photo_url}
                              alt="Foto Kerusakan"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <div className="text-xs sm:text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
                              {rep.address_text || "Alamat lokasi laporan"}
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

                        {/* Badges: Row on mobile, Column on desktop [Status] / [Priority] */}
                        <div className="flex items-center flex-wrap sm:flex-col sm:items-end sm:justify-center gap-1.5 shrink-0">
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
  );
}
