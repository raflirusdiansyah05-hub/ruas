import { DetectionProvider } from "./types";
import { MockDetectionProvider } from "./mock-provider";
import { RemoteDetectionProvider } from "./remote-provider";

export * from "./types";

/**
 * getDetectionProvider:
 * Factory function untuk mendapatkan provider deteksi AI.
 * Sesuai aturan: route handler HANYA memanggil fungsi ini, tidak boleh mengimpor mock/remote provider langsung.
 */
export function getDetectionProvider(): DetectionProvider {
  const providerType = (process.env.AI_PROVIDER || "").split(/[\r\n]+/)[0].trim().toLowerCase();
  const rawEndpoint = process.env.AI_REMOTE_ENDPOINT || "";
  const endpoint = rawEndpoint.split(/[\r\n]+/)[0].trim();

  if (providerType === "remote" || (endpoint && endpoint.startsWith("http"))) {
    if (!endpoint) {
      throw new Error("AI_REMOTE_ENDPOINT belum diisi saat AI_PROVIDER=remote");
    }
    return new RemoteDetectionProvider(endpoint);
  }

  return new MockDetectionProvider();
}
