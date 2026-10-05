"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StalenessBadge } from "@/components/shared/StalenessBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ImageBoundingBox } from "@/components/shared/ImageBoundingBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  UserPlus,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  Calculator,
  Layers,
} from "lucide-react";
import { ReportStatus, SeverityLevel, FungsiJalan } from "@/types/database";
import { calculateStaleness } from "@/lib/scoring/priority";

interface DetectionItem {
  id: string;
  damage_type: string;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
}

interface PetugasOption {
  id: string;
  full_name: string;
  wilayah: string | null;
}

interface ReportDetail {
  id: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  address_text: string | null;
  description: string | null;
  fungsi_jalan?: FungsiJalan | null;
  status: ReportStatus;
  rejection_reason: string | null;
  created_at: string;
  hari_menunggu?: number;
  is_stale?: boolean;
  profiles?: {
    full_name: string;
    phone: string | null;
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
  detections?: DetectionItem[];
}

export default function DetailLaporanAdminPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [petugasList, setPetugasList] = useState<PetugasOption[]>([]);
  const [selectedPetugas, setSelectedPetugas] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    if (!reportId) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) {
        throw new Error(`Gagal memuat detail laporan: ${res.status}`);
      }
      const json = await res.json();
      const root = json.data || json;
      const rep = root.report || json.report;

      if (rep) {
        const { hariMenunggu, isStale } = calculateStaleness(rep.created_at, rep.status);
        setReport({
          ...(rep as unknown as ReportDetail),
          hari_menunggu: hariMenunggu,
          is_stale: isStale,
        });
      }

      const activePet = root.active_petugas || json.active_petugas;
      if (Array.isArray(activePet)) {
        setPetugasList(activePet);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reportId]);

  const handleVerify = async (action: "verify" | "reject") => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "reject" ? rejectReason : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal memproses verifikasi");
      }

      setMessage({
        type: "success",
        text: action === "verify" ? "Laporan berhasil diverifikasi!" : "Laporan telah ditolak.",
      });
      setShowRejectInput(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPetugas) {
      setMessage({ type: "error", text: "Silakan pilih petugas lapangan terlebih dahulu." });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petugas_id: selectedPetugas }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch (e) {
        // Fallback bila response body tidak valid JSON
      }

      if (!res.ok) {
        throw new Error(json?.error?.message || `Gagal menugaskan petugas (Status: ${res.status})`);
      }

      setMessage({ type: "success", text: "Tugas berhasil diteruskan ke Petugas Lapangan!" });
      setSelectedPetugas("");
      await loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-text-secondary">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Laporan Tidak Ditemukan</h2>
        <Link href="/admin/queue">
          <Button variant="outline" size="sm">
            Kembali ke Queue
          </Button>
        </Link>
      </div>
    );
  }

  const score = Array.isArray(report.priority_scores)
    ? report.priority_scores[0]
    : report.priority_scores;
  const priorityValue = score?.priority_value ?? 0;
  const sNorm = score?.s_norm ?? 0;
  const severityValue = score?.severity_value ?? 0;
  const exposureValue = score?.exposure_value ?? 50;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Detail Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Detail Laporan #{report.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Diterima pada {new Date(report.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })} WIB
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <StatusBadge status={report.status} />
          <PriorityBadge priorityValue={priorityValue} size="sm" />
          {report.is_stale && (
            <StalenessBadge daysWaiting={report.hari_menunggu || 0} />
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-feedback-success/10 border-feedback-success/30 text-feedback-success"
              : "bg-feedback-error/10 border-feedback-error/30 text-feedback-error"
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid 2 Kolom (Desktop) & Stack Vertikal (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Foto dengan Bounding Box & Informasi Laporan */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="overflow-hidden border-border/80 shadow-xs bg-base rounded-2xl">
            {report.photo_url ? (
              <ImageBoundingBox
                src={report.photo_url}
                alt="Foto Kerusakan Jalan"
                detections={report.detections || []}
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-black/5 flex items-center justify-center text-xs text-text-secondary">
                Foto tidak tersedia
              </div>
            )}

            {/* Informasi Laporan Terstruktur */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Lokasi Kerusakan */}
              <div>
                <div className="flex items-center gap-2 text-text-primary">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Lokasi Kerusakan
                  </span>
                </div>
                <div className="pl-6 mt-1 text-xs space-y-0.5">
                  <p className="text-text-primary font-medium leading-relaxed">
                    {report.address_text || "Alamat lokasi tidak tersedia"}
                  </p>
                  <p className="text-[11px] font-mono text-text-tertiary">
                    Koordinat: {report.latitude}, {report.longitude}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/80" />

              {/* Klasifikasi Fungsi Jalan */}
              <div>
                <div className="flex items-center gap-2 text-text-primary">
                  <Layers className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Klasifikasi Fungsi Jalan
                  </span>
                </div>
                <div className="pl-6 mt-1 text-xs">
                  <p className="font-semibold capitalize text-text-primary">
                    Jalan {report.fungsi_jalan || "lokal"}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Bobot Exposure (E): <span className="font-mono font-bold text-primary">{exposureValue}</span>
                  </p>
                </div>
              </div>

              <div className="border-t border-border/80" />

              {/* Pelapor */}
              <div>
                <div className="flex items-center gap-2 text-text-primary">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Pelapor
                  </span>
                </div>
                <div className="pl-6 mt-1 text-xs text-text-secondary">
                  <p className="text-text-primary font-semibold">
                    {report.profiles?.full_name || "Warga Anonim"}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-0.5">
                    {report.profiles?.phone ? `Kontak: ${report.profiles.phone}` : "Tanpa kontak telepon"}
                  </p>
                </div>
              </div>

              {/* Catatan Warga (jika ada) */}
              {report.description && (
                <>
                  <div className="border-t border-border/80" />
                  <div>
                    <div className="flex items-center gap-2 text-text-primary">
                      <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Catatan Warga
                      </span>
                    </div>
                    <div className="pl-6 mt-1.5">
                      <div className="p-3 rounded-xl bg-surface border border-border/80 text-xs text-text-secondary leading-relaxed">
                        {report.description}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Kolom Kanan: Breakdown Skor Transparan & Panel Aksi */}
        <div className="lg:col-span-5 space-y-5">
          {/* Breakdown Skor Transparan */}
          <Card className="border-border/80 shadow-xs bg-base rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60 bg-surface/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Prioritas Penanganan (AI Scoring)
                </CardTitle>
                <PriorityBadge priorityValue={priorityValue} size="sm" />
              </div>
            </CardHeader>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-border text-center space-y-1">
                <div className="text-xs text-text-secondary font-medium">Skor Prioritas Rekomendasi</div>
                <div className="text-3xl sm:text-4xl font-extrabold text-primary font-mono tracking-tight">
                  {priorityValue}
                </div>
                <div className="text-[11px] text-text-secondary">
                  Skala 0 – 100 (Diurutkan otomatis di Queue Admin)
                </div>
              </div>

              {/* Rincian Komponen Numerik Formula */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-text-primary">
                  <Calculator className="h-3.5 w-3.5 text-primary" />
                  <span>Rincian Komponen Formula:</span>
                </div>

                <div className="p-3.5 bg-surface rounded-xl border border-border/80 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-text-secondary py-0.5">
                    <span>Severity Raw (unbounded):</span>
                    <span className="font-mono font-bold text-text-primary">{severityValue}</span>
                  </div>
                  <div className="border-t border-border/60" />
                  <div className="flex justify-between items-center text-text-secondary py-0.5">
                    <span>S_norm (Normalisasi Cap P95):</span>
                    <span className="font-mono font-bold text-text-primary">{sNorm} <span className="text-text-tertiary font-normal">/ 100</span></span>
                  </div>
                  <div className="border-t border-border/60" />
                  <div className="flex justify-between items-center text-text-secondary py-0.5">
                    <span className="capitalize">Exposure E ({report.fungsi_jalan || "lokal"}):</span>
                    <span className="font-mono font-bold text-text-primary">{exposureValue} <span className="text-text-tertiary font-normal">/ 100</span></span>
                  </div>
                  <div className="pt-2.5 border-t border-border/70 text-[10px]">
                    <span className="font-semibold text-text-secondary block mb-1">Formula Resmi:</span>
                    <div className="p-2 rounded-lg bg-base border border-border/80 font-mono text-primary font-bold text-center break-all">
                      Priority = (0.70 × {sNorm}) + (0.30 × {exposureValue}) = {priorityValue}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Panel Aksi Verifikasi / Tolak / Penugasan */}
          <Card className="border-border/80 shadow-xs bg-base rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60 bg-surface/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Aksi Keputusan Admin
              </CardTitle>
            </CardHeader>
            <div className="p-4 sm:p-5 space-y-4">
              {report.status === "baru" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="sm"
                      onClick={() => handleVerify("verify")}
                      disabled={actionLoading}
                      className="gap-1.5 min-h-[44px] font-bold text-xs"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Verifikasi
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowRejectInput(true)}
                      disabled={actionLoading}
                      className="gap-1.5 min-h-[44px] font-bold text-xs"
                    >
                      <XCircle className="h-4 w-4" />
                      Tolak
                    </Button>
                  </div>

                  {showRejectInput && (
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <Input
                        placeholder="Alasan penolakan laporan..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="text-xs h-9"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRejectInput(false)}
                          className="text-xs"
                        >
                          Batal
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleVerify("reject")}
                          disabled={!rejectReason || actionLoading}
                          className="text-xs"
                        >
                          Konfirmasi Tolak
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Panel Penugasan Petugas (Diverifikasi) */}
              {report.status === "diverifikasi" && (
                <div className="space-y-3">
                  <div className="text-xs text-text-secondary font-medium">
                    Tugaskan Petugas Lapangan:
                  </div>
                  <div className="space-y-2">
                    <select
                      value={selectedPetugas}
                      onChange={(e) => setSelectedPetugas(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-base text-xs font-semibold text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="">-- Pilih Petugas Lapangan --</option>
                      {petugasList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} ({p.wilayah || "Seluruh Wilayah"})
                        </option>
                      ))}
                    </select>

                    <Button
                      size="sm"
                      onClick={handleAssign}
                      disabled={!selectedPetugas || actionLoading}
                      className="w-full gap-1.5 min-h-[44px] font-bold text-xs"
                    >
                      <UserPlus className="h-4 w-4" />
                      Tugaskan Sekarang
                    </Button>
                  </div>
                </div>
              )}

              {["dijadwalkan", "dikerjakan", "selesai", "ditolak"].includes(report.status) && (
                <div className="p-3 bg-surface rounded-xl border border-border/60 text-xs text-text-secondary text-center">
                  Status laporan saat ini: <strong className="capitalize">{report.status}</strong>.
                  {report.rejection_reason && (
                    <div className="mt-1 text-feedback-error font-medium">
                      Alasan: {report.rejection_reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
