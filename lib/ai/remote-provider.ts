import sharp from "sharp";
import { DetectionProvider, DetectionResponse, DamageType } from "./types";

/**
 * RemoteDetectionProvider:
 * Memanggil microservice FastAPI YOLO26 eksternal (hosted di Render).
 * Sesuai techstack.md Bagian 4.5 & Round 3:
 * 1. Menerima image URL foto dari Supabase Storage.
 * 2. Fetch foto asli.
 * 3. Me-resize foto ke 640x640 (fit: contain, background putih) via sharp, kompresi JPEG 80 (target <300KB).
 * 4. Mengirimkan multipart/form-data dengan field 'file' ke ${AI_REMOTE_ENDPOINT}/deteksi.
 * 5. Dilengkapi AbortController timeout (45 detik) untuk toleransi cold start tier gratis Render.
 * 6. Memetakan response ke DetectionResponse (types.ts).
 *
 * PENTING: Foto asli di Supabase Storage tetap aman dan tidak ditimpa oleh hasil resize 640x640.
 */
export class RemoteDetectionProvider implements DetectionProvider {
  private readonly baseUrl: string;

  constructor(endpoint: string) {
    if (!endpoint) {
      throw new Error("RemoteDetectionProvider memerlukan AI_REMOTE_ENDPOINT yang valid.");
    }
    // Hapus whitespace, quotes, dan trailing slash jika ada agar path /deteksi terbentuk tepat
    this.baseUrl = endpoint.trim().replace(/^["']+|["']+$/g, "").replace(/\/+$/, "");
  }

  async detectDamage(imageUrl: string): Promise<DetectionResponse> {
    const startTime = Date.now();

    // 1. Ambil foto asli dari Supabase Storage / URL publik
    const fetchController = new AbortController();
    const fetchTimeout = setTimeout(() => fetchController.abort(), 15000);

    let originalBuffer: Buffer;
    try {
      const originalRes = await fetch(imageUrl, { signal: fetchController.signal });
      clearTimeout(fetchTimeout);

      if (!originalRes.ok) {
        throw new Error(`Gagal mengunduh foto dari storage: status ${originalRes.status}`);
      }

      const arrayBuffer = await originalRes.arrayBuffer();
      originalBuffer = Buffer.from(arrayBuffer);
    } catch (err: any) {
      clearTimeout(fetchTimeout);
      if (err.name === "AbortError") {
        throw new Error("Timeout saat mengunduh foto asli untuk analisis AI.");
      }
      throw err;
    }

    // 2. Resize server-side ke dimensi standar 640x640 YOLO26 via sharp
    const resizedBuffer = await sharp(originalBuffer)
      .resize(640, 640, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255 },
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 3. Susun multipart/form-data
    const form = new FormData();
    form.append(
      "file",
      new Blob([resizedBuffer], { type: "image/jpeg" }),
      "detect.jpg"
    );

    // 4. Kirim ke endpoint FastAPI Render (/deteksi)
    const inferenceController = new AbortController();
    // Beri batas waktu 45 detik untuk menangani cold start Render free tier
    const inferenceTimeout = setTimeout(() => inferenceController.abort(), 45000);

    try {
      const response = await fetch(`${this.baseUrl}/deteksi`, {
        method: "POST",
        body: form,
        signal: inferenceController.signal,
      });
      clearTimeout(inferenceTimeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `AI Service error (${response.status}): ${errorText || response.statusText}`
        );
      }

      // 5. Validasi & mapping response FastAPI -> DetectionResponse
      const raw = await response.json();
      const rawDetections = Array.isArray(raw.detections) ? raw.detections : [];

      const normalizeDamageType = (val: any): DamageType => {
        const s = String(val || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
        if (s === "retak_memanjang" || s.includes("memanjang")) return "retak_memanjang";
        if (s === "retak_melintang" || s.includes("melintang")) return "retak_melintang";
        if (s === "retak_buaya" || s.includes("buaya")) return "retak_buaya";
        if (s === "lubang" || s.includes("lubang")) return "lubang";
        return "lubang"; // safe fallback
      };

      const detections = rawDetections.map((d: any) => ({
        damage_type: normalizeDamageType(d.class_name),
        confidence: typeof d.confidence === "number" ? d.confidence : 0,
        bbox: {
          x: typeof d.x === "number" ? d.x : 0,
          y: typeof d.y === "number" ? d.y : 0,
          width: typeof d.w === "number" ? d.w : 0,
          height: typeof d.h === "number" ? d.h : 0,
        },
      }));

      return {
        detections,
        model_version: raw.model_version ?? "yolo26n-v1",
        processing_time_ms: raw.processing_time_ms ?? (Date.now() - startTime),
      };
    } catch (err: any) {
      clearTimeout(inferenceTimeout);
      if (err.name === "AbortError") {
        throw new Error(
          "AI Service timeout: Render sedang mengalami cold-start atau antrean panjang. Silakan coba kembali."
        );
      }
      throw err;
    }
  }
}
