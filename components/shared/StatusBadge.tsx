import React from "react";
import { cn } from "@/lib/utils";
import { ReportStatus } from "@/types/database";

interface StatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

const statusConfig: Record<
  ReportStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  baru: {
    label: "Baru",
    bg: "bg-status-baru/15",
    text: "text-status-baru",
    border: "border-status-baru/30",
  },
  diverifikasi: {
    label: "Diverifikasi",
    bg: "bg-status-diverifikasi/15",
    text: "text-status-diverifikasi",
    border: "border-status-diverifikasi/30",
  },
  dijadwalkan: {
    label: "Dijadwalkan",
    bg: "bg-status-dijadwalkan/15",
    text: "text-status-dijadwalkan",
    border: "border-status-dijadwalkan/30",
  },
  dikerjakan: {
    label: "Dikerjakan",
    bg: "bg-status-dikerjakan/15",
    text: "text-[#8D5B00]", // High contrast gold/brown for WCAG AA compliance over light yellow
    border: "border-status-dikerjakan/30",
  },
  selesai: {
    label: "Selesai",
    bg: "bg-status-selesai/15",
    text: "text-status-selesai",
    border: "border-status-selesai/30",
  },
  ditolak: {
    label: "Ditolak",
    bg: "bg-status-ditolak/15",
    text: "text-status-ditolak",
    border: "border-status-ditolak/30",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const conf = statusConfig[status] || statusConfig.baru;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide shadow-subtle",
        conf.bg,
        conf.text,
        conf.border,
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          status === "baru" && "bg-status-baru",
          status === "diverifikasi" && "bg-status-diverifikasi",
          status === "dijadwalkan" && "bg-status-dijadwalkan",
          status === "dikerjakan" && "bg-status-dikerjakan",
          status === "selesai" && "bg-status-selesai",
          status === "ditolak" && "bg-status-ditolak"
        )}
      />
      <span>{conf.label}</span>
    </span>
  );
};
