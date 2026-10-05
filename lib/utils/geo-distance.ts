/**
 * geo-distance.ts
 * Utilitas untuk menghitung jarak antara 2 koordinat geografis
 * dan mendeteksi potensi laporan duplikat di titik lokasi yang sama (< 50 meter).
 */

export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Hasil dalam meter
}

export interface CoordinatesHolder {
  id: string;
  latitude: number;
  longitude: number;
}

/**
 * Mencari ID laporan lain yang lokasinya berdekatan dalam radius tertentu (default 50 meter).
 */
export function findNearbyReportIds<T extends CoordinatesHolder>(
  target: T,
  candidates: T[],
  thresholdMeters: number = 50
): string[] {
  if (!target.latitude || !target.longitude) return [];

  const nearby: string[] = [];
  for (const candidate of candidates) {
    if (candidate.id === target.id) continue;
    if (!candidate.latitude || !candidate.longitude) continue;

    const dist = calculateHaversineDistanceMeters(
      target.latitude,
      target.longitude,
      candidate.latitude,
      candidate.longitude
    );

    if (dist <= thresholdMeters) {
      nearby.push(candidate.id);
    }
  }

  return nearby;
}
