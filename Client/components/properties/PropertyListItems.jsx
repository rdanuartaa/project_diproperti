"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useCompare } from "@/components/compare/CompareContext";
import { getPropertyCardMetaItems } from "@/lib/property";

const fallbackImage = "/images/section/location-24.jpg";

const RANK_STYLES = [
  {
    label: "#1",
    border: "1px solid rgba(212, 175, 55, 0.72)",
    background: "linear-gradient(135deg, rgba(255, 248, 220, 0.78), #fff)",
    badgeBackground: "linear-gradient(135deg, #f6d365, #d4af37)",
    badgeColor: "#2c2100",
  },
  {
    label: "#2",
    border: "1px solid rgba(192, 192, 192, 0.8)",
    background: "linear-gradient(135deg, rgba(245, 247, 250, 0.9), #fff)",
    badgeBackground: "linear-gradient(135deg, #f2f4f7, #aeb4bd)",
    badgeColor: "#1f2937",
  },
  {
    label: "#3",
    border: "1px solid rgba(205, 127, 50, 0.7)",
    background: "linear-gradient(135deg, rgba(255, 237, 213, 0.72), #fff)",
    badgeBackground: "linear-gradient(135deg, #e6a15c, #cd7f32)",
    badgeColor: "#2f1700",
  },
];

const META_CONFIG_BY_TYPE = {
  rumah: [
    { key: "bedrooms", label: "KT" },
    { key: "bathrooms", label: "KM" },
    { key: "building_type", label: "m²" },
  ],
  villa: [
    { key: "bedrooms", label: "KT" },
    { key: "bathrooms", label: "KM" },
    { key: "building_type", label: "m²" },
  ],
  kos: [
    { key: "room_size", label: "Luas", suffix: "m²" },
    { key: "bathroom_position", label: "KM" },
    { key: "gender_type", label: "Gender" },
  ],
  ruko: [
    { key: "parking_area", label: "PA" },
    { key: "warehouse_area", label: "WA", suffix: "m²" },
    { key: "building_type", label: "m²" },
  ],
  tanah: [
    { key: "zoning", label: "Fungsi" },
    { key: "road_access", label: "Akses" },
    { key: "luas_tanah", label: "LT", suffix: "m²" },
  ],
};

function getImageSrc(property) {
  return property?.images?.[0]?.full_url || property?.imageSrc || fallbackImage;
}

function getLocation(property) {
  return (
    [property?.kecamatan, property?.city].filter(Boolean).join(", ") ||
    property?.location ||
    "Lokasi belum tersedia"
  );
}

function formatHarga(value) {
  const num = Number(String(value).replace(/\./g, ""));
  if (!num) return "Rp 0";
  if (num >= 1000000000)
    return `Rp ${(num / 1000000000).toFixed(1).replace(".0", "")} Miliar`;
  if (num >= 1000000)
    return `Rp ${(num / 1000000).toFixed(1).replace(".0", "")} Juta`;
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)} Ribu`;
  return `Rp ${num}`;
}

function getListingTypeLabel(type) {
  if (type === "jual") return "Dijual";
  if (type === "sewa") return "Disewa";
  return type || "-";
}

function getRentPeriodLabel(property) {
  const period = String(property?.price_period || "bulan");
  if (period === "3bulan") return "3 bulan";
  if (period === "6bulan") return "6 bulan";
  if (period === "tahun") return "tahun";
  return "bulan";
}

function formatPriceDisplay(property) {
  const base = formatHarga(property?.price);
  if (property?.listing_type !== "sewa") return base;
  if (!property?.price) return base;
  return `${base}/${getRentPeriodLabel(property)}`;
}

function getRoomSize(property) {
  const panjang = Number(property?.detail?.panjang_ruangan ?? 0);
  const lebar = Number(property?.detail?.lebar_ruangan ?? 0);
  if (panjang > 0 && lebar > 0) {
    const area = panjang * lebar;
    return Number.isInteger(area)
      ? String(area)
      : String(Number(area.toFixed(2)));
  }
  return property?.building_type;
}

function getMetaValue(property, key) {
  if (key === "bedrooms") return property?.detail?.bedrooms ?? property?.beds;
  if (key === "bathrooms") return property?.detail?.bathrooms ?? property?.baths;
  if (key === "bathroom_position") {
    const position = property?.detail?.bathroom_position;
    if (position === "dalam") return "Dalam";
    if (position === "luar") return "Luar";
    return position;
  }
  if (key === "building_type") {
    return (
      property?.building_type ??
      property?.detail?.luas_bangunan ??
      property?.sqft ??
      property?.detail?.luas_tanah
    );
  }
  if (key === "room_size") return getRoomSize(property);
  if (key === "luas_tanah") return property?.detail?.luas_tanah;
  return property?.detail?.[key];
}

function formatMetaValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
}

function getPropertyMetaItems(property) {
  const type = property?.type || "rumah";
  const config = META_CONFIG_BY_TYPE[type] || META_CONFIG_BY_TYPE.rumah;

  return config.map((item) => ({
    ...item,
    value: formatMetaValue(getMetaValue(property, item.key)),
  }));
}

export default function PropertyListItems({ properties, showItems, showTopRankBadges = false }) {
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();

  const items = Array.isArray(properties) ? properties : [];
  const visibleItems =
    typeof showItems === "number" ? items.slice(0, showItems) : items;

  return (
    <>
      {visibleItems.map((property, index) => {
        const added = isInCompare(property.id);
        const disabled = !added && isFull;
        const metaItems = getPropertyCardMetaItems(property);
        const rankStyle = showTopRankBadges ? RANK_STYLES[index] : null;

        return (
          <div
            key={property.id ?? index}
            className="box-house style-list hover-img mb-20"
            style={
              rankStyle
                ? {
                    position: "relative",
                    border: rankStyle.border,
                    background: rankStyle.background,
                  }
                : undefined
            }
          >
            {rankStyle && (
              <span
                aria-label={`Peringkat rekomendasi ${rankStyle.label}`}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  zIndex: 5,
                  minWidth: 44,
                  height: 34,
                  padding: "0 10px",
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: rankStyle.badgeBackground,
                  color: rankStyle.badgeColor,
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.16)",
                }}
              >
                {rankStyle.label}
              </span>
            )}
            <div className="image-wrap">
              <Link href={`/properti/${property.slug}`}>
                <div
                  className="image"
                  style={{
                    position: "relative",
                    width: "320px",
                    height: "250px",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={getImageSrc(property)}
                    alt={property.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                </div>
              </Link>

              <ul className="box-tag flex gap-8">
                {property.listing_type && (
                  <li className="flat-tag text-4 bg-main fw-6 text_white">
                    {getListingTypeLabel(property.listing_type)}
                  </li>
                )}
                {property.type && (
                  <li className="flat-tag text-4 bg-3 fw-6 text_white">
                    {property.type}
                  </li>
                )}
              </ul>

              <div className="list-btn flex gap-8">
                <button
                  type="button"
                  className={`btn-icon save hover-tooltip ${added ? "active" : ""}`}
                  onClick={() =>
                    added
                      ? removeFromCompare(property.id)
                      : addToCompare(property)
                  }
                  disabled={disabled}
                  aria-pressed={added}
                >
                  <i className="icon-compare" />
                  <span className="tooltip">
                    {added
                      ? "Hapus Komparasi"
                      : disabled
                        ? "Maks 3 properti"
                        : "Komparasi"}
                  </span>
                </button>

                <a href="#" className="btn-icon find hover-tooltip">
                  <i className="icon-find-plus" />
                  <span className="tooltip">Quick View</span>
                </a>
              </div>
            </div>

            <div className="content">
              <h5 className="title">
                <Link href={`/properti/${property.slug}`}>
                  {property.title}
                </Link>
              </h5>

              <p className="location text-1 flex items-center gap-6">
                <i className="icon-location" /> {getLocation(property)}
              </p>

              <ul className="meta-list flex">
                {metaItems.map((item) => (
                  <li className="text-1 flex" key={item.key}>
                    <span>
                      {item.value}
                      {item.suffix || ""}
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>

              <div className="bot flex justify-between items-center">
                <h6 className="price">{formatPriceDisplay(property)}</h6>

                <div className="wrap-btn flex">
                  {false && (
                  <button
                    type="button"
                    className="compare flex gap-8 items-center text-1"
                    onClick={() =>
                      added
                        ? removeFromCompare(property.id)
                        : addToCompare(property)
                    }
                    disabled={disabled}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.4 : 1,
                      color: added ? "var(--Primary, #1a3c6e)" : "",
                      fontWeight: added ? 700 : 400,
                    }}
                  >
                    <i className="icon-compare" />
                    {added ? "Dibandingkan ✓" : "Compare"}
                  </button>
                  )}

                  <Link
                    href={`/properti/${property.slug}`}
                    className="tf-btn style-border pd-4"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
