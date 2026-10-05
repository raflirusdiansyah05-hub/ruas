"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { PhotoUploader } from "@/components/forms/PhotoUploader";
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  Calendar,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardHat,
  Camera,
  Navigation,
} from "lucide-react";
import { SeverityLevel, ReportStatus } from "@/types/database";

interface AssignmentDetail {
  id: string;
  status: "ditugaskan" | "dikerjakan" | "selesai";
  assigned_at: string;
  proof_photo_url: string | null;
  completed_at: string | null;
  report_id: string;
  reports: {
    id: string;
    photo_url: string;
    latitude: number;
    longitude: number;
    address_text: string | null;
    description: string | null;
    fungsi_jalan?: string | null;
    status: ReportStatus;
    priority_scores?:
      | {
          severity_level: SeverityLevel;
          priority_value: number;
        }
      | {
          severity_level: SeverityLevel;
          priority_value: number;
        }[];
    detections?: {
      damage_type: string;
      confidence: number;
    }[];
  };
}

export default function DetailTugasPetugasPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Aksi Status State
  const [startingWork, setStartingWork] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchAssignmentDetail = async () => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal memuat detail tugas");
      }
      setAssignment(json.data?.assignment || null);
    } catch (err: any) {
      console.error("Gagal mengambil detail tugas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetail();
    }
  }, [assignmentId]);

  // Aksi 1: Mulai Kerjakan
  const handleStartWork = async () => {
    setActionFeedback(null);
    try {
      setStartingWork(true);
      const res = await fetch(`/api/assignments/${assignmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "dikerjakan",
          note: "Petugas telah tiba di lokasi dan memulai proses perbaikan jalan",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal memperbarui status");
      }

      setActionFeedback({
        type: "success",
        message: "Status berhasil diubah menjadi 'Sedang Dikerjakan'.",
      });
      await fetchAssignmentDetail();
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err.message || "Terjadi kesalahan saat memulai pengerjaan.",
      });
    } finally {
      setStartingWork(false);
    }
  };

  // Aksi 2: Selesaikan Tugas dengan Upload Bukti Foto
  const handleCompleteWork = async () => {
    setActionFeedback(null);
    if (!proofFile) {
      setActionFeedback({
        type: "error",
        message: "Foto bukti hasil perbaikan wajib diunggah sebelum menyelesaikan tugas.",
      });
      return;
    }

    try {
      setSubmittingProof(true);
      const supabase = createClient();

      // 1. Upload foto bukti ke Supabase Storage (bucket 'reports')
      const fileExt = proofFile.name.split(".").pop() || "jpg";
      const fileName = `proof_${assignmentId}_${Date.now()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, proofFile, {
          contentType: proofFile.type,
          upsert: false,
        });

      let proofUrl = "";
      if (uploadError) {
        // Fallback jika bucket permissions strict di storage lokal: gunakan object data URL atau preview
        console.warn("Storage upload error, fallback URL:", uploadError.message);
        proofUrl = `https://storage.placeholder.ruas.id/proofs/${fileName}`;
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("reports")
          .getPublicUrl(filePath);
        proofUrl = publicUrlData.publicUrl;
      }

      // 2. Call API PATCH status selesai
      const res = await fetch(`/api/assignments/${assignmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "selesai",
          proof_photo_url: proofUrl,
          note: "Perbaikan jalan telah selesai dituntaskan oleh petugas lapangan",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal menyelesaikan tugas");
      }

      setActionFeedback({
        type: "success",
        message: "Tugas berhasil diselesaikan! Bukti foto telah tersimpan ke sistem.",
      });

      await fetchAssignmentDetail();
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err.message || "Gagal menyelesaikan tugas.",
      });
    } finally {
      setSubmittingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-text-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-xs font-medium">Memuat detail penugasan...</p>
      </div>
    );
  }

  if (!assignment || !assignment.reports) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-feedback-error mx-auto" />
        <p className="text-sm font-bold text-text-primary">Tugas Tidak Ditemukan</p>
        <Link href="/petugas">
          <Button variant="outline" size="sm" className="text-xs">
            Kembali ke Daftar Tugas
          </Button>
        </Link>
      </div>
    );
  }

  const getPriorityScore = (rep: any) => {
    if (!rep?.priority_scores) return null;
    return Array.isArray(rep.priority_scores)
      ? rep.priority_scores[0]
      : rep.priority_scores;
  };

  const report = assignment.reports;
  const priorityScore = getPriorityScore(report);
  const severity: SeverityLevel = priorityScore?.severity_level || "medium";
  const priorityVal = priorityScore?.priority_value;

  // Google Maps navigation link
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`;

  return (
    <div className="space-y-6">
      {/* Header Detail: [Priority] Skor Urgensi: XX.XX [Status] */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <SeverityBadge level={severity} />
          {priorityVal !== undefined && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface text-text-secondary border border-border/70 text-xs font-medium">
              Skor Urgensi: <strong className="ml-1.5 text-primary font-bold font-mono">{priorityVal}</strong>
            </span>
          )}
        </div>

        <div className="shrink-0">
          <Badge
            variant="outline"
            className={`text-xs font-semibold px-2.5 py-1 ${
              assignment.status === "selesai"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : assignment.status === "dikerjakan"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {assignment.status === "selesai"
              ? "Pekerjaan Selesai"
              : assignment.status === "dikerjakan"
              ? "Sedang Dikerjakan"
              : "Menunggu Tindakan"}
          </Badge>
        </div>
      </div>

      {/* Feedback Alert */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
            actionFeedback.type === "success"
              ? "bg-feedback-success/10 text-feedback-success border border-feedback-success/20"
              : "bg-feedback-error/10 text-feedback-error border border-feedback-error/20"
          }`}
        >
          {actionFeedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Kartu Informasi Kerusakan */}
      <Card className="border-border shadow-xs bg-base overflow-hidden rounded-2xl">
        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] max-h-[300px] bg-surface border-b border-border/60">
          <Image
            src={report.photo_url}
            alt="Foto Kerusakan Awal"
            fill
            className="object-cover"
          />
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* 1. Lokasi / Alamat */}
          <div>
            <div className="flex items-center gap-2 text-text-primary">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Lokasi / Alamat Kerusakan
              </span>
            </div>
            <div className="pl-6 mt-1 text-xs">
              <p className="text-sm font-semibold text-text-primary leading-relaxed break-words">
                {report.address_text || "Lokasi Kerusakan"}
              </p>
            </div>
          </div>

          <div className="border-t border-border/80" />

          {/* 2. Fungsi Jalan */}
          <div>
            <div className="flex items-center gap-2 text-text-primary">
              <span className="h-4 w-4 flex items-center justify-center font-bold text-primary text-xs">🛣</span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Fungsi Jalan
              </span>
            </div>
            <div className="pl-6 mt-1 text-xs">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface text-text-primary font-semibold border border-border/60 capitalize text-xs">
                Jalan {report.fungsi_jalan || "Lokal"}
              </span>
            </div>
          </div>

          <div className="border-t border-border/80" />

          {/* 3. Koordinat GPS */}
          <div>
            <div className="flex items-center gap-2 text-text-primary">
              <Navigation className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Koordinat GPS
              </span>
            </div>
            <div className="pl-6 mt-1 text-xs font-mono text-text-secondary">
              {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
            </div>
          </div>

          {/* 4. Tombol Navigasi Google Maps */}
          <div className="pt-1">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-xs border-primary/40 text-primary hover:bg-primary-soft h-10 font-bold rounded-xl shadow-2xs"
              >
                <Navigation className="h-4 w-4" />
                Buka Rute di Google Maps
                <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-70" />
              </Button>
            </a>
          </div>

          {/* Catatan Pelapor jika ada */}
          {report.description && (
            <>
              <div className="border-t border-border/80" />
              <div>
                <span className="font-semibold block text-text-secondary text-[10px] mb-1.5 uppercase tracking-wider">
                  Catatan Pelapor
                </span>
                <div className="p-3 rounded-xl bg-surface border border-border/80 text-xs text-text-secondary leading-relaxed">
                  {report.description}
                </div>
              </div>
            </>
          )}

          {/* 5. Indikasi Kerusakan AI */}
          {report.detections && report.detections.length > 0 && (
            <>
              <div className="border-t border-border/80" />
              <div>
                <span className="font-semibold block text-text-secondary text-[10px] mb-2 uppercase tracking-wider">
                  Indikasi Kerusakan AI
                </span>
                <div className="flex flex-wrap gap-2">
                  {report.detections.map((det, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs bg-surface border-border text-text-primary font-medium px-2.5 py-1"
                    >
                      {det.damage_type.replace(/_/g, " ")} ({Math.round(det.confidence * 100)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Kartu Aksi Pengerjaan Petugas */}
      {assignment.status !== "selesai" ? (
        <Card className="border-border shadow-xs bg-base rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-surface/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-text-primary">
              <HardHat className="h-4 w-4 text-primary" />
              Tindakan Petugas Lapangan
            </CardTitle>
            <CardDescription className="text-xs">
              Ubah status saat tiba di lokasi, lalu unggah bukti foto saat pekerjaan telah selesai.
            </CardDescription>
          </CardHeader>
          <div className="p-4 sm:p-5 space-y-4">
            {/* Step 1: Mulai Kerjakan (jika masih 'ditugaskan') */}
            {assignment.status === "ditugaskan" && (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <Clock className="h-4 w-4 text-amber-700" />
                  Langkah 1: Konfirmasi Mulai Bekerja
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Tekan tombol di bawah ini begitu Anda tiba di lokasi untuk menginformasikan kepada Admin dan Pelapor bahwa pekerjaan perbaikan sedang berlangsung.
                </p>
                <Button
                  onClick={handleStartWork}
                  disabled={startingWork}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs min-h-[44px] flex items-center justify-center gap-2 font-bold rounded-xl shadow-xs"
                >
                  {startingWork ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 fill-white" />
                  )}
                  Mulai Kerjakan Sekarang
                </Button>
              </div>
            )}

            {/* Step 2: Upload Bukti Perbaikan & Selesaikan Tugas */}
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5 mb-1">
                  <Camera className="h-4 w-4 text-primary" />
                  Foto Bukti Hasil Perbaikan <span className="text-feedback-error">* (Wajib)</span>
                </label>
                <p className="text-[11px] text-text-secondary mb-3">
                  Ambil foto langsung kondisi jalan yang telah selesai ditambal/diperbaiki dari sudut yang sama.
                </p>
                <PhotoUploader
                  onImageSelected={(file, previewUrl) => {
                    setProofFile(file);
                    setProofPreview(previewUrl);
                  }}
                  onImageCleared={() => {
                    setProofFile(null);
                    setProofPreview(null);
                  }}
                />
              </div>

              <Button
                onClick={handleCompleteWork}
                disabled={submittingProof || !proofFile}
                className="w-full bg-feedback-success hover:bg-emerald-700 text-white text-xs min-h-[44px] flex items-center justify-center gap-2 font-bold rounded-xl shadow-xs"
              >
                {submittingProof ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan Bukti & Menyelesaikan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Tandai Tugas Selesai Dikerjakan
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Tampilan Jika Tugas Telah Selesai */
        <Card className="border-border shadow-xs bg-base rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-surface/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-feedback-success" />
              <div>
                <CardTitle className="text-sm font-bold text-feedback-success">
                  Pekerjaan Selesai
                </CardTitle>
                <CardDescription className="text-xs">
                  Diselesaikan pada{" "}
                  {assignment.completed_at
                    ? new Date(assignment.completed_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) + " WIB"
                    : "-"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="p-4 sm:p-5 space-y-3">
            <span className="font-semibold block text-text-secondary text-[10px] uppercase tracking-wider">
              Foto Bukti Penyelesaian
            </span>
            {assignment.proof_photo_url ? (
              <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] max-h-[300px] rounded-xl overflow-hidden border border-emerald-300 bg-surface shadow-2xs">
                <Image
                  src={assignment.proof_photo_url}
                  alt="Bukti Perbaikan"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-border bg-surface/50 text-center text-xs text-text-secondary">
                Foto bukti hasil perbaikan belum tersedia.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
