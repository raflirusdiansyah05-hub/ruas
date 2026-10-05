"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

export interface BoundingBoxItem {
  id?: string;
  damage_type: string;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
}

interface ImageBoundingBoxProps {
  src: string;
  alt?: string;
  detections: BoundingBoxItem[];
  className?: string;
}

export const ImageBoundingBox: React.FC<ImageBoundingBoxProps> = ({
  src,
  alt = "Foto Kerusakan Jalan",
  detections,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

  // Pantau perubahan ukuran container saat resize window / rotasi mobile
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Hitung offset dan dimensi display aktif dari gambar di dalam container (letterbox compensation)
  const calculateRenderedBox = () => {
    if (!containerSize || !naturalSize || containerSize.width === 0 || containerSize.height === 0) {
      return null;
    }

    const containerWidth = containerSize.width;
    const containerHeight = containerSize.height;

    const imgAspect = naturalSize.width / naturalSize.height;
    const containerAspect = containerWidth / containerHeight;

    let renderedWidth = containerWidth;
    let renderedHeight = containerHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (containerAspect > imgAspect) {
      // Bar kosong di kiri & kanan
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * imgAspect;
      offsetX = (containerWidth - renderedWidth) / 2;
    } else {
      // Bar kosong di atas & bawah
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / imgAspect;
      offsetY = (containerHeight - renderedHeight) / 2;
    }

    return {
      renderedWidth,
      renderedHeight,
      offsetX,
      offsetY,
    };
  };

  const renderedBox = calculateRenderedBox();

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[4/3] bg-black/5 overflow-hidden select-none ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        onLoadingComplete={(img) => {
          if (img.naturalWidth && img.naturalHeight) {
            setNaturalSize({
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          }
        }}
      />

      {/* Render Bounding Box tepat di atas area gambar yang ter-render */}
      {renderedBox ? (
        <div
          style={{
            position: "absolute",
            left: `${renderedBox.offsetX}px`,
            top: `${renderedBox.offsetY}px`,
            width: `${renderedBox.renderedWidth}px`,
            height: `${renderedBox.renderedHeight}px`,
            pointerEvents: "none",
          }}
        >
          {detections.map((d, i) => (
            <div
              key={d.id || i}
              style={{
                left: `${d.bbox_x * 100}%`,
                top: `${d.bbox_y * 100}%`,
                width: `${d.bbox_w * 100}%`,
                height: `${d.bbox_h * 100}%`,
              }}
              className="absolute border-2 border-primary bg-primary/20 rounded transition-all"
            >
              <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-primary text-white text-[10px] font-bold whitespace-nowrap shadow">
                {d.damage_type} ({(d.confidence * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Fallback saat natural size belum terambil */
        detections.map((d, i) => (
          <div
            key={d.id || i}
            style={{
              left: `${d.bbox_x * 100}%`,
              top: `${d.bbox_y * 100}%`,
              width: `${d.bbox_w * 100}%`,
              height: `${d.bbox_h * 100}%`,
            }}
            className="absolute border-2 border-primary bg-primary/20 rounded pointer-events-none transition-all"
          >
            <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-primary text-white text-[10px] font-bold whitespace-nowrap shadow">
              {d.damage_type} ({(d.confidence * 100).toFixed(0)}%)
            </span>
          </div>
        ))
      )}
    </div>
  );
};
