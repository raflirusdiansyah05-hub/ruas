"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix default leaflet icon missing in Next.js/Webpack
const customPinIcon = L.divIcon({
  className: "custom-road-pin",
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background-color: #1E8E5A;
      border: 3px solid #FFFFFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #FFFFFF;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface LeafletMapViewProps {
  lat: number;
  lng: number;
  onPositionChange?: (lat: number, lng: number) => void;
  isDraggable?: boolean;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMapView({
  lat,
  lng,
  onPositionChange,
  isDraggable = true,
}: LeafletMapViewProps) {
  const eventHandlers = React.useMemo(
    () => ({
      dragend(e: any) {
        const marker = e.target;
        if (marker != null) {
          const position = marker.getLatLng();
          if (onPositionChange) {
            onPositionChange(position.lat, position.lng);
          }
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <div className="w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-border relative z-10 shadow-xs">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <ChangeView center={[lat, lng]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {isDraggable && onPositionChange && (
          <MapClickHandler
            onMapClick={(clickedLat, clickedLng) => {
              onPositionChange(clickedLat, clickedLng);
            }}
          />
        )}
        <Marker
          position={[lat, lng]}
          icon={customPinIcon}
          draggable={isDraggable}
          eventHandlers={eventHandlers}
        />
      </MapContainer>
    </div>
  );
}
