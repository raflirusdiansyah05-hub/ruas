import { DetectionProvider, DetectionResponse, DamageType, DetectionResult } from "./types";

/**
 * MockDetectionProvider:
 * Menghasilkan deteksi acak terkontrol dengan simulasi latency ~800ms.
 * Memiliki bias terkontrol ke 'lubang' dengan confidence tinggi
 * agar pengujian alur severity 'critical'/'high' dapat terverifikasi dengan mudah saat demo.
 */
export class MockDetectionProvider implements DetectionProvider {
  async detectDamage(_imageUrl: string): Promise<DetectionResponse> {
    const startTime = Date.now();

    // Simulasi latency komputasi AI ~800ms
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Probabilitas damage types
    const roll = Math.random();
    let selectedType: DamageType = "lubang";
    let count = 1;

    if (roll < 0.45) {
      selectedType = "lubang";
      count = Math.random() > 0.6 ? 2 : 1;
    } else if (roll < 0.75) {
      selectedType = "retak_buaya";
      count = Math.random() > 0.7 ? 2 : 1;
    } else if (roll < 0.9) {
      selectedType = "retak_memanjang";
      count = 1;
    } else {
      selectedType = "retak_melintang";
      count = 1;
    }

    const detections: DetectionResult[] = [];

    for (let i = 0; i < count; i++) {
      const confidence = Number((0.75 + Math.random() * 0.22).toFixed(3)); // 0.750 - 0.970

      // Bounding box relatif terhadap gambar (x, y, w, h antara 0-1)
      const w = Number((0.2 + Math.random() * 0.25).toFixed(3));
      const h = Number((0.15 + Math.random() * 0.2).toFixed(3));
      const x = Number((0.2 + Math.random() * (0.6 - w)).toFixed(3));
      const y = Number((0.3 + Math.random() * (0.5 - h)).toFixed(3));

      detections.push({
        damage_type: i === 0 ? selectedType : "retak_buaya",
        confidence,
        bbox: {
          x,
          y,
          width: w,
          height: h,
        },
      });
    }

    const processingTime = Date.now() - startTime;

    return {
      detections,
      model_version: "mock-v1.0",
      processing_time_ms: processingTime,
    };
  }
}
