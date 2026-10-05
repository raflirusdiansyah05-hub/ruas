import { DetectionResult } from "../ai/types";
import { FungsiJalan, SeverityLevel, ReportStatus } from "../../types/database";
import { EXPOSURE_WEIGHTS, PRIORITY_WEIGHTS, DEFAULT_P95_SEVERITY } from "./weights";
import { calculateSeverityValue, calculateSNorm } from "./severity";

export interface PriorityScoreOutput {
  severityValue: number;   // Raw unbounded severity
  sNorm: number;           // Normalisasi S_norm (0 - 100)
  exposureValue: number;   // Nilai Exposure E dari Fungsi Jalan (25, 50, 75, 100)
  priorityValue: number;   // Skor akhir (0 - 100): 0.70*S_norm + 0.30*E
  severityLevel: SeverityLevel; // Level keparahan untuk PriorityBadge (critical/high/medium/low)
  // Optional backwards-compatibility fields:
  confidenceComponent?: number;
  densityComponent?: number;
}

/**
 * calculateExposure:
 * Mengembalikan nilai Exposure (E) berdasarkan Fungsi Jalan:
 * - arteri: 100
 * - kolektor: 75
 * - lokal: 50
 * - lingkungan: 25
 */
export function calculateExposure(fungsiJalan: FungsiJalan): number {
  return EXPOSURE_WEIGHTS[fungsiJalan] ?? 50;
}

/**
 * calculatePriorityValue:
 * Menghitung Priority Score final sesuai formula resmi Round 3:
 * priority_value = (0.70 * S_norm) + (0.30 * E)
 *
 * Rentang output: 0.0 - 100.0 (deterministik & type-safe).
 * TIDAK melibatkan variabel waktu T apa pun.
 */
export function calculatePriorityValue(sNorm: number, exposureValue: number): number {
  const boundedSNorm = Math.max(0, Math.min(100, sNorm));
  const boundedExposure = Math.max(0, Math.min(100, exposureValue));

  const rawPriority =
    PRIORITY_WEIGHTS.w_snorm * boundedSNorm +
    PRIORITY_WEIGHTS.w_exposure * boundedExposure;

  return Number(Math.max(0, Math.min(100, rawPriority)).toFixed(2));
}

/**
 * getPriorityLevel:
 * Mengonversi skor prioritas (0 - 100) ke label kategori sesuai design.md Bagian 3.2:
 * - 75 - 100: critical (Merah #C62828)
 * - 50 - 74:  high (Oranye #EF6C00)
 * - 25 - 49:  medium (Kuning #F9A825)
 * - 0 - 24:   low (Hijau #2E7D32)
 */
export function getPriorityLevel(priorityValue: number): SeverityLevel {
  if (priorityValue >= 75) return "critical";
  if (priorityValue >= 50) return "high";
  if (priorityValue >= 25) return "medium";
  return "low";
}

/**
 * calculatePriorityScore:
 * Menghitung seluruh komponen prioritas lengkap dari deteksi dan fungsi jalan.
 */
export function calculatePriorityScore(
  detections: DetectionResult[],
  fungsiJalan?: FungsiJalan,
  p95Severity?: number
): PriorityScoreOutput;
export function calculatePriorityScore(
  legacyLevel: string | undefined,
  legacyValue: number,
  detections: DetectionResult[]
): PriorityScoreOutput;
export function calculatePriorityScore(
  arg1: any,
  arg2: any = "lokal",
  arg3: any = DEFAULT_P95_SEVERITY
): PriorityScoreOutput {
  let detections: DetectionResult[] = [];
  let fungsiJalan: FungsiJalan = "lokal";
  let p95Severity = DEFAULT_P95_SEVERITY;

  if (Array.isArray(arg1)) {
    detections = arg1;
    fungsiJalan = (arg2 as FungsiJalan) || "lokal";
    p95Severity = typeof arg3 === "number" ? arg3 : DEFAULT_P95_SEVERITY;
  } else if (Array.isArray(arg3)) {
    detections = arg3;
    fungsiJalan = "lokal";
  }

  const severityValue = calculateSeverityValue(detections);
  const sNorm = calculateSNorm(severityValue, p95Severity);
  const exposureValue = calculateExposure(fungsiJalan);
  const priorityValue = calculatePriorityValue(sNorm, exposureValue);
  const severityLevel = getPriorityLevel(priorityValue);

  return {
    severityValue,
    sNorm,
    exposureValue,
    priorityValue,
    severityLevel,
    confidenceComponent: 0,
    densityComponent: 0,
  };
}

/**
 * calculateStaleness:
 * Indikator penuaan laporan (UI-only, TIDAK bagian dari formula Priority).
 * Sesuai techstack.md Bagian 4.3:
 * Muncul jika hari_menunggu >= 7 dan status belum selesai / ditolak.
 */
export function calculateStaleness(
  createdAt: string | Date,
  status: ReportStatus
): { hariMenunggu: number; isStale: boolean } {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - createdTime);
  const hariMenunggu = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isStale = hariMenunggu >= 7 && !["selesai", "ditolak"].includes(status);

  return {
    hariMenunggu,
    isStale,
  };
}
