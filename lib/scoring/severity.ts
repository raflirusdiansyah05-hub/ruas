import { DetectionResult } from "../ai/types";
import { SeverityLevel } from "../../types/database";
import { DAMAGE_WEIGHTS, DEFAULT_P95_SEVERITY } from "./weights";

export interface SeverityOutput {
  severityValue: number; // Raw, unbounded: Σ (damage_weight * confidence * area_ratio)
  sNorm: number;         // Normalized (0 - 100): min(severity_value / P95, 1) * 100
  severityLevel?: SeverityLevel;
}

/**
 * calculateSeverityValue:
 * Menghitung severity mentah (unbounded) per laporan:
 * severity_value = Σ (damage_weight[det.damage_type] * det.confidence * det.area_ratio)
 * untuk seluruh deteksi dalam satu foto laporan.
 *
 * area_ratio = bbox.width * bbox.height (dalam koordinat normalisasi 0.0 - 1.0).
 */
export function calculateSeverityValue(detections: DetectionResult[]): number {
  if (!detections || detections.length === 0) {
    return 0;
  }

  let totalSeverity = 0;

  for (const det of detections) {
    const weight = DAMAGE_WEIGHTS[det.damage_type] ?? 0.4;
    const confidence = Math.max(0, Math.min(1, det.confidence));
    const width = Math.max(0, Math.min(1, det.bbox?.width ?? 0));
    const height = Math.max(0, Math.min(1, det.bbox?.height ?? 0));
    const areaRatio = width * height;

    totalSeverity += weight * confidence * areaRatio;
  }

  // Round to 4 decimal places for clean floating point stability
  return Number(totalSeverity.toFixed(4));
}

/**
 * calculateSNorm:
 * Normalisasi severity_value ke skala 0 - 100 via P95 cap:
 * S_norm = min(severity_value / P95_severity, 1) * 100
 */
export function calculateSNorm(
  severityValue: number,
  p95Severity: number = DEFAULT_P95_SEVERITY
): number {
  if (severityValue <= 0 || p95Severity <= 0) {
    return 0;
  }

  const normalized = Math.min(severityValue / p95Severity, 1.0) * 100;
  return Number(normalized.toFixed(2));
}

/**
 * calculateSeverity:
 * Wrapper komputasi severity untuk kompatibilitas.
 * Menghasilkan severityValue (raw) dan sNorm (0 - 100).
 */
export function calculateSeverity(
  detections: DetectionResult[],
  p95Severity: number = DEFAULT_P95_SEVERITY
): SeverityOutput {
  const severityValue = calculateSeverityValue(detections);
  const sNorm = calculateSNorm(severityValue, p95Severity);

  // Level severity untuk display referensi jika dibutuhkan (mengacu skala 0-100)
  let severityLevel: SeverityLevel = "low";
  if (sNorm >= 75) severityLevel = "critical";
  else if (sNorm >= 50) severityLevel = "high";
  else if (sNorm >= 25) severityLevel = "medium";

  return {
    severityValue,
    sNorm,
    severityLevel,
  };
}
