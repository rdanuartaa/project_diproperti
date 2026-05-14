"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CENTER = { lat: -8.170749, lng: 113.700686 };

const markerIconUrls = {
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
};

const parseCoordinate = (value) => {
  if (value === null || value === undefined) return NaN;
  const raw = String(value).trim();
  if (!raw) return NaN;
  const normalized = raw.replace(",", ".");
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : NaN;
};

export default function LocationPicker({
  address,
  latitude,
  longitude,
  onChange,
}) {
  const [status, setStatus] = useState(" ");
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const suggestAbortRef = useRef(null);
  const abortRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const didInitRef = useRef(false);

  const center = useMemo(() => {
    let lat = parseCoordinate(latitude);
    let lng = parseCoordinate(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
        [lat, lng] = [lng, lat];
      }
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return DEFAULT_CENTER;
      }
      return { lat, lng };
    }
    return DEFAULT_CENTER;
  }, [latitude, longitude]);

  const updateLocation = (next) => {
    if (onChange) onChange(next);
  };

  const reverseGeocode = async (lat, lng) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "Accept-Language": "id" },
      });
      if (!response.ok) throw new Error("Reverse gagal.");
      const result = await response.json();
      updateLocation({
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        address: result.display_name || address || "",
      });
      setStatus("Lokasi diperbarui dari peta.");
    } catch (error) {
      if (error.name !== "AbortError") {
        updateLocation({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        });
        setStatus("Koordinat diperbarui, alamat tidak ditemukan.");
      }
    }
  };

  const fetchSuggestions = async (query) => {
    if (!suggestionsEnabled) return;
    const trimmed = String(query || "").trim();
    if (trimmed.length < 4) {
      setSuggestions([]);
      return;
    }

    if (suggestAbortRef.current) suggestAbortRef.current.abort();
    const controller = new AbortController();
    suggestAbortRef.current = controller;
    setIsSuggesting(true);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(trimmed)}`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "Accept-Language": "id" },
      });
      if (!response.ok) throw new Error("Gagal mengambil rekomendasi lokasi.");
      const results = await response.json();
      setSuggestions(
        results.map((item) => ({
          label: item.display_name,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
        })),
      );
    } catch (error) {
      if (error.name !== "AbortError") {
        setSuggestions([]);
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  const geocodeAddress = async () => {
    const trimmed = String(address || "").trim();
    if (trimmed.length < 4) return;
    setStatus("Mencari lokasi...");

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(trimmed)}`;
      const response = await fetch(url, {
        headers: { "Accept-Language": "id" },
      });
      if (!response.ok) throw new Error("Gagal mencari lokasi.");
      const results = await response.json();
      if (!results.length) {
        setStatus("Lokasi tidak ditemukan.");
        return;
      }
      const nextLat = Number(results[0].lat);
      const nextLng = Number(results[0].lon);
      updateLocation({
        latitude: Number(nextLat.toFixed(6)),
        longitude: Number(nextLng.toFixed(6)),
        address: results[0].display_name || trimmed,
      });
      setStatus("Lokasi ditemukan.");
    } catch (error) {
      setStatus("Gagal mencari lokasi.");
    }
  };

  const handleSuggestionPick = (item) => {
    updateLocation({
      address: item.label,
      latitude: Number(item.latitude.toFixed(6)),
      longitude: Number(item.longitude.toFixed(6)),
    });
    setSuggestions([]);
    setStatus("Lokasi dipilih dari rekomendasi.");
    setSuggestionsEnabled(false);
  };

  useEffect(() => {
    if (didInitRef.current) return;
    const lat = parseCoordinate(latitude);
    const lng = parseCoordinate(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return;
    updateLocation({
      latitude: DEFAULT_CENTER.lat,
      longitude: DEFAULT_CENTER.lng,
    });
    didInitRef.current = true;
  }, [latitude, longitude]);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;
      const leaflet = await import("leaflet");
      if (!isMounted) return;

      leaflet.Icon.Default.mergeOptions(markerIconUrls);

      const map = leaflet.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      });

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(map);

      map.on("click", (event) => {
        const { lat, lng } = event.latlng || {};
        if (lat === undefined || lng === undefined) return;
        reverseGeocode(lat, lng);
      });

      const marker = leaflet.marker([center.lat, center.lng], {
        draggable: true,
      });
      marker.on("dragend", (event) => {
        const { lat, lng } = event.target.getLatLng() || {};
        if (lat === undefined || lng === undefined) return;
        reverseGeocode(lat, lng);
      });
      marker.addTo(map);

      map.setView([center.lat, center.lng], 16);
      mapRef.current = map;
      markerRef.current = marker;
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!mapRef.current.getContainer()) return;
    markerRef.current.setLatLng([center.lat, center.lng]);
    mapRef.current.setView([center.lat, center.lng], 16);
  }, [center.lat, center.lng]);

  return (
    <div>
      <div className="d-flex gap-10 flex-wrap align-items-end">
        <div style={{ flex: 1, minWidth: 240 }}>
          <label className="mb-2">Alamat Lengkap</label>
          <input
            type="text"
            name="address"
            className="form-control"
            placeholder="Contoh: Jl. Letjen Sutoyo No. 12, Sumbersari"
            value={address || ""}
            onChange={(e) => {
              updateLocation({ address: e.target.value });
              fetchSuggestions(e.target.value);
            }}
          />
          {suggestionsEnabled && suggestions.length > 0 && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                marginTop: 6,
                background: "#fff",
                maxHeight: 220,
                overflowY: "auto",
                position: "relative",
                zIndex: 2,
              }}
            >
              {suggestions.map((item, index) => (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  onClick={() => handleSuggestionPick(item)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      index === suggestions.length - 1
                        ? "none"
                        : "1px solid #f3f4f6",
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {isSuggesting && suggestionsEnabled && (
            <p className="text-4" style={{ marginTop: 6 }}>
              Memuat rekomendasi lokasi...
            </p>
          )}
        </div>
        <button
          type="button"
          className="tf-btn style-border pd-4"
          onClick={geocodeAddress}
        >
          Cari Lokasi
        </button>
      </div>
      <p className="text-4" style={{ marginTop: 8 }}>
        {status}
      </p>
      <div className="row" style={{ marginTop: 12 }}>
        <div className="col-md-6">
          <label>Latitude</label>
          <input
            type="number"
            step="0.000001"
            name="latitude"
            className="form-control"
            placeholder="Contoh: -8.1736"
            value={latitude || ""}
            onChange={(e) => updateLocation({ latitude: e.target.value })}
          />
        </div>
        <div className="col-md-6">
          <label>Longitude</label>
          <input
            type="number"
            step="0.000001"
            name="longitude"
            className="form-control"
            placeholder="Contoh: 113.7032"
            value={longitude || ""}
            onChange={(e) => updateLocation({ longitude: e.target.value })}
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div
          ref={mapContainerRef}
          style={{ height: 320, borderRadius: 12, overflow: "hidden" }}
        />
      </div>
      <p className="text-4" style={{ marginTop: 8 }}>
        Klik peta atau geser pin untuk memperbarui alamat dan koordinat secara otomatis.
      </p>
    </div>
  );
}
