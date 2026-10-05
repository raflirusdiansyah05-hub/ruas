"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  ArrowRight,
  Loader2,
  Filter,
  Check,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ruasLogo from "@/ruas-logo.png";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { ReportStatus, SeverityLevel } from "@/types/database";

interface PublicReport {
  id: string;
  latitude: number;
  longitude: number;
  address_text: string | null;
  status: ReportStatus;
  created_at: string;
  priority_scores?:
    | {
        severity_level?: SeverityLevel | null;
        priority_value?: number;
      }
    | {
        severity_level?: SeverityLevel | null;
        priority_value?: number;
      }[]
    | null;
}

const getSeverityLevel = (item: PublicReport): SeverityLevel => {
  let sev: any;
  if (Array.isArray(item.priority_scores)) {
    sev = item.priority_scores[0]?.severity_level;
  } else {
    sev = item.priority_scores?.severity_level;
  }
  if (!sev) return "low";
  const s = String(sev).toLowerCase();
  if (s === "critical" || s === "kritis") return "critical";
  if (s === "high" || s === "tinggi") return "high";
  if (s === "medium" || s === "sedang") return "medium";
  return "low";
};

const SEVERITY_OPTIONS = [
  { value: "semua", label: "Semua Tingkat Keparahan" },
  { value: "critical", label: "Kritis" },
  { value: "high", label: "Tinggi" },
  { value: "medium", label: "Sedang" },
  { value: "low", label: "Rendah" },
];

export default function StatistikPage() {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("semua");
  const [isSeverityOpen, setIsSeverityOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSeverityOpen(false);
      }
    };
    if (isSeverityOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSeverityOpen]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/reports?public=true");
        if (res.ok) {
          const json = await res.json();
          const data = json.reports || json.data || [];
          if (Array.isArray(data)) {
            setReports(data as unknown as PublicReport[]);
            return;
          }
        }

        // Fallback langsung ke Supabase dengan nama kolom yang valid
        const supabase = createClient();
        const { data, error } = await supabase
          .from("reports")
          .select(`
            id,
            address_text,
            latitude,
            longitude,
            status,
            created_at,
            priority_scores (
              priority_value,
              severity_level
            ),
            detections (
              damage_type
            )
          `)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setReports(data as unknown as PublicReport[]);
        }
      } catch (err) {
        console.error("Failed to fetch statistik:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalReports = reports.length;
  const completedReports = reports.filter((r) => r.status === "selesai").length;
  const inProgressReports = reports.filter(
    (r) => r.status === "dikerjakan" || r.status === "dijadwalkan" || r.status === "diverifikasi"
  ).length;

  const resolutionRate =
    totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

  const severityCounts = {
    critical: reports.filter((r) => getSeverityLevel(r) === "critical").length,
    high: reports.filter((r) => getSeverityLevel(r) === "high").length,
    medium: reports.filter((r) => getSeverityLevel(r) === "medium").length,
    low: reports.filter((r) => getSeverityLevel(r) === "low").length,
  };

  const statusCounts = {
    baru: reports.filter((r) => r.status === "baru").length,
    diverifikasi: reports.filter((r) => r.status === "diverifikasi").length,
    dijadwalkan: reports.filter((r) => r.status === "dijadwalkan").length,
    dikerjakan: reports.filter((r) => r.status === "dikerjakan").length,
    selesai: reports.filter((r) => r.status === "selesai").length,
    ditolak: reports.filter((r) => r.status === "ditolak").length,
  };

  const severityData = [
    { name: "Kritis", value: severityCounts.critical, count: severityCounts.critical, fill: "#DC2626", color: "#DC2626" },
    { name: "Tinggi", value: severityCounts.high, count: severityCounts.high, fill: "#EA580C", color: "#EA580C" },
    { name: "Sedang", value: severityCounts.medium, count: severityCounts.medium, fill: "#D97706", color: "#D97706" },
    { name: "Rendah", value: severityCounts.low, count: severityCounts.low, fill: "#1E8E5A", color: "#1E8E5A" },
  ].filter((d) => d.value > 0);

  const statusData = [
    { name: "Selesai", count: statusCounts.selesai, value: statusCounts.selesai, color: "#1E8E5A" },
    { name: "Dikerjakan", count: statusCounts.dikerjakan, value: statusCounts.dikerjakan, color: "#D97706" },
    { name: "Dijadwalkan", count: statusCounts.dijadwalkan, value: statusCounts.dijadwalkan, color: "#7C3AED" },
    { name: "Diverifikasi", count: statusCounts.diverifikasi, value: statusCounts.diverifikasi, color: "#2563EB" },
    { name: "Baru", count: statusCounts.baru, value: statusCounts.baru, color: "#64748B" },
    { name: "Ditolak", count: statusCounts.ditolak, value: statusCounts.ditolak, color: "#DC2626" },
  ].filter((s) => s.count > 0);

  const filteredReports = reports.filter((r) => {
    if (selectedSeverity === "semua") return true;
    return getSeverityLevel(r) === selectedSeverity;
  });
  return (
    <div className="min-h-screen bg-base flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-base/95 backdrop-blur-md shadow-subtle">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90 shrink-0">
            <Image
              src={ruasLogo}
              alt="RUAS — Sistem Prioritas Jalan"
              priority
              className="h-6 sm:h-7 md:h-8 lg:h-9 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/statistik"
              className="text-xs sm:text-sm font-medium text-slate-600 text-[#475569] hover:text-primary transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-surface whitespace-nowrap"
            >
              Statistik Publik
            </Link>
            <Button asChild variant="outline" className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg text-slate-900 text-[#0F172A] border-border bg-base hover:bg-surface-hover hover:text-primary shadow-subtle">
              <Link href="/login">Masuk</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5 sm:pb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
              Peta Sebaran & Statistik Perbaikan Jalan
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 sm:mt-1.5">
              Data pemantauan penanganan laporan jalan rusak secara realtime dan transparan untuk masyarakat.
            </p>
          </div>
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto gap-2 shadow-card">
              Laporkan Jalan di Sekitar Anda
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* 4 Metrik Ringkasan (KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 min-w-0">
          <div className="p-3.5 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-base border border-border/80 shadow-card flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider leading-snug line-clamp-2">
                Total Laporan
              </span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary-soft text-primary flex items-center justify-center border border-primary/15 shadow-subtle shrink-0">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-primary tracking-tight">
                {totalReports}
              </div>
              <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 sm:mt-1 truncate">
                Laporan dari warga
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-base border border-border/80 shadow-card flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider leading-snug line-clamp-2">
                Tuntas Diperbaiki
              </span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary-soft text-primary flex items-center justify-center border border-primary/15 shadow-subtle shrink-0">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-feedback-success" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-feedback-success tracking-tight">
                {completedReports}
              </div>
              <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 sm:mt-1 truncate">
                Pengerjaan selesai
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-base border border-border/80 shadow-card flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider leading-snug line-clamp-2">
                Sedang Ditangani
              </span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-subtle shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-600 tracking-tight">
                {inProgressReports}
              </div>
              <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 sm:mt-1 truncate">
                Dalam proses dinas
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl bg-base border border-border/80 shadow-card flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider leading-snug line-clamp-2">
                Rasio Penyelesaian
              </span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-subtle shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-600 tracking-tight">
                {resolutionRate}%
              </div>
              <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 sm:mt-1 truncate">
                Tingkat efektivitas
              </p>
            </div>
          </div>
        </div>

        {/* Visualisasi Grafik Status & Tingkat Keparahan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
          <Card className="lg:col-span-7 border-border shadow-card bg-base overflow-hidden min-w-0">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
              <CardTitle className="text-sm font-bold text-text-primary">
                Distribusi Status Penanganan Terkini
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#555555" fontSize={11} tickLine={false} />
                    <YAxis stroke="#555555" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1E8E5A" radius={[6, 6, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5 border-border shadow-card bg-base overflow-hidden min-w-0 flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
              <CardTitle className="text-sm font-bold text-text-primary">
                Proporsi Tingkat Keparahan AI
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 flex flex-col items-center justify-between flex-1">
              {severityData.length === 0 ? (
                <div className="h-48 sm:h-56 flex items-center justify-center text-xs text-text-secondary">
                  Belum ada data keparahan terverifikasi.
                </div>
              ) : (
                <>
                  <div className="h-44 sm:h-48 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-sev-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Responsive Legend Breakdown */}
                  <div className="grid grid-cols-2 gap-2 w-full pt-3 mt-1 border-t border-border/70">
                    {severityData.map((sev) => (
                      <div
                        key={sev.name}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-surface/80 border border-border/50"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sev.color }}
                          />
                          <span className="text-text-primary font-medium truncate">{sev.name}</span>
                        </div>
                        <span className="font-bold text-text-secondary ml-1 shrink-0">{sev.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabel Titik Laporan Publik Terbuka */}
        <Card className="border-border shadow-card bg-base overflow-hidden min-w-0">
          <CardHeader className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                Daftar Titik Penanganan Terkini
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Masyarakat dapat memantau status tindak lanjut perbaikan secara berkala.
              </p>
            </div>

            {/* Filter Urgensi */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-3.5 w-3.5 text-text-secondary shrink-0" />
              <div className="relative w-full sm:w-auto">
                <button
                  type="button"
                  id="severity-filter-trigger"
                  onClick={() => setIsSeverityOpen((prev) => !prev)}
                  className="h-9 sm:h-8 w-full sm:w-[210px] px-2.5 rounded-lg sm:rounded-md border border-border bg-base text-xs font-medium text-text-primary flex items-center justify-between gap-2 shadow-subtle hover:bg-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  aria-haspopup="listbox"
                  aria-expanded={isSeverityOpen}
                >
                  <span className="truncate">
                    {SEVERITY_OPTIONS.find((opt) => opt.value === selectedSeverity)?.label ||
                      "Semua Tingkat Keparahan"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-text-secondary shrink-0 transition-transform duration-200",
                      isSeverityOpen && "transform rotate-180 text-primary"
                    )}
                  />
                </button>

                {isSeverityOpen && (
                  <>
                    {/* Backdrop for click outside */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsSeverityOpen(false)}
                      aria-hidden="true"
                    />
                    {/* Custom Dropdown Menu */}
                    <div
                      role="listbox"
                      aria-labelledby="severity-filter-trigger"
                      className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-1.5 sm:w-[210px] rounded-lg sm:rounded-md border border-border bg-base shadow-card py-1 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
                    >
                      {SEVERITY_OPTIONS.map((opt) => {
                        const isSelected = selectedSeverity === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedSeverity(opt.value);
                              setIsSeverityOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer",
                              isSelected
                                ? "bg-primary-soft text-primary font-semibold"
                                : "text-text-primary hover:bg-surface"
                            )}
                          >
                            <span>{opt.label}</span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 min-w-0">
            {loading ? (
              <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-text-secondary">
                <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                <p className="text-xs font-medium">Memuat data publik...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-xs text-text-secondary">
                Tidak ada data kerusakan jalan untuk kategori ini.
              </div>
            ) : (
              <div className="w-full overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="bg-surface border-b border-border text-text-secondary uppercase">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 font-semibold whitespace-nowrap">Tingkat Keparahan</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold whitespace-nowrap">Alamat / Lokasi Jalan</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold whitespace-nowrap">Koordinat GPS</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold whitespace-nowrap">Status Penanganan</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold whitespace-nowrap">Tanggal Dilaporkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredReports.slice(0, 15).map((item) => {
                      const sev = getSeverityLevel(item);
                      return (
                        <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                          <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                            <SeverityBadge level={sev} />
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 font-medium text-text-primary max-w-[200px] sm:max-w-xs md:max-w-sm truncate">
                            {item.address_text || "Titik Jalan Terlapor"}
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 text-text-secondary font-mono text-[11px] whitespace-nowrap">
                            {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 text-text-secondary whitespace-nowrap">
                            {new Date(item.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 7. FOOTER */}
      <PublicFooter />
    </div>
  );
}
