import React from "react";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";

interface StalenessBadgeProps {
  daysWaiting: number;
  className?: string;
}

/**
 * StalenessBadge:
 * Indikator penuaan laporan (UI-only, TIDAK bagian dari formula Priority Score).
 * Sesuai design.md Bagian 6:
 * - Pill kecil outline (bukan warna solid agar tidak bersaing visual dengan PriorityBadge)
 * - Teks: "⚠ Menunggu X hari"
 * - Muncul hanya jika hari_menunggu >= 7 dan status belum selesai / ditolak.
 */
export const StalenessBadge: React.FC<StalenessBadgeProps> = ({
  daysWaiting,
  className,
}) => {
  if (daysWaiting < 7) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-xs",
        className
      )}
      title={`Laporan ini telah menunggu tindak lanjut selama ${daysWaiting} hari.`}
    >
      <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
      <span>Menunggu {daysWaiting} hari</span>
    </span>
  );
};
