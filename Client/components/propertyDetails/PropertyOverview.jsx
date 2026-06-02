"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompare } from "@/components/compare/CompareContext";
import PropertyViewMeta from "@/components/properties/PropertyViewMeta";

const DETAIL_FIELDS_BY_TYPE = {
  rumah: ["building_type", "listing_type", "bedrooms", "bathrooms"],
  villa: ["building_type", "listing_type", "bedrooms", "bathrooms"],
  kos: ["gender_type", "bathroom_position", "room_size", "total_rooms"],
  ruko: ["building_type", "parking_capacity", "shop_front_width", "warehouse_area"],
  tanah: ["panjang_tanah", "lebar_tanah", "luas_tanah", "road_access"],
};

const DETAIL_FIELD_LABELS = {
  bedrooms: "Kamar Tidur",
  bathrooms: "Kamar Mandi",
  building_type: "Tipe Bangunan",
  listing_type: "Penawaran",
  luas_bangunan: "Luas Bangunan",
  luas_tanah: "Luas Tanah",
  panjang_tanah: "Panjang Tanah",
  lebar_tanah: "Lebar Tanah",
  view_type: "Pemandangan",
  room_size: "Luas Kamar",
  total_rooms: "Jumlah Kamar",
  gender_type: "Gender",
  bathroom_position: "KM",
  parking_capacity: "Parkir",
  shop_front_width: "Lebar Depan",
  warehouse_area: "Gudang",
  road_access: "Akses Jalan",
  land_type: "Kondisi Tanah",
  land_contour: "Kondisi Tanah",
  zoning: "Peruntukan",
};

const DETAIL_FIELD_SUFFIXES = {
  building_type: " m²",
  luas_bangunan: "m²",
  luas_tanah: "m²",
  panjang_tanah: "m",
  lebar_tanah: "m",
  room_size: "m²",
  parking_capacity: " mobil",
  shop_front_width: "m²",
  warehouse_area: "m²",
};

const TITLE_CASE_FIELDS = new Set([
  "gender_type",
  "bathroom_position",
  "road_access",
  "land_type",
  "land_contour",
]);

const DETAIL_FIELD_ICONS = {
  building_type: "icon-house",
  listing_type: "icon-sale",
  luas_bangunan: "icon-sqft",
  luas_tanah: "icon-land",
  panjang_tanah: "icon-Ruler",
  lebar_tanah: "icon-Ruler",
  bedrooms: "icon-Bed-2",
  bathrooms: "icon-Bathtub",
  view_type: "icon-view",
  gender_type: "icon-user-2",
  bathroom_position: "icon-bath",
  room_size: "icon-Ruler",
  total_rooms: "icon-beds-3",
  parking_capacity: "icon-Garage-1",
  shop_front_width: "icon-Ruler",
  warehouse_area: "icon-warehouse",
  road_access: "icon-location-4",
  land_type: "icon-land",
  land_contour: "icon-SlidersHorizontal",
  zoning: "icon-settings",
};

export default function PropertyOverview({ property }) {
  const router = useRouter();
  const { addToCompare, isInCompare } = useCompare();

  // ✅ Fallback jika property belum ada
  if (!property) {
    return (
      <div className="heading flex justify-between">
        <div className="title text-5 fw-6 text-color-heading">
          Memuat detail properti...
        </div>
      </div>
    );
  }

  // Format harga dengan fungsi yang sudah kita buat sebelumnya
  const formatPrice = (value) => {
    const num = Number(value);
    if (isNaN(num) || num === 0) return "Hubungi Agen";

    const formatUnit = (n) => {
      const rounded = Math.round(n * 10) / 10;
      const text =
        rounded % 1 === 0
          ? String(rounded).replace(/\.0$/, "")
          : String(rounded);
      return text.replace(".", ",");
    };

    if (num >= 1_000_000_000) {
      return `Rp ${formatUnit(num / 1_000_000_000)} milyar`;
    }
    if (num >= 1_000_000) {
      return `Rp ${formatUnit(num / 1_000_000)} juta`;
    }
    if (num >= 1_000) {
      return `Rp ${formatUnit(num / 1_000)} ribu`;
    }
    return `Rp ${num}`;
  };

  const getRentPeriodLabel = (item) => {
    const period = String(item?.price_period || "bulan");
    if (period === "hari") return "hari";
    if (period === "minggu") return "minggu";
    if (period === "3bulan") return "3 bulan";
    if (period === "6bulan") return "6 bulan";
    if (period === "tahun") return "tahun";
    return "bulan";
  };

  const formatPriceDisplay = (item) => {
    const base = formatPrice(item?.price);
    if (item?.listing_type !== "sewa") return base;
    if (base === "Hubungi Agen") return base;
    return `${base}/${getRentPeriodLabel(item)}`;
  };

  const formatDetailValue = (value, key) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Ya" : "Tidak";
    if (TITLE_CASE_FIELDS.has(key)) {
      return String(value)
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("-");
    }
    return String(value);
  };

  const getRoomSize = (item) => {
    const panjang = Number(item?.detail?.panjang_ruangan ?? 0);
    const lebar = Number(item?.detail?.lebar_ruangan ?? 0);
    if (panjang > 0 && lebar > 0) {
      const area = panjang * lebar;
      return Number.isInteger(area) ? String(area) : String(Number(area.toFixed(2)));
    }
    return null;
  };

  const getDetailFieldValue = (item, key) => {
    if (key === "room_size") return getRoomSize(item);
    if (key === "listing_type") return item?.listing_type === "sewa" ? "Disewakan" : "Dijual";
    return item?.detail?.[key] ?? item?.[key];
  };

  const handleShareWhatsApp = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = property?.title ? `${property.title} - ` : "";
    const message = `${title}${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleCompareProperty = () => {
    const added = addToCompare(property);
    if (!added) return;

    const params = new URLSearchParams();
    if (property?.type) params.set("type", property.type);
    if (property?.listing_type) params.set("listing_type", property.listing_type);

    router.push(`/list-properti${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const detailFields = DETAIL_FIELDS_BY_TYPE[property.type] || DETAIL_FIELDS_BY_TYPE.rumah;
  const detailInfoItems = detailFields.map((key) => ({
    key,
    label: DETAIL_FIELD_LABELS[key] || key,
    value: formatDetailValue(getDetailFieldValue(property, key), key),
    suffix: DETAIL_FIELD_SUFFIXES[key] || "",
    icon: DETAIL_FIELD_ICONS[key] || "icon-SlidersHorizontal",
  }));

  return (
    <>
      <div className="heading flex justify-between">
        <div className="title text-5 fw-5 text-color-heading">
          {property.title || "Properti Tidak Diketahui"}
        </div>
        <div className="price text-5 fw-5 text-color-heading">
          {formatPriceDisplay(property)}
          
        </div>
      </div>
      <div className="info property-overview-info flex justify-between items-center">
        <div className="feature">
          <div className="property-location-row text-1 flex items-center">
            <p className="location flex items-center gap-10" style={{ margin: 0 }}>
              <i className="icon-location" />
              <span className="fw-5">
                {property.address ||
                  [property.kecamatan, property.city].filter(Boolean).join(", ") ||
                  "Alamat tidak tersedia"}
              </span>
            </p>
            <PropertyViewMeta
              views={property.views}
              color="inherit"
              iconColor="currentColor"
              fontSize="inherit"
              fontWeight={500}
            />
          </div>
        </div>
        <div className="action">
          <ul className="list-action">
            <li>
              <button
                type="button"
                className={`btn-icon save hover-tooltip ${isInCompare(property.id) ? "active" : ""}`}
                onClick={handleCompareProperty}
                aria-label="Bandingkan properti"
                aria-pressed={isInCompare(property.id)}
              >
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.625 15.75L2.25 12.375M2.25 12.375L5.625 9M2.25 12.375H12.375M12.375 2.25L15.75 5.625M15.75 5.625L12.375 9M15.75 5.625H5.625"
                    stroke="#5C5E61"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="tooltip">
                  {isInCompare(property.id) ? "Sudah di Komparasi" : "Bandingkan"}
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="btn-icon save hover-tooltip"
                onClick={handleShareWhatsApp}
                aria-label="Bagikan ke WhatsApp"
              >
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.41251 8.18028C5.23091 7.85351 4.94594 7.5963 4.60234 7.44902C4.25874 7.30173 3.87596 7.27271 3.51408 7.36651C3.1522 7.46032 2.83171 7.67163 2.60293 7.96728C2.37414 8.26293 2.25 8.62619 2.25 9.00003C2.25 9.37387 2.37414 9.73712 2.60293 10.0328C2.83171 10.3284 3.1522 10.5397 3.51408 10.6335C3.87596 10.7273 4.25874 10.6983 4.60234 10.551C4.94594 10.4038 5.23091 10.1465 5.41251 9.81978M5.41251 8.18028C5.54751 8.42328 5.62476 8.70228 5.62476 9.00003C5.62476 9.29778 5.54751 9.57753 5.41251 9.81978M5.41251 8.18028L12.587 4.19478M5.41251 9.81978L12.587 13.8053M12.587 4.19478C12.6922 4.39288 12.8358 4.56803 13.0095 4.70998C13.1832 4.85192 13.3834 4.95782 13.5985 5.02149C13.8135 5.08515 14.0392 5.1053 14.2621 5.08075C14.4851 5.0562 14.7009 4.98745 14.897 4.87853C15.093 4.7696 15.2654 4.62267 15.404 4.44634C15.5427 4.27001 15.6448 4.06781 15.7043 3.85157C15.7639 3.63532 15.7798 3.40937 15.751 3.18693C15.7222 2.96448 15.6494 2.75 15.5368 2.55603C15.3148 2.17378 14.9518 1.89388 14.5256 1.77649C14.0995 1.6591 13.6443 1.71359 13.2579 1.92824C12.8715 2.1429 12.5848 2.50059 12.4593 2.92442C12.3339 3.34826 12.3797 3.80439 12.587 4.19478ZM12.587 13.8053C12.4794 13.9991 12.4109 14.2121 12.3856 14.4324C12.3603 14.6526 12.3787 14.8757 12.4396 15.0888C12.5005 15.3019 12.6028 15.501 12.7406 15.6746C12.8784 15.8482 13.0491 15.993 13.2429 16.1007C13.4367 16.2083 13.6498 16.2767 13.87 16.302C14.0902 16.3273 14.3133 16.309 14.5264 16.2481C14.7396 16.1872 14.9386 16.0849 15.1122 15.9471C15.2858 15.8092 15.4306 15.6386 15.5383 15.4448C15.7557 15.0534 15.8087 14.5917 15.6857 14.1613C15.5627 13.7308 15.2737 13.3668 14.8824 13.1494C14.491 12.932 14.0293 12.879 13.5989 13.002C13.1684 13.125 12.8044 13.4139 12.587 13.8053Z"
                    stroke="#5C5E61"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="tooltip">Bagikan</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="info-detail">
        {detailInfoItems.map((item, index) => (
          <div className="wrap-box" key={`${item.key}-${index}`}>
            <div className="box-icon">
              <div className="icons">
                <i className={item.icon} />
              </div>
              <div className="content">
                <div className="text-4 text-color-default">{item.label}:</div>
                <div className="text-1 text-color-heading">
                  {item.value}
                  {item.value !== "-" ? item.suffix || "" : ""}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style jsx global>{`
        .property-location-row {
          flex-wrap: wrap;
          column-gap: 28px;
          row-gap: 8px;
          margin-bottom: 0;
        }

        .property-location-row .property-view-meta svg {
          width: 18px;
          height: 18px;
        }

        .property-overview-info {
          align-items: center;
        }

        .property-overview-info .feature,
        .property-overview-info .action,
        .property-overview-info .list-action {
          display: flex;
          align-items: center;
        }

        .property-overview-info .list-action {
          margin-bottom: 0;
        }
      `}</style>
    </>
  );
}
