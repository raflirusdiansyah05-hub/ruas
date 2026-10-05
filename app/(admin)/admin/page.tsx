"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Inbox,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  TrendingUp,
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
} from "recharts";
import { ReportStatus, SeverityLevel } from "@/types/database";

interface ReportItem {
  id: string;
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

const getPriorityVal = (item: ReportItem): number => {
  if (Array.isArray(item.priority_scores)) {
    return Number(item.priority_scores[0]?.priority_value) || 0;
  }
  return Number(item.priority_scores?.priority_value) || 0;
};

const getSeverityLevel = (item: ReportItem): SeverityLevel => {
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

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) {
          throw new Error(`Gagal memuat dashboard: ${res.status}`);
        }
        const json = await res.json();
        const data = json.reports || json.data || [];
        if (Array.isArray(data)) {
          setReports(data as unknown as ReportItem[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const totalReports = reports.length;
  const criticalCount = reports.filter(
    (r) => getSeverityLevel(r) === "critical"
  ).length;
  const newCount = reports.filter((r) => r.status === "baru").length;
  const doneCount = reports.filter((r) => r.status === "selesai").length;

  // Chart Data: Sebaran Status
  const statusData = [
    { name: "Baru", count: reports.filter((r) => r.status === "baru").length, color: "#757575" },
    { name: "Diverifikasi", count: reports.filter((r) => r.status === "diverifikasi").length, color: "#1565C0" },
    { name: "Dijadwalkan", count: reports.filter((r) => r.status === "dijadwalkan").length, color: "#6A1B9A" },
    { name: "Dikerjakan", count: reports.filter((r) => r.status === "dikerjakan").length, color: "#F9A825" },
    { name: "Selesai", count: reports.filter((r) => r.status === "selesai").length, color: "#2E7D32" },
  ];

  // Chart Data: Sebaran Severity
  const severityData = [
    { name: "Kritis", value: reports.filter((r) => getSeverityLevel(r) === "critical").length, color: "#C62828" },
    { name: "Tinggi", value: reports.filter((r) => getSeverityLevel(r) === "high").length, color: "#EF6C00" },
    { name: "Sedang", value: reports.filter((r) => getSeverityLevel(r) === "medium").length, color: "#F9A825" },
    { name: "Rendah", value: reports.filter((r) => getSeverityLevel(r) === "low").length, color: "#2E7D32" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Dashboard Pengawasan Jalan
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Ringkasan antrean prioritas, verifikasi laporan masuk, dan monitoring infrastruktur wilayah dinas.
          </p>
        </div>
        <div className="shrink-0">
          <Button asChild size="sm" className="shadow-xs font-semibold gap-2">
            <Link href="/admin/queue">
              <Inbox className="h-4 w-4" />
              Buka Queue Prioritas
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Kritis: Highlight Utama */}
        <div className="p-4 sm:p-4.5 rounded-xl bg-gradient-to-br from-red-50/80 to-base border border-severity-critical/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-severity-critical uppercase tracking-wider">
              Prioritas Kritis
            </span>
            <div className="h-8 w-8 rounded-lg bg-severity-critical/15 text-severity-critical flex items-center justify-center">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-severity-critical tracking-tight">
              {criticalCount}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">Membutuhkan intervensi segera</p>
          </div>
        </div>

        {/* Laporan Baru */}
        <div className="p-4 sm:p-4.5 rounded-xl bg-base border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Antrean Baru
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-status-diverifikasi flex items-center justify-center">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {newCount}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">Belum diverifikasi Admin</p>
          </div>
        </div>

        {/* Total Terverifikasi / Selesai */}
        <div className="p-4 sm:p-4.5 rounded-xl bg-base border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Telah Selesai
            </span>
            <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-feedback-success tracking-tight">
              {doneCount}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">Perbaikan fisik rampung</p>
          </div>
        </div>

        {/* Total Laporan Masuk */}
        <div className="p-4 sm:p-4.5 rounded-xl bg-base border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Total Laporan
            </span>
            <div className="h-8 w-8 rounded-lg bg-surface text-text-secondary flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {totalReports}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">Akumulasi laporan warga</p>
          </div>
        </div>
      </div>

      {/* Grid Grafik Analitik (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Status Laporan Breakdown */}
        <Card className="lg:col-span-7 border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Progres Penanganan Laporan</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" stroke="#555555" fontSize={11} tickLine={false} />
                  <YAxis stroke="#555555" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1E8E5A" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tingkat Keparahan Pie */}
        <Card className="lg:col-span-5 border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Sebaran Tingkat Keparahan</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-2.5 text-[11px] text-text-secondary mt-1 flex-wrap">
              {severityData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Laporan Paling Mendesak */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-bold">Laporan Mendesak Perlu Tindakan</CardTitle>
          <Link
            href="/admin/queue"
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <span>Buka Queue Lengkap</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-1">
          {reports.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">
              Belum ada data laporan yang masuk.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {[...reports]
                .sort((a, b) => getPriorityVal(b) - getPriorityVal(a))
                .slice(0, 5)
                .map((rep) => {
                  const sev = getSeverityLevel(rep);
                  const prio = getPriorityVal(rep);
                  return (
                    <div key={rep.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="truncate">
                        <Link
                          href={`/admin/queue/${rep.id}`}
                          className="text-sm font-semibold text-text-primary hover:text-primary transition-colors truncate block"
                        >
                          {rep.address_text || "Titik Laporan"}
                        </Link>
                        <div className="text-xs text-text-secondary mt-0.5">
                          Skor Prioritas: <strong className="text-primary">{prio}</strong> | {new Date(rep.created_at).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <SeverityBadge level={sev} />
                        <StatusBadge status={rep.status} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
