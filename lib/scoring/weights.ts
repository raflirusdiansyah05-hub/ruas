import { DamageType } from "../ai/types";
import { FungsiJalan } from "../../types/database";

/**
 * Bobot per jenis kerusakan jalan sesuai techstack.md Bagian 4.3:
 * - lubang: 1.00 (risiko kecelakaan langsung bagi pengendara motor/mobil)
 * - retak_buaya: 0.80 (kerusakan struktural berat pada base layer)
 * - retak_melintang: 0.40 (kerusakan termal/refleksi sambungan)
 * - retak_memanjang: 0.40 (retak pada sambungan memanjang jalan)
 */
export const DAMAGE_WEIGHTS: Record<DamageType, number> = {
  lubang: 1.0,
  retak_buaya: 0.8,
  retak_melintang: 0.4,
  retak_memanjang: 0.4,
};

/**
 * Nilai Exposure (E) berdasarkan klasifikasi Fungsi Jalan:
 * Sesuai techstack.md Bagian 4.3 & design.md Bagian 8.3
 * - Arteri: 100 (volume lalu lintas sangat tinggi, jalan utama penghubung antar-kota)
 * - Kolektor: 75 (jalan penghubung kawasan, lalu lintas sedang-tinggi)
 * - Lokal: 50 (jalan lingkungan perumahan/kompleks, kecepatan rendah)
 * - Lingkungan: 25 (akses terbatas, intensitas lalu lintas rendah)
 */
export const EXPOSURE_WEIGHTS: Record<FungsiJalan, number> = {
  arteri: 100,
  kolektor: 75,
  lokal: 50,
  lingkungan: 25,
};

/**
 * Bobot formula Priority Score final:
 * priority_value = (0.70 * S_norm) + (0.30 * E)
 * Sesuai keputusan Round 3 (0.70 : 0.30)
 */
export const PRIORITY_WEIGHTS = {
  w_snorm: 0.7,
  w_exposure: 0.3,
};

/**
 * P95_SEVERITY: Nilai persentil-95 dari severity_value untuk normalisasi S_norm (0-100).
 * Nilai di atas P95 akan di-cap menjadi 100.
 * Default 0.20 berdasarkan distribusi output bounding box area ratio.
 */
export const DEFAULT_P95_SEVERITY = 0.2;
