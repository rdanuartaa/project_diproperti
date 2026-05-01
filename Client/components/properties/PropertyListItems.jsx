import { properties11 } from "@/data/properties";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const fallbackImage = "/images/section/location-24.jpg";

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

// 🔥 SAMA PERSIS DENGAN GRID
function formatHarga(value) {
  const num = Number(String(value).replace(/\./g, ""));

  if (!num) return "Rp 0";

  if (num >= 1000000000) {
    return `Rp ${(num / 1000000000).toFixed(1).replace(".0", "")} Miliar`;
  }
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(1).replace(".0", "")} Juta`;
  }
  if (num >= 1000) {
    return `Rp ${(num / 1000).toFixed(0)} Ribu`;
  }

  return `Rp ${num}`;
}

export default function PropertyListItems({ properties, showItems }) {
  const items = Array.isArray(properties) ? properties : properties11;
  const visibleItems =
    typeof showItems === "number" ? items.slice(0, showItems) : items;

  return (
    <>
      {visibleItems.map((property, index) => (
        <div
          key={property.id ?? index}
          className="box-house style-list hover-img mb-20"
        >
          {/* IMAGE */}
          <div className="image-wrap ">
            <Link href={`/properti/${property.slug}`}>
              <div
                className="image"
                style={{
                  position: "relative",
                  width: "320px",
                  height: "250px", // 🔥 KUNCI BIAR SAMA SEMUA
                  overflow: "hidden",
                }}
              >
                <Image
                  src={getImageSrc(property)}
                  alt={property.title}
                  fill
                  style={{ objectFit: "cover" }}
                  objectPosition="center"
                />
              </div>
            </Link>
            {/* TAG */}
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

            {/* BUTTON */}
            <div className="list-btn flex gap-8">
              <a href="#" className="btn-icon save hover-tooltip">
                <i className="icon-compare" />
                <span className="tooltip">Komparasi</span>
              </a>
              <a href="#" className="btn-icon find hover-tooltip">
                <i className="icon-find-plus" />
                <span className="tooltip">Quick View</span>
              </a>
            </div>
          </div>

          {/* CONTENT */}
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
                <span>{getBedrooms(property)}</span>Beds
              </li>
              <li className="text-1 flex">
                <span>{getBathrooms(property)}</span>Baths
              </li>
              <li className="text-1 flex">
                <span>{getArea(property)}</span>m2
              </li>
            </ul>

            {/* 🔥 BOT SAMA PERSIS GRID */}
            <div className="bot flex justify-between items-center">
              <h6 className="price">{formatHarga(property.price)}</h6>

              <div className="wrap-btn flex">
                <a href="#" className="compare flex gap-8 items-center text-1">
                  <i className="icon-compare" />
                  Compare
                </a>

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
      ))}
    </>
  );
}
