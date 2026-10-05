"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PhotoUploader } from "@/components/forms/PhotoUploader";
import { LocationPicker } from "@/components/forms/LocationPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MapPin,
  Compass,
  FileText,
  Camera,
  Layers,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { FungsiJalan } from "@/types/database";

interface FungsiJalanOption {
  value: FungsiJalan;
  label: string;
  badge: string;
  explanation: string;
  example: string;
}

const FUNGSI_JALAN_OPTIONS: FungsiJalanOption[] = [
  {
    value: "arteri",
    label: "Jalan Arteri",
    badge: "Prioritas Tertinggi (E: 100)",
    explanation: "Jalan raya utama penghubung antar-kota atau jalur logistik nasional berkecepatan tinggi.",
    example: "Contoh: Jalan Bypass, Jalur Pantura, Jalan Protokol Kota Utama",
  },
  {
    value: "kolektor",
    label: "Jalan Kolektor",
    badge: "Prioritas Tinggi (E: 75)",
    explanation: "Jalan penghubung kawasan permukiman luas ke jalan utama kota.",
    example: "Contoh: Jalan penghubung antar-kecamatan, jalan lingkar kawasan",
  },
  {
    value: "lokal",
    label: "Jalan Lokal",
    badge: "Prioritas Menengah (E: 50)",
    explanation: "Jalan di dalam permukiman, perkantoran, atau perumahan warga umum.",
    example: "Contoh: Jalan perumahan, jalan antar-kelurahan",
  },
  {
    value: "lingkungan",
    label: "Jalan Lingkungan",
    badge: "Prioritas Ringan (E: 25)",
    explanation: "Akses jalan kecil di dalam gang, perkampungan, atau jalan buntu warga sekitar.",
    example: "Contoh: Gang perumahan, jalan setapak beraspal warga",
  },
];

export default function LaporPage() {
  const router = useRouter();

  // Multi-step State untuk Mobile: 1. Foto -> 2. Lokasi -> 3. Fungsi Jalan -> 4. Keterangan -> 5. Konfirmasi
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    addressText: string;
  } | null>(null);

  const [fungsiJalan, setFungsiJalan] = useState<FungsiJalan>("lokal");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePhotoSelected = (file: File, previewUrl: string) => {
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
  };

  const handleLocationSelected = (loc: {
    latitude: number;
    longitude: number;
    addressText: string;
  }) => {
    setLocation(loc);
  };

  const handleSubmitReport = async () => {
    if (!photoFile) {
      setErrorMessage("Silakan ambil atau unggah foto kerusakan jalan terlebih dahulu.");
      return;
    }
    if (!location) {
      setErrorMessage("Titik lokasi GPS jalan wajib ditentukan.");
      return;
    }
    if (!fungsiJalan) {
      setErrorMessage("Silakan pilih fungsi jalan yang dilaporkan.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      // 1. Upload foto asli ke Supabase Storage (bucket: reports) sesuai target kompresi client ~1MB
      const fileExt = photoFile.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, photoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        setErrorMessage("Gagal mengunggah foto ke storage: " + (uploadError.message || "Periksa koneksi Anda."));
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("reports")
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // 2. Panggil API POST /api/reports menyertakan fungsi_jalan
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photo_url: publicUrl,
          latitude: location.latitude,
          longitude: location.longitude,
          address_text: location.addressText,
          description: description || null,
          fungsi_jalan: fungsiJalan,
        }),
      });

      const jsonResult = await res.json();

      if (!res.ok) {
        const detailMsg = jsonResult.error?.details ? ` (${jsonResult.error.details})` : "";
        throw new Error((jsonResult.error?.message || "Gagal mengirimkan laporan") + detailMsg);
      }

      const reportId = jsonResult.data?.report?.id;
      // 3. Redirect ke Halaman Hasil Deteksi
      router.push(`/pelapor/lapor/hasil/${reportId}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses laporan");
      setSubmitting(false);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "Foto Kerusakan";
      case 2:
        return "Titik Lokasi";
      case 3:
        return "Fungsi Jalan";
      case 4:
        return "Keterangan";
      case 5:
        return "Konfirmasi";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-6xl mx-auto pb-12">
      {/* Mobile Stepper Header (5 Langkah) */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary">
            Langkah {currentStep} dari {totalSteps}
          </span>
          <span className="text-[11px] font-semibold text-primary">
            {getStepTitle(currentStep)}
          </span>
        </div>

        {/* 5-Segment Visual Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep >= stepNum ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Lapor Kerusakan Jalan
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Ambil foto, tentukan titik lokasi, dan pilih fungsi jalan. Kecerdasan buatan RUAS akan memverifikasi kerusakan dan menghitung Prioritas Penanganan secara transparan.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-feedback-error/10 border border-feedback-error/30 text-feedback-error text-xs flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid Layout: Desktop (2 Kolom) vs Mobile (5-Step Wizard) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: 1. Foto Kerusakan, 2. Lokasi Kerusakan */}
        <div className="md:col-span-6 space-y-6 min-w-0">
          {/* Card 1: Foto Kerusakan Jalan */}
          <Card
            className={cn(
              "border-border/80 shadow-subtle bg-base rounded-2xl overflow-hidden",
              currentStep !== 1 && "hidden md:block"
            )}
          >
            <div className="p-5 pb-3 border-b border-border/60 bg-surface/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-7 w-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0">
                  1
                </span>
                <h2 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                  Foto Kerusakan Jalan <span className="text-xs font-semibold text-text-secondary">(Wajib)</span>
                </h2>
              </div>
              <Camera className="h-4 w-4 text-text-secondary" />
            </div>

            <div className="p-5 space-y-4">
              <PhotoUploader
                onImageSelected={handlePhotoSelected}
                onImageCleared={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                initialPreviewUrl={photoPreview}
              />
            </div>
          </Card>

          {/* Card 2: Lokasi Kerusakan */}
          <Card
            className={cn(
              "border-border/80 shadow-subtle bg-base rounded-2xl overflow-hidden",
              currentStep !== 2 && "hidden md:block"
            )}
          >
            <div className="p-5 pb-3 border-b border-border/60 bg-surface/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-7 w-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0">
                  2
                </span>
                <h2 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                  Lokasi Kerusakan Jalan <span className="text-xs font-semibold text-text-secondary">(Wajib)</span>
                </h2>
              </div>
              <MapPin className="h-4 w-4 text-text-secondary" />
            </div>

            <div className="p-5 space-y-4">
              <LocationPicker onLocationSelected={handleLocationSelected} />
            </div>
          </Card>
        </div>

        {/* Kolom Kanan: 3. Fungsi Jalan, 4. Keterangan Tambahan, 5. Konfirmasi & Kirim */}
        <div className="md:col-span-6 space-y-6 min-w-0">
          {/* Card 3: Fungsi Jalan (Komponen Exposure E) */}
          <Card
            className={cn(
              "border-border/80 shadow-subtle bg-base rounded-2xl overflow-hidden",
              currentStep !== 3 && "hidden md:block"
            )}
          >
            <div className="p-5 pb-3 border-b border-border/60 bg-surface/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-7 w-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0">
                  3
                </span>
                <h2 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                  Fungsi Jalan <span className="text-xs font-semibold text-text-secondary">(Wajib)</span>
                </h2>
              </div>
              <Layers className="h-4 w-4 text-text-secondary" />
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed">
                Pilih kategori jalan di mana kerusakan berada. Fungsi jalan menentukan bobot paparan lalu lintas (Exposure) pada formula prioritas perbaikan dinas.
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {FUNGSI_JALAN_OPTIONS.map((opt) => {
                  const isSelected = fungsiJalan === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setFungsiJalan(opt.value)}
                      className={cn(
                        "p-3.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col gap-1",
                        isSelected
                          ? "border-primary bg-primary-soft/50 ring-1 ring-primary shadow-xs"
                          : "border-border hover:border-primary/50 bg-base"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-border bg-base"
                            )}
                          >
                            {isSelected && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-text-primary">
                            {opt.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-base border border-border text-text-secondary">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary pl-6 leading-relaxed">
                        {opt.explanation}
                      </p>
                      <span className="text-[10px] text-primary/80 pl-6 font-medium italic">
                        {opt.example}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Card 4: Keterangan Tambahan */}
          <Card
            className={cn(
              "border-border/80 shadow-subtle bg-base rounded-2xl overflow-hidden",
              currentStep !== 4 && "hidden md:block"
            )}
          >
            <div className="p-5 pb-3 border-b border-border/60 bg-surface/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-7 w-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0">
                  4
                </span>
                <h2 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                  Keterangan Tambahan <span className="text-xs font-semibold text-text-secondary">(Opsional)</span>
                </h2>
              </div>
              <FileText className="h-4 w-4 text-text-secondary" />
            </div>

            <div className="p-5 space-y-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Lubang cukup dalam di dekat belokan jalan, membahayakan pengendara motor terutama saat hujan atau malam hari..."
                rows={3}
                className="w-full rounded-xl border border-border bg-surface p-3.5 text-xs sm:text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
              />
            </div>
          </Card>

          {/* Card 5: Konfirmasi & Kirim */}
          <Card
            className={cn(
              "border-border/80 shadow-subtle bg-base rounded-2xl overflow-hidden",
              currentStep !== 5 && "hidden md:block"
            )}
          >
            <div className="p-5 pb-3 border-b border-border/60 bg-surface/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-7 w-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0">
                  5
                </span>
                <h2 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                  Konfirmasi & Kirim Laporan
                </h2>
              </div>
              <CheckCircle2 className="h-4 w-4 text-text-secondary" />
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2.5 text-xs text-text-secondary border-t border-b border-border/80 py-3.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="shrink-0">Foto Kerusakan:</span>
                  <span
                    className={cn(
                      "font-semibold text-right",
                      photoFile ? "text-feedback-success" : "text-text-muted"
                    )}
                  >
                    {photoFile ? "✓ Terlampir" : "Belum Dipilih"}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="shrink-0">Titik Koordinat:</span>
                  <span
                    className={cn(
                      "font-semibold text-right font-mono text-[11px]",
                      location ? "text-feedback-success" : "text-text-muted"
                    )}
                  >
                    {location
                      ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                      : "Belum Ditentukan"}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="shrink-0">Fungsi Jalan:</span>
                  <span className="font-bold text-primary capitalize text-right">
                    {fungsiJalan} (Bobot E: {FUNGSI_JALAN_OPTIONS.find((o) => o.value === fungsiJalan)?.badge.split(" ")[2].replace(")", "") || 50})
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-text-muted">Alamat Terdeteksi:</span>
                  <p className="font-semibold text-text-primary text-xs break-words bg-surface p-2.5 rounded-lg border border-border/60">
                    {location?.addressText || "Menunggu penentuan titik koordinat..."}
                  </p>
                </div>
              </div>

              {/* Tombol Kirim Utama */}
              <Button
                type="button"
                size="lg"
                onClick={handleSubmitReport}
                disabled={submitting || !photoFile || !location}
                className="w-full gap-2 font-bold h-11 text-xs sm:text-sm shadow-card"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menganalisis AI & Menghitung Prioritas...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Kirim Laporan Kerusakan
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Step Navigator Controls (Next / Back) */}
      <div className="mt-4 flex md:hidden items-center justify-between gap-3 pt-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1 || submitting}
          className="text-xs h-10 px-4 min-w-[100px]"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Sebelumnya
        </Button>

        {currentStep < totalSteps ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
            disabled={
              (currentStep === 1 && !photoFile) ||
              (currentStep === 2 && !location)
            }
            className="text-xs font-semibold h-10 px-4 min-w-[100px]"
          >
            Selanjutnya
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
