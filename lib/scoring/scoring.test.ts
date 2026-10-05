import { calculateSeverityValue, calculateSNorm, calculateSeverity } from "./severity";
import {
  calculateExposure,
  calculatePriorityValue,
  calculatePriorityScore,
  getPriorityLevel,
  calculateStaleness,
} from "./priority";
import { DAMAGE_WEIGHTS, EXPOSURE_WEIGHTS, PRIORITY_WEIGHTS, DEFAULT_P95_SEVERITY } from "./weights";
import { DetectionResult } from "../ai/types";

export function runScoringTests() {
  console.log("=== Menjalankan Unit Test Komprehensif lib/scoring/ ===");

  // 1. Uji Bobot Kerusakan
  if (
    DAMAGE_WEIGHTS.lubang !== 1.0 ||
    DAMAGE_WEIGHTS.retak_buaya !== 0.8 ||
    DAMAGE_WEIGHTS.retak_melintang !== 0.4 ||
    DAMAGE_WEIGHTS.retak_memanjang !== 0.4
  ) {
    throw new Error("Test 1 Gagal: Bobot kerusakan jalan tidak sesuai spesifikasi");
  }

  // 2. Uji Nilai Exposure (E) Fungsi Jalan
  if (
    calculateExposure("arteri") !== 100 ||
    calculateExposure("kolektor") !== 75 ||
    calculateExposure("lokal") !== 50 ||
    calculateExposure("lingkungan") !== 25
  ) {
    throw new Error("Test 2 Gagal: Nilai Exposure fungsi jalan tidak sesuai");
  }

  // 3. Uji Empty Detections
  const emptySeverity = calculateSeverityValue([]);
  if (emptySeverity !== 0) {
    throw new Error(`Test 3 Gagal: Expected severity 0, got ${emptySeverity}`);
  }
  const emptySNorm = calculateSNorm(emptySeverity);
  if (emptySNorm !== 0) {
    throw new Error(`Test 3 Gagal: Expected S_norm 0, got ${emptySNorm}`);
  }
  const emptyScore = calculatePriorityScore([], "lokal");
  // 0.70 * 0 + 0.30 * 50 = 15.00
  if (emptyScore.priorityValue !== 15.0 || emptyScore.severityLevel !== "low") {
    throw new Error(`Test 3 Gagal: Expected 15.00 low, got ${emptyScore.priorityValue} ${emptyScore.severityLevel}`);
  }

  // 4. Uji Single Detection (Lubang 0.2 x 0.2, confidence 0.9)
  const singleLubang: DetectionResult[] = [
    {
      damage_type: "lubang",
      confidence: 0.9,
      bbox: { x: 0.3, y: 0.3, width: 0.2, height: 0.2 }, // area = 0.04
    },
  ];
  // severity = 1.0 * 0.9 * 0.04 = 0.036
  const singleSev = calculateSeverityValue(singleLubang);
  if (Math.abs(singleSev - 0.036) > 0.0001) {
    throw new Error(`Test 4 Gagal: Expected severity ~0.036, got ${singleSev}`);
  }
  // S_norm = (0.036 / 0.20) * 100 = 18.00
  const singleSNorm = calculateSNorm(singleSev, 0.2);
  if (Math.abs(singleSNorm - 18.0) > 0.01) {
    throw new Error(`Test 4 Gagal: Expected S_norm ~18.0, got ${singleSNorm}`);
  }

  // 5. Uji Formula Priority: 0.70 * S_norm + 0.30 * E
  // Kasus: S_norm = 18, Jalan Arteri (E = 100) -> 0.70*18 + 0.30*100 = 12.6 + 30 = 42.60 (medium)
  const prioArteri = calculatePriorityValue(18, 100);
  if (Math.abs(prioArteri - 42.6) > 0.01) {
    throw new Error(`Test 5 Gagal: Expected priority ~42.60, got ${prioArteri}`);
  }
  if (getPriorityLevel(prioArteri) !== "medium") {
    throw new Error(`Test 5 Gagal: Expected level medium, got ${getPriorityLevel(prioArteri)}`);
  }

  // 6. Uji Boundary & Cap P95 (Severity di atas P95 harus di-cap tepat 100)
  const massiveDamage: DetectionResult[] = [
    {
      damage_type: "lubang",
      confidence: 0.95,
      bbox: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 }, // area = 0.25 -> sev = 0.2375 > 0.20
    },
  ];
  const massiveSev = calculateSeverityValue(massiveDamage);
  const massiveSNorm = calculateSNorm(massiveSev, 0.2);
  if (massiveSNorm !== 100) {
    throw new Error(`Test 6 Gagal: S_norm harus di-cap tepat 100, got ${massiveSNorm}`);
  }

  // Max score boundary: S_norm = 100 di Jalan Arteri (100) -> tepat 100 (critical)
  const maxScore = calculatePriorityValue(massiveSNorm, 100);
  if (maxScore !== 100 || getPriorityLevel(maxScore) !== "critical") {
    throw new Error(`Test 6 Gagal: Max score harus 100 critical, got ${maxScore}`);
  }

  // 7. Uji Perbandingan Fungsi Jalan Identik (Arteri vs Lingkungan)
  const scoreArteri = calculatePriorityScore(singleLubang, "arteri");
  const scoreLingkungan = calculatePriorityScore(singleLubang, "lingkungan");
  if (scoreArteri.priorityValue <= scoreLingkungan.priorityValue) {
    throw new Error("Test 7 Gagal: Jalan arteri harus memiliki prioritas lebih tinggi dari lingkungan untuk kerusakan yang sama");
  }

  // 8. Uji Staleness Indicator (UI-only, >= 7 hari dan bukan selesai/ditolak)
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

  const stale6 = calculateStaleness(sixDaysAgo, "baru");
  if (stale6.isStale !== false) {
    throw new Error("Test 8 Gagal: 6 hari menunggu tidak boleh dianggap stale");
  }

  const stale7 = calculateStaleness(sevenDaysAgo, "baru");
  if (stale7.isStale !== true || stale7.hariMenunggu !== 7) {
    throw new Error(`Test 8 Gagal: 7 hari menunggu harus stale, got ${stale7.isStale}, ${stale7.hariMenunggu}`);
  }

  const staleResolved = calculateStaleness(tenDaysAgo, "selesai");
  if (staleResolved.isStale !== false) {
    throw new Error("Test 8 Gagal: Laporan selesai tidak boleh berstatus stale");
  }

  const staleRejected = calculateStaleness(tenDaysAgo, "ditolak");
  if (staleRejected.isStale !== false) {
    throw new Error("Test 8 Gagal: Laporan ditolak tidak boleh berstatus stale");
  }

  console.log("=== SEMUA UNIT TEST SCORING BERHASIL 100% ===");
  return true;
}
