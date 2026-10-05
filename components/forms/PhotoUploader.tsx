"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Camera, UploadCloud, X, AlertCircle } from "lucide-react";

interface PhotoUploaderProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  onImageCleared?: () => void;
  initialPreviewUrl?: string | null;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onImageSelected,
  onImageCleared,
  initialPreviewUrl,
}) => {
  const [preview, setPreview] = useState<string | null>(initialPreviewUrl || null);
  const [compressing, setCompressing] = useState(false);
  const [fileInfo, setFileInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Hanya format gambar yang didukung (JPG, PNG, WebP).");
      return;
    }

    try {
      setCompressing(true);
      const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);

      // Opsi kompresi client-side target ~1MB sesuai PRD & techstack.md Bagian 4.4
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);

      const objectUrl = URL.createObjectURL(compressedFile);
      setPreview(objectUrl);
      setFileInfo(`Ukuran: ${compressedSizeMB} MB (dikompresi dari ${originalSizeMB} MB)`);
      onImageSelected(compressedFile, objectUrl);
    } catch (err: any) {
      setError("Gagal mengompresi gambar. Silakan coba foto lain.");
    } finally {
      setCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onImageCleared) onImageCleared();
  };

  return (
    <div className="w-full space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {error && (
        <div className="p-3 rounded-lg bg-feedback-error/10 border border-feedback-error/30 text-feedback-error text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preview ? (
        <div className="relative rounded-xl border border-border overflow-hidden bg-black/5">
          <div className="relative w-full aspect-video sm:aspect-[4/3] max-h-80">
            <Image
              src={preview}
              alt="Pratinjau Kerusakan Jalan"
              fill
              className="object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          {fileInfo && (
            <div className="p-2 bg-base border-t border-border text-[11px] text-text-secondary text-center">
              {fileInfo}
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-primary rounded-xl p-8 text-center cursor-pointer transition-colors bg-surface/50 flex flex-col items-center justify-center min-h-[220px]"
        >
          <div className="h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-3">
            <Camera className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-text-primary mb-1">
            {compressing ? "Mengompresi foto..." : "Ambil Foto atau Unggah Gambar"}
          </h4>
          <p className="text-xs text-text-secondary max-w-xs mb-3">
            Ketuk untuk membuka kamera smartphone atau pilih file dari galeri Anda.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={compressing}
            className="pointer-events-none"
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            Pilih Foto Kerusakan
          </Button>
        </div>
      )}
    </div>
  );
};
