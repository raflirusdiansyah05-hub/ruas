"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ImageBoundingBox } from "@/components/shared/ImageBoundingBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  MapPin,
  Sparkles,
  Layers,
  Calculator,
  ShieldCheck,
  Info,
} from "lucide-react";
import { ReportStatus, FungsiJalan } from "@/types/database";

interface DetectionItem {
  id: string;
  damage_type: string;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
}

interface ReportData {
  id: string;
  photo_url: string;
  address_text: string | null;
  fungsi_jalan?: FungsiJalan | null;
  status: ReportStatus;
  created_at: string;
}

interface ScoreData {
  severity_value: number;
  s_norm: number;
  exposure_value: number;
  priority_value: number;
}

const DAMAGE_LABEL_MAP: Record<string, string> = {
  lubang: "Lubang Jalan (Pothole)",
  retak_buaya: "Retak Buaya (Alligator Crack)",
  retak_melintang: "Retak Melintang (Transverse Crack)",
  retak_memanjang: "Retak Memanjang (Longitudinal Crack)",
};

export default function HasilDeteksiPage() {
  const params = useParams();
  const reportId = params?.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [detections, setDetections] = useState<DetectionItem[]>([]);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!reportId) return;
      try {
        const res = await fetch(`/api/reports/${reportId}`);
        if (!res.ok) {
          throw new Error(`Gagal memuat laporan (${res.status})`);
        }

        const json = await res.json();
        const data = json?.data;

        if (data?.report) {
          setReport(data.report as ReportData);
        }

        if (data?.detections) {
          setDetections(data.detections);
        }

        if (data?.priority_score) {
          setScore({
            severity_value: Number(data.priority_score.severity_value) || 0,
            s_norm: Number(data.priority_score.s_norm) || 0,
            exposure_value: Number(data.priority_score.exposure_value) || 50,
            priority_value: Number(data.priority_score.priority_value) || 0,
          });
        }
      } catch (err) {
        console.error("Gagal memuat hasil deteksi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <Cpu className="h-10 w-10 text-primary animate-pulse mb-3" />
        <h3 className="text-base font-bold text-text-primary">
          Menganalisis Hasil Deteksi AI...
        </h3>
        <p className="text-xs text-text-secondary mt-1">
          Menyiapkan visualisasi koordinat bounding box dan kalkulasi Prioritas Penanganan
        </p>
      </div>
    );
  }

  const priorityScore = score?.priority_value ?? 0;
  const sNorm = score?.s_norm ?? 0;
  const exposureValue = score?.exposure_value ?? 50;

  return (
    <div className="min-h-screen bg-surface py-6 px-4 sm:px-6 md:py-10">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/pelapor"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Status Laporan:</span>
            <StatusBadge status={report?.status || "baru"} />
          </div>
        </div>

        {/* Success Header */}
        <div className="p-4 sm:p-6 rounded-2xl bg-base border border-border shadow-subtle mb-6 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-feedback-success/15 text-feedback-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-xs font-semibold mb-1 border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              Laporan Berhasil Dianalisis AI
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              Hasil Analisis & Prioritas Penanganan
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Laporan Anda telah tercatat dan diurutkan secara transparan di antrean verifikasi dinas berdasarkan Skor Prioritas.
            </p>
          </div>
        </div>

        {/* Side-by-Side (Desktop) / Stack (Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Foto dengan Bounding Box Overlay */}
          <div className="md:col-span-7 space-y-4">
            <Card className="overflow-hidden border-border/80 shadow-subtle bg-base rounded-2xl">
              <div className="p-4 border-b border-border/60 flex items-center justify-between bg-surface/30">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Foto Kerusakan & Visualisasi Bounding Box
                </span>
                <span className="text-[11px] font-semibold text-primary">
                  {detections.length} Kerusakan Terdeteksi
                </span>
              </div>

              {/* Komponen Visual Bounding Box Overlay */}
              {report?.photo_url ? (
                <ImageBoundingBox
                  src={report.photo_url}
                  alt="Foto Kerusakan Jalan"
                  detections={detections}
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-black/5 flex items-center justify-center text-xs text-text-secondary">
                  Foto tidak tersedia
                </div>
              )}

              <div className="p-4 bg-surface/50 border-t border-border/60 flex items-center gap-2 text-xs text-text-secondary">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{report?.address_text || "Lokasi tercatat"}</span>
              </div>
            </Card>

            {/* List Deteksi AI Rinci */}
            <Card className="border-border/80 shadow-subtle bg-base rounded-2xl p-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                Objek Kerusakan Terverifikasi
              </h3>
              {detections.length === 0 ? (
                <p className="text-xs text-text-secondary italic">
                  Tidak ada kerusakan signifikan terdeteksi pada frame ini.
                </p>
              ) : (
                <div className="space-y-2">
                  {detections.map((d, idx) => (
                    <div
                      key={d.id || idx}
                      className="p-2.5 rounded-xl bg-surface border border-border/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-text-primary">
                          {DAMAGE_LABEL_MAP[d.damage_type] || d.damage_type}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-text-secondary">
                        Keyakinan: {(d.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Kolom Kanan: Priority Score & Breakdown Transparan */}
          <div className="md:col-span-5 space-y-4">
            <Card className="border-border/80 shadow-subtle bg-base rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Tingkat Prioritas
                  </span>
                  <PriorityBadge priorityValue={priorityScore} size="md" />
                </div>

                {/* Kartu Skor Utama */}
                <div className="p-4 rounded-xl bg-surface border border-border text-center space-y-1">
                  <div className="text-xs text-text-secondary font-medium">
                    Skor Prioritas Rekomendasi
                  </div>
                  <div className="text-4xl font-extrabold text-primary tracking-tight">
                    {priorityScore}
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    Skala 0 – 100 (Diurutkan di antrean dinas)
                  </div>
                </div>

                {/* Rincian Komponen Skor Transparan */}
                <div className="space-y-2.5 pt-2 border-t border-border text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-text-primary">
                    <Calculator className="h-3.5 w-3.5 text-primary" />
                    <span>Transparansi Komponen Skor:</span>
                  </div>

                  <div className="p-3 bg-surface rounded-xl border border-border/60 space-y-2 text-[11px]">
                    <div className="flex justify-between items-center text-text-secondary">
                      <span>1. Keparahan Terkoreksi (S_norm):</span>
                      <span className="font-mono font-bold text-text-primary">
                        {sNorm} <span className="text-[10px] text-text-muted">/ 100</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-text-secondary">
                      <span className="capitalize">2. Paparan Jalan ({report?.fungsi_jalan || "lokal"}):</span>
                      <span className="font-mono font-bold text-text-primary">
                        {exposureValue} <span className="text-[10px] text-text-muted">/ 100</span>
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/60 text-[10px] text-text-secondary leading-snug">
                      <span className="font-semibold text-text-primary">Formula Resmi RUAS:</span>
                      <p className="font-mono text-primary font-bold mt-0.5">
                        Priority = (0.70 × {sNorm}) + (0.30 × {exposureValue}) = {priorityScore}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Jaminan Penanganan & Tombol Aksi */}
                <div className="p-3 bg-primary-soft/60 rounded-xl border border-primary/20 text-[11px] text-text-secondary space-y-1">
                  <div className="flex items-center gap-1.5 text-primary font-bold">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Verifikasi Objektif & Adil</span>
                  </div>
                  <p className="leading-relaxed">
                    Prioritas dihitung secara murni berdasarkan tingkat kerusakan fisik dan volume lalu lintas jalan, menjamin penanganan yang berkeadilan bagi seluruh warga.
                  </p>
                </div>

                <div className="pt-2">
                  <Link href="/pelapor/riwayat" className="w-full">
                    <Button variant="default" className="w-full h-10 font-bold text-xs">
                      Pantau Status Laporan Saya
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
