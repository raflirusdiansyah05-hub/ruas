"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Loader2,
  PieChart as PieChartIcon,
} from "lucide-react";
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
  CartesianGrid,
  Legend,
} from "recharts";

interface ReportAnalyticsItem {
  id: string;
  created_at: string;
  status: string;
  address_text: string | null;
  priority_scores?:
    | {
        severity_level?: string | null;
        priority_value?: number;
      }
    | {
        severity_level?: string | null;
        priority_value?: number;
      }[]
    | null;
  detections?: {
    damage_type: string;
  }[];
}

const getPriorityVal = (item: ReportAnalyticsItem): number => {
  if (Array.isArray(item.priority_scores)) {
    return Number(item.priority_scores[0]?.priority_value) || 0;
  }
  return Number(item.priority_scores?.priority_value) || 0;
};

const getSeverityKey = (item: ReportAnalyticsItem): "kritis" | "tinggi" | "sedang" | "rendah" => {
  let sev: any;
  if (Array.isArray(item.priority_scores)) {
    sev = item.priority_scores[0]?.severity_level;
  } else {
    sev = item.priority_scores?.severity_level;
  }
  if (!sev) return "sedang";
  const s = String(sev).toLowerCase();
  if (s === "critical" || s === "kritis") return "kritis";
  if (s === "high" || s === "tinggi") return "tinggi";
  if (s === "medium" || s === "sedang") return "sedang";
  if (s === "low" || s === "rendah") return "rendah";
  return "sedang";
};

const SEVERITY_COLORS: Record<string, string> = {
  kritis: "#DC2626",
  tinggi: "#EA580C",
  sedang: "#D97706",
  rendah: "#16A34A",
};

const DAMAGE_COLORS = ["#2563EB", "#0D9488", "#F59E0B", "#8B5CF6", "#EC4899"];

export default function AnalitikAdminPage() {
  const [reports, setReports] = useState<ReportAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) {
          throw new Error(`Gagal mengambil data analitik: ${res.status}`);
        }
        const json = await res.json();
        const data = json.reports || json.data || [];
        setReports(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Gagal mengambil data analitik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // 1. Data Distribusi Tingkat Keparahan (Pie Chart)
  const severityCounts: Record<string, number> = {
    kritis: 0,
    tinggi: 0,
    sedang: 0,
    rendah: 0,
  };

  reports.forEach((r) => {
    const sev = getSeverityKey(r);
    severityCounts[sev] += 1;
  });

  const severityPieData = [
    { name: "Kritis", value: severityCounts.kritis, color: SEVERITY_COLORS.kritis },
    { name: "Tinggi", value: severityCounts.tinggi, color: SEVERITY_COLORS.tinggi },
    { name: "Sedang", value: severityCounts.sedang, color: SEVERITY_COLORS.sedang },
    { name: "Rendah", value: severityCounts.rendah, color: SEVERITY_COLORS.rendah },
  ].filter((d) => d.value > 0);

  // 2. Data Status Penyelesaian (Bar Chart)
  const statusCounts: Record<string, number> = {
    baru: 0,
    diverifikasi: 0,
    ditugaskan: 0,
    dikerjakan: 0,
    selesai: 0,
    ditolak: 0,
  };

  reports.forEach((r) => {
    if (statusCounts[r.status] !== undefined) {
      statusCounts[r.status] += 1;
    }
  });

  const statusBarData = [
    { label: "Baru", count: statusCounts.baru, fill: "#2563EB" },
    { label: "Diverifikasi", count: statusCounts.diverifikasi, fill: "#0D9488" },
    { label: "Ditugaskan", count: statusCounts.ditugaskan, fill: "#D97706" },
    { label: "Dikerjakan", count: statusCounts.dikerjakan, fill: "#8B5CF6" },
    { label: "Selesai", count: statusCounts.selesai, fill: "#16A34A" },
    { label: "Ditolak", count: statusCounts.ditolak, fill: "#9CA3AF" },
  ];

  // 3. Distribusi Tipe Kerusakan
  const damageCounts: Record<string, number> = {};
  reports.forEach((r) => {
    r.detections?.forEach((d) => {
      const type = d.damage_type || "Tidak terdefinisi";
      damageCounts[type] = (damageCounts[type] || 0) + 1;
    });
  });

  const damageBarData = Object.entries(damageCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 4. Export Laporan ke CSV
  const handleExportCSV = () => {
    setExporting(true);
    try {
      const headers = [
        "ID Laporan",
        "Tanggal Lapor",
        "Status",
        "Tingkat Keparahan",
        "Skor Prioritas",
        "Alamat Lokasi",
      ];

      const csvRows = [headers.join(",")];

      reports.forEach((r) => {
        const row = [
          `"${r.id}"`,
          `"${new Date(r.created_at).toISOString()}"`,
          `"${r.status}"`,
          `"${getSeverityKey(r)}"`,
          `"${getPriorityVal(r)}"`,
          `"${(r.address_text || "").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `RUAS_Laporan_Kerusakan_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error("Gagal export CSV:", err);
    } finally {
      setExporting(false);
    }
  };

  const totalReports = reports.length;
  const completedReports = statusCounts.selesai;
  const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
            Laporan & Analitik Dinas
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Visualisasi distribusi kerusakan jalan, laju penyelesaian penanganan, dan rekapitulasi data.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          disabled={exporting || reports.length === 0}
          className="bg-primary hover:bg-primary-hover text-white flex items-center gap-2 text-xs shrink-0 self-start sm:self-auto"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Unduh Laporan CSV
        </Button>
      </div>

      {/* Metrik Ringkas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        <Card className="border-border shadow-card bg-base overflow-hidden min-w-0 h-full">
          <CardContent className="p-3.5 sm:p-5 md:p-6 flex flex-col justify-between min-w-0 h-full">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-text-secondary leading-snug break-words">
                Total Seluruh Laporan
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary mt-2 md:mt-3 tracking-tight truncate">
                {totalReports}
              </p>
            </div>
            <span className="text-[10px] sm:text-xs text-text-muted mt-2 md:mt-3 block break-words">
              Laporan masuk
            </span>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card bg-base overflow-hidden min-w-0 h-full">
          <CardContent className="p-3.5 sm:p-5 md:p-6 flex flex-col justify-between min-w-0 h-full">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-text-secondary leading-snug break-words">
                Laporan Kritis
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-feedback-error mt-2 md:mt-3 tracking-tight truncate">
                {severityCounts.kritis}
              </p>
            </div>
            <span className="text-[10px] sm:text-xs text-text-muted mt-2 md:mt-3 block break-words">
              Tingkat bahaya tinggi
            </span>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card bg-base overflow-hidden min-w-0 h-full">
          <CardContent className="p-3.5 sm:p-5 md:p-6 flex flex-col justify-between min-w-0 h-full">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-text-secondary leading-snug break-words">
                Telah Diselesaikan
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-feedback-success mt-2 md:mt-3 tracking-tight truncate">
                {completedReports}
              </p>
            </div>
            <span className="text-[10px] sm:text-xs text-text-muted mt-2 md:mt-3 block break-words">
              Selesai diperbaiki
            </span>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card bg-base overflow-hidden min-w-0 h-full">
          <CardContent className="p-3.5 sm:p-5 md:p-6 flex flex-col justify-between min-w-0 h-full">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-text-secondary leading-snug break-words">
                Tingkat Penyelesaian
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mt-2 md:mt-3 tracking-tight truncate">
                {completionRate}%
              </p>
            </div>
            <span className="text-[10px] sm:text-xs text-text-muted mt-2 md:mt-3 block break-words">
              Dari target total
            </span>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="p-16 text-center text-text-secondary flex flex-col items-center justify-center bg-base rounded-2xl border border-border">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium">Memuat dan mengolah data analitik...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Grafik 1: Status Alur Perbaikan */}
          <Card className="border-border shadow-card bg-base">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Sebaran Laporan Berdasarkan Status
              </CardTitle>
              <CardDescription className="text-xs">
                Monitoring progres penanganan dari verifikasi hingga penuntasan pekerjaan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "#F3F4F6" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" name="Jumlah Laporan" radius={[4, 4, 0, 0]}>
                      {statusBarData.map((entry, idx) => (
                        <Cell key={`cell-status-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Grafik 2: Distribusi Severity Level */}
          <Card className="border-border shadow-card bg-base">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                Proporsi Tingkat Keparahan
              </CardTitle>
              <CardDescription className="text-xs">
                Rasio klasifikasi tingkat urgensi kerusakan menurut hasil analisis AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {severityPieData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-text-secondary">
                  Belum ada data tingkat keparahan.
                </div>
              ) : (
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {severityPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          fontSize: "12px",
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grafik 3: Jenis Kerusakan Terbanyak */}
          <Card className="border-border shadow-card bg-base lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-accent" />
                Jenis Kerusakan Jalan Teridentifikasi
              </CardTitle>
              <CardDescription className="text-xs">
                Frekuensi jenis kerusakan jalan yang paling sering ditemukan di lapangan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {damageBarData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-text-secondary">
                  Belum ada deteksi jenis kerusakan jalan.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={damageBarData}
                      margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#F3F4F6" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" fill="#2563EB" name="Frekuensi" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
