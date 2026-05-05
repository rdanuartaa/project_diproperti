"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useCompare } from "@/components/compare/CompareContext";

const fallbackImage = "/images/section/location-23.jpg";

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

function getBedrooms(property) {
  return property?.detail?.bedrooms ?? property?.beds ?? "-";
}

function getBathrooms(property) {
  return property?.detail?.bathrooms ?? property?.baths ?? "-";
}

function getArea(property) {
  return (
    property?.detail?.luas_bangunan ??
    property?.sqft ??
    property?.detail?.luas_tanah ??
    "-"
  );
}

function formatHarga(value) {
  const num = Number(String(value).replace(/\./g, ""));
  if (!num) return "Rp 0";
  if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(1).replace(".0", "")}Miliar`;
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1).replace(".0", "")}Juta`;
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}Ribu`;
  return `Rp ${num}`;
}

export default function PropertyGridItems({ properties, showItems }) {
  // ✅ Ambil semua yang dibutuhkan dari CompareContext
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();

  const items = Array.isArray(properties) ? properties : [];
  const visibleItems = typeof showItems === "number" ? items.slice(0, showItems) : items;

  return (
    <>
      {visibleItems.map((property) => {
        const added = isInCompare(property.id);
        const disabled = !added && isFull;

        return (
          <div className="box-house hover-img" key={property.id}>
            <div className="image-wrap property-card-image-wrap">
              <Link href={`/properti/${property.slug}`}>
                <div className="image" style={{ position: "relative", height: "250px" }}>
                  <Image
                    src={getImageSrc(property)}
                    alt={property.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </Link>

              <ul className="box-tag flex gap-8">
                {property.listing_type && (
                  <li className="flat-tag text-4 bg-main fw-6 text_white">
                    {property.listing_type}
                  </li>
                )}
                {property.type && (
                  <li className="flat-tag text-4 bg-3 fw-6 text_white">
                    {property.type}
                  </li>
                )}
              </ul>

              <div className="list-btn flex gap-8">
                {/* ✅ Tombol komparasi icon — terhubung ke CompareContext */}
                <button
                  type="button"
                  className={`btn-icon save hover-tooltip ${added ? "active" : ""}`}
                  onClick={() => added ? removeFromCompare(property.id) : addToCompare(property)}
                  disabled={disabled}
                  aria-pressed={added}
                >
                  <i className="icon-compare" />
                  <span className="tooltip">
                    {added ? "Hapus Komparasi" : disabled ? "Maks 3 properti" : "Komparasi"}
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
                <li className="text-1 flex">
                  <span>{getBedrooms(property)}</span>KT
                </li>
                <li className="text-1 flex">
                  <span>{getBathrooms(property)}</span>KM
                </li>
                <li className="text-1 flex">
                  <span>{getArea(property)}</span>m2
                </li>
              </ul>
              <div className="bot flex justify-between items-center">
                <h6 className="price">{formatHarga(property.price)}</h6>
                <div className="wrap-btn flex">
                  {/* ✅ Tombol Compare teks di bawah card — terhubung ke CompareContext */}
                  <button
                    type="button"
                    className="compare flex gap-8 items-center text-1"
                    onClick={() => added ? removeFromCompare(property.id) : addToCompare(property)}
                    disabled={disabled}
                    aria-pressed={added}
                  >
                    <i className="icon-compare" />
                    {added ? "Dibandingkan ✓" : "Compare"}
                  </button>

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
