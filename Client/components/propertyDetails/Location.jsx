"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function Location({ property }) {
  const { user, isAdmin } = useAuth();
  const isOwner =
    user &&
    (property?.user_id === user.id || property?.user?.id === user.id);
  const canViewLocation =
    property?.can_view_location ?? Boolean(isAdmin || isOwner);

  const previewLat = property?.location_preview?.latitude;
  const previewLng = property?.location_preview?.longitude;
  const latitude = canViewLocation ? property?.latitude : previewLat;
  const longitude = canViewLocation ? property?.longitude : previewLng;

  const fallbackLat = -8.1736;
  const fallbackLng = 113.7032;
  const lat = typeof latitude === "number" ? latitude : fallbackLat;
  const lng = typeof longitude === "number" ? longitude : fallbackLng;
  const delta = canViewLocation ? 0.005 : 0.02;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  const marker = canViewLocation ? `&marker=${lat}%2C${lng}` : "";
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik${marker}`;

  return (
    <>
      <div className="wg-title text-11 fw-6 text-color-heading">
        Lokasi Properti
      </div>
      <div style={{ position: "relative" }}>
        <iframe
          className="map"
          src={mapUrl}
          style={{ border: 0, filter: canViewLocation ? "none" : "blur(6px)" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {!canViewLocation && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "16px",
              background: "rgba(255, 255, 255, 0.55)",
            }}
          >
            <div>
              <div className="text-2 fw-6 text-color-heading">
                Hubungi Agen untuk mengetahui detail lokasi properti
              </div>
              <a
                href="#contact-admin"
                className="tf-btn style-border pd-4"
                style={{ marginTop: "12px", display: "inline-block" }}
              >
                Tanya Lokasi
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
