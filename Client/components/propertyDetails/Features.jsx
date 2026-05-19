import React from "react";
import { formatPropertyValue, getPropertyConfig } from "@/lib/property";

const FIELD_LABELS = {
  carport: "Garasi Terbuka",
  garden: "Taman Pribadi",
  one_gate_system: "Sistem Satu Gerbang",
  security_24jam: "Keamanan 24 Jam",
  swimming_pool: "Kolam Renang",
  private_pool: "Kolam Pribadi",
  furnished: "Furnitur Lengkap",
  near_tourism: "Dekat Wisata",
  wifi_included: "Termasuk WiFi",
  electricity_included: "Termasuk Listrik",
  water_included: "Termasuk Air",
  shared_kitchen: "Dapur Bersama",
  parking_area: "Area Parkir",
  cctv: "CCTV",
};

function formatWater(value) {
  return value ? `Air ${formatPropertyValue("water", value)}` : null;
}

function formatElectricity(value) {
  if (value === "overground") return "Listrik Tiang";
  if (value === "underground") return "Listrik Bawah Tanah";
  return value ? `Listrik ${value}` : null;
}

function buildFeatureItems(property) {
  const detail = property?.detail || {};
  const type = property?.type || "rumah";
  const fields = getPropertyConfig(type).fields || [];

  return fields
    .map((field) => {
      const value = detail[field.name];

      if (field.type === "checkbox") {
        return value ? FIELD_LABELS[field.name] || field.label : null;
      }

      if (field.name === "water") return formatWater(value);
      if (field.name === "wifi_provider") return value ? `WiFi ${value}` : null;

      return null;
    })
    .filter(Boolean);
}

export function hasAdditionalFeatures(property) {
  return buildFeatureItems(property).length > 0;
}

export default function Features({ property }) {
  const features = buildFeatureItems(property);
  if (!features.length) return null;

  const columns = [[], [], []];
  features.forEach((item, index) => {
    columns[index % 3].push(item);
  });

  return (
    <>
      <div className="wg-title text-11 fw-6 text-color-heading">
        Fasilitas Tambahan
      </div>
      <div className="wrap-feature">
        {columns.map((items, columnIndex) => (
          <div className="box-feature" key={columnIndex}>
            <ul>
              {items.map((item, index) => (
                <li key={`${item}-${index}`} className="feature-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
