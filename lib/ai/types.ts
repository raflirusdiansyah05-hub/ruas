export type DamageType =
  | "retak_memanjang"
  | "retak_melintang"
  | "retak_buaya"
  | "lubang";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectionResult {
  damage_type: DamageType;
  confidence: number;
  bbox: BoundingBox;
}

export interface DetectionResponse {
  detections: DetectionResult[];
  model_version: string;
  processing_time_ms: number;
}

export interface DetectionProvider {
  detectDamage(imageUrl: string): Promise<DetectionResponse>;
}
