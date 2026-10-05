"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StalenessBadge } from "@/components/shared/StalenessBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Inbox,
  Search,
  ChevronRight,
  ChevronDown,
  Copy,
  AlertCircle,
  ArrowUpDown,
  Flame,
  Clock,
} from "lucide-react";
import { ReportStatus, SeverityLevel, FungsiJalan } from "@/types/database";
import { findNearbyReportIds } from "@/lib/utils/geo-distance";
import { calculateStaleness } from "@/lib/scoring/priority";
import { cn } from "@/lib/utils";

interface QueueItem {
  id: string;
  photo_url: string;
  address_text: string | null;
  latitude?: number | null;
  longitude?: number | null;
  fungsi_jalan?: FungsiJalan | null;
  status: ReportStatus;
  created_at: string;
  duplicateCount?: number;
  hari_menunggu?: number;
  is_stale?: boolean;
  profiles?: {
    full_name: string;
  };
  priority_scores?:
    | {
        severity_level?: SeverityLevel | null;
        severity_value?: number;
        s_norm?: number;
        exposure_value?: number;
        priority_value: number;
      }
    | {
        severity_level?: SeverityLevel | null;
        severity_value?: number;
        s_norm?: number;
        exposure_value?: number;
        priority_value: number;
      }[]
    | null;
}

const getPriorityVal = (item: QueueItem): number => {
  if (Array.isArray(item.priority_scores)) {
    return Number(item.priority_scores[0]?.priority_value) || 0;
  }
  return Number(item.priority_scores?.priority_value) || 0;
};

export default function QueueLaporanPage() {
  const [reports, setReports] = useState<QueueItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [fungsiJalanFilter, setFungsiJalanFilter] = useState<string>("semua");
  const [priorityFilter, setPriorityFilter] = useState<string>("semua");
  const [duplicateOnlyFilter, setDuplicateOnlyFilter] = useState(false);
  const [sortMode, setSortMode] = useState<"prioritas" | "terlama">("prioritas");
  const [loading, setLoading] = useState(true);

  // Bulk Action Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const loadQueue = async () => {
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) {
        throw new Error(`Gagal memuat queue: ${res.status}`);
      }
      const json = await res.json();
      const rawData = json.reports || json.data || [];

      if (Array.isArray(rawData)) {
        const rawItems = rawData as unknown as (QueueItem & { latitude: number; longitude: number })[];

        // Hitung potensi duplikat & staleness on-the-fly
        const enriched = rawItems.map((item) => {
          const { hariMenunggu, isStale } = calculateStaleness(item.created_at, item.status);
          const nearbyIds =
            item.latitude && item.longitude ? findNearbyReportIds(item, rawItems) : [];

          return {
            ...item,
            duplicateCount: nearbyIds.length,
            hari_menunggu: hariMenunggu,
            is_stale: isStale,
          };
        });

        setReports(enriched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const filtered = reports
    .filter((r) => {
      const matchSearch =
        !search ||
        r.address_text?.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "semua" || r.status === statusFilter;
      const matchFungsi =
        fungsiJalanFilter === "semua" || r.fungsi_jalan === fungsiJalanFilter;

      const prio = getPriorityVal(r);
      let matchPrio = true;
      if (priorityFilter === "critical") matchPrio = prio >= 75;
      else if (priorityFilter === "high") matchPrio = prio >= 50 && prio < 75;
      else if (priorityFilter === "medium") matchPrio = prio >= 25 && prio < 50;
      else if (priorityFilter === "low") matchPrio = prio < 25;

      const matchDuplicate =
        !duplicateOnlyFilter || ((r.duplicateCount || 0) > 0);

      return matchSearch && matchStatus && matchFungsi && matchPrio && matchDuplicate;
    })
    .sort((a, b) => {
      if (sortMode === "terlama") {
        // Mode Terlama Menunggu: urutkan created_at ascending (laporan terlama di atas)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      // Mode Prioritas Tertinggi (Default): urutkan priority_value descending
      const pA = getPriorityVal(a);
      const pB = getPriorityVal(b);
      return pB - pA;
    });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const unverifiedIds = filtered
        .filter((r) => r.status === "baru")
        .map((r) => r.id);
      setSelectedIds(unverifiedIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkVerify = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Verifikasi sekaligus ${selectedIds.length} laporan terpilih?`)) return;

    setBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await fetch(`/api/reports/${id}/verify`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify" }),
        });
      }
      setSelectedIds([]);
      await loadQueue();
    } catch (err) {
      console.error("Gagal verifikasi massal:", err);
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page Header dengan Toggle Sort Resmi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Queue Laporan Terprioritas
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Daftar laporan terurut otomatis secara transparan untuk respon cepat dinas terkait.
          </p>
        </div>

        {/* Toggle Mode Urutan: Prioritas Tertinggi vs Terlama Menunggu */}
        <div className="inline-flex p-1 bg-surface rounded-xl border border-border/80 shrink-0 self-start sm:self-center shadow-subtle">
          <button
            type="button"
            onClick={() => setSortMode("prioritas")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              sortMode === "prioritas"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Flame className="h-3.5 w-3.5" />
            Prioritas Tertinggi
          </button>
          <button
            type="button"
            onClick={() => setSortMode("terlama")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              sortMode === "terlama"
                ? "bg-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            Terlama Menunggu
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border/80 shadow-card bg-base overflow-hidden">
        <CardContent className="p-3.5 sm:p-4 md:p-5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Input
                placeholder="Cari lokasi atau ID laporan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-xs sm:text-sm w-full"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>

            {/* Filter Actions */}
            <div className="flex flex-wrap sm:flex-nowrap md:flex-nowrap items-center gap-2 md:gap-3 shrink-0">
              {/* Tombol Bulk Verify jika ada yang dipilih */}
              {selectedIds.length > 0 && (
                <Button
                  onClick={handleBulkVerify}
                  disabled={bulkProcessing}
                  size="sm"
                  className="h-10 text-xs md:text-sm font-medium shadow-card gap-1.5 w-full sm:w-auto shrink-0"
                >
                  {bulkProcessing
                    ? "Memproses..."
                    : `Verifikasi Massal (${selectedIds.length})`}
                </Button>
              )}

              {/* Filter Status */}
              <div className="relative flex-1 sm:flex-none min-w-[130px] md:min-w-[140px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto md:w-40 h-10 pl-3 md:pl-3.5 pr-8 md:pr-9 rounded-xl border border-border bg-base text-xs md:text-sm font-semibold text-text-primary focus:outline-none focus:border-primary shadow-subtle cursor-pointer transition-colors appearance-none"
                >
                  <option value="semua">Semua Status</option>
                  <option value="baru">Baru</option>
                  <option value="diverifikasi">Diverifikasi</option>
                  <option value="dijadwalkan">Dijadwalkan</option>
                  <option value="dikerjakan">Dikerjakan</option>
                  <option value="selesai">Selesai</option>
                  <option value="ditolak">Ditolak</option>
                </select>
                <ChevronDown className="h-4 w-4 absolute right-3 md:right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>

              {/* Filter Fungsi Jalan */}
              <div className="relative flex-1 sm:flex-none min-w-[130px] md:min-w-[140px]">
                <select
                  value={fungsiJalanFilter}
                  onChange={(e) => setFungsiJalanFilter(e.target.value)}
                  className="w-full sm:w-auto md:w-40 h-10 pl-3 md:pl-3.5 pr-8 md:pr-9 rounded-xl border border-border bg-base text-xs md:text-sm font-semibold text-text-primary focus:outline-none focus:border-primary shadow-subtle cursor-pointer transition-colors appearance-none capitalize"
                >
                  <option value="semua">Semua Jalan</option>
                  <option value="arteri">Arteri</option>
                  <option value="kolektor">Kolektor</option>
                  <option value="lokal">Lokal</option>
                  <option value="lingkungan">Lingkungan</option>
                </select>
                <ChevronDown className="h-4 w-4 absolute right-3 md:right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>

              {/* Filter Prioritas */}
              <div className="relative flex-1 sm:flex-none min-w-[130px] md:min-w-[140px]">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full sm:w-auto md:w-40 h-10 pl-3 md:pl-3.5 pr-8 md:pr-9 rounded-xl border border-border bg-base text-xs md:text-sm font-semibold text-text-primary focus:outline-none focus:border-primary shadow-subtle cursor-pointer transition-colors appearance-none"
                >
                  <option value="semua">Semua Prioritas</option>
                  <option value="critical">Kritis (75–100)</option>
                  <option value="high">Tinggi (50–74)</option>
                  <option value="medium">Sedang (25–49)</option>
                  <option value="low">Rendah (0–24)</option>
                </select>
                <ChevronDown className="h-4 w-4 absolute right-3 md:right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>

              {/* Tombol Toggle Potensi Duplikat */}
              <Button
                variant={duplicateOnlyFilter ? "default" : "outline"}
                size="sm"
                onClick={() => setDuplicateOnlyFilter(!duplicateOnlyFilter)}
                className="w-full sm:w-auto h-10 text-xs md:text-sm font-medium flex items-center justify-center gap-1.5 md:gap-2 shadow-subtle shrink-0 px-3 md:px-4"
              >
                <Copy className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="truncate">
                  Duplikat ({reports.filter((r) => (r.duplicateCount || 0) > 0).length})
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List Queue Table (Desktop) & Cards (Mobile) */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Tidak Ada Laporan di Queue"
          description="Tidak ditemukan laporan yang sesuai dengan kriteria filter atau kata kunci pencarian saat ini."
        />
      ) : (
        <Card className="overflow-hidden border-border/80 shadow-xs bg-base">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface border-b border-border/80 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        filtered.filter((r) => r.status === "baru").length > 0 &&
                        selectedIds.length ===
                          filtered.filter((r) => r.status === "baru").length
                      }
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Prioritas</th>
                  <th className="px-4 py-3 font-semibold">Fungsi Jalan</th>
                  <th className="px-5 py-3 font-semibold">Lokasi Kerusakan</th>
                  <th className="px-4 py-3 font-semibold">Pelapor</th>
                  <th className="px-4 py-3 font-semibold">Status & Usia</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const prio = getPriorityVal(item);
                  const isSelected = selectedIds.includes(item.id);
                  const isUnverified = item.status === "baru";

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "hover:bg-surface/50 transition-colors",
                        isSelected ? "bg-primary-soft/30" : ""
                      )}
                    >
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          disabled={!isUnverified}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4 disabled:opacity-30"
                        />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PriorityBadge priorityValue={prio} size="sm" />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-semibold text-text-primary capitalize bg-surface px-2.5 py-1 rounded-lg border border-border/60">
                          {item.fungsi_jalan || "lokal"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-medium text-text-primary">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="truncate max-w-[200px] lg:max-w-xs">{item.address_text || "Titik Jalan"}</span>
                          {(item.duplicateCount || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-feedback-warning/15 text-feedback-warning border border-feedback-warning/30 shrink-0">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Duplikat ({item.duplicateCount})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-text-secondary text-xs truncate max-w-[140px]">
                        {item.profiles?.full_name || "Warga"}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={item.status} />
                          {item.is_stale && (
                            <StalenessBadge daysWaiting={item.hari_menunggu || 0} />
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link href={`/admin/queue/${item.id}`}>
                          <Button variant="outline" size="sm" className="font-semibold text-xs h-8 px-3">
                            Detail & Aksi
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Mobile-First, zero horizontal overflow) */}
          <div className="md:hidden divide-y divide-border">
            {filtered.map((item) => {
              const prio = getPriorityVal(item);

              return (
                <Link
                  key={item.id}
                  href={`/admin/queue/${item.id}`}
                  className="p-3.5 sm:p-4 block hover:bg-surface/50 active:bg-surface transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* 1. Thumbnail */}
                    <div className="relative h-[72px] w-[72px] rounded-xl overflow-hidden bg-surface border border-border/80 shrink-0 self-start mt-0.5">
                      <Image
                        src={item.photo_url}
                        alt="Foto Laporan"
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* 2. Primary: Priority & Status */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <PriorityBadge priorityValue={prio} size="sm" />
                        <StatusBadge status={item.status} />
                      </div>

                      {/* 3. Main Info: Alamat (Maksimal 2 baris, wrap natural) */}
                      <p className="text-xs sm:text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
                        {item.address_text || "Titik Jalan Kerusakan"}
                      </p>

                      {/* 4. Secondary: Fungsi Jalan & Tanggal */}
                      <div className="flex items-center justify-between gap-2 text-[11px] text-text-secondary pt-0.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-surface text-text-secondary font-medium border border-border/60 capitalize text-[10px]">
                          Jalan {item.fungsi_jalan || "lokal"}
                        </span>
                        <span className="text-text-tertiary shrink-0 font-medium text-[11px]">
                          {new Date(item.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      {/* 5 & 6. Metadata Tambahan: Menunggu X Hari & Duplikat */}
                      {(item.is_stale || (item.duplicateCount || 0) > 0) && (
                        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                          {item.is_stale && (
                            <StalenessBadge daysWaiting={item.hari_menunggu || 0} />
                          )}
                          {(item.duplicateCount || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-feedback-warning/15 text-feedback-warning border border-feedback-warning/30 shadow-2xs">
                              <AlertCircle className="h-3 w-3 text-feedback-warning shrink-0" />
                              <span>Duplikat ({item.duplicateCount})</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 7. Dedicated Navigation Chevron */}
                    <div className="shrink-0 self-center pl-1 text-text-tertiary">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
