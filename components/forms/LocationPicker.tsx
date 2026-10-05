"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2, AlertCircle, Move } from "lucide-react";

// Dynamic import for Leaflet (client-only to avoid SSR window errors)
const LeafletMapView = dynamic(() => import("./LeafletMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 sm:h-64 rounded-xl bg-surface border border-border flex flex-col items-center justify-center gap-2 text-text-secondary text-xs">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span>Memuat peta interaktif...</span>
    </div>
  ),
});

interface LocationPickerProps {
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
    addressText: string;
  }) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelected,
  initialLat,
  initialLng,
  initialAddress,
}) => {
  const [lat, setLat] = useState<number | null>(initialLat || null);
  const [lng, setLng] = useState<number | null>(initialLng || null);
  const [address, setAddress] = useState<string>(initialAddress || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reverse geocoding via OpenStreetMap Nominatim dengan timeout pengaman 4 detik
  const reverseGeocode = async (latitude: number, longitude: number) => {
    const fallbackAddress = `Koordinat: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "id",
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const displayAddress =
          data.display_name || fallbackAddress;
        setAddress(displayAddress);
        onLocationSelected({
          latitude,
          longitude,
          addressText: displayAddress,
        });
        return;
      }
    } catch {
      // Abort atau network timeout -> gunakan fallback instan
    } finally {
      clearTimeout(timeoutId);
    }

    setAddress(fallbackAddress);
    onLocationSelected({
      latitude,
      longitude,
      addressText: fallbackAddress,
    });
  };

  const handlePositionChanged = async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    await reverseGeocode(newLat, newLng);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Perangkat Anda tidak mendukung fitur lokasi GPS.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        await reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        // Jangan blokir UI jika izin lokasi belum diberikan atau ditolak
        setError(`Izin GPS belum aktif (${err.message}). Anda tetap dapat memilih lokasi langsung di peta.`);
        setLoading(false);
      },
      {
        enableHighAccuracy: false, // Mempercepat GPS lock awal
        timeout: 6000,
      }
    );
  };

  useEffect(() => {
    // Jalankan geolocation di latar belakang setelah UI utama mount
    if (!lat && !lng) {
      const timer = setTimeout(() => {
        handleGetCurrentLocation();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="w-full space-y-3">
      {error && (
        <div className="p-3 rounded-lg bg-feedback-error/10 border border-feedback-error/30 text-feedback-error text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mini Leaflet Interactive Map */}
      {lat && lng ? (
        <div className="space-y-1.5">
          <LeafletMapView
            lat={lat}
            lng={lng}
            onPositionChange={handlePositionChanged}
            isDraggable={true}
          />
          <div className="flex items-center gap-1 text-[11px] text-text-secondary">
            <Move className="h-3 w-3 text-primary shrink-0" />
            <span>Geser pin hijau atau ketuk peta untuk menyesuaikan titik tepat kerusakan jalan.</span>
          </div>
        </div>
      ) : null}

      <div className="p-4 rounded-xl border border-border bg-base space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-text-secondary font-medium">Alamat Titik Laporan</div>
              <div className="text-sm font-semibold text-text-primary leading-snug">
                {address || (loading ? "Mendeteksi alamat..." : "Lokasi belum ditentukan")}
              </div>
              {lat && lng && (
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Lintang: {lat.toFixed(6)}, Bujur: {lng.toFixed(6)}
                </div>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            aria-label="Perbarui lokasi GPS"
            className="shrink-0 gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Perbarui GPS</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
