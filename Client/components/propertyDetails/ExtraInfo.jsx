import React from "react";
import {
  CERTIFICATE_REQUIRED_TYPES,
  formatPropertyValue,
  getPropertyConfig,
} from "@/lib/property";

const MAIN_DETAIL_FIELDS_BY_TYPE = {
  rumah: ["bedrooms", "bathrooms"],
  villa: ["bedrooms", "bathrooms"],
  kos: [
    "gender_type",
    "bathroom_position",
    "total_rooms",
  ],
  ruko: ["parking_capacity", "shop_front_width", "warehouse_area"],
  tanah: ["panjang_tanah", "lebar_tanah", "luas_tanah", "road_access"],
};

export default function ExtraInfo({ property }) {
  if (!property) {
    return (
      <>
        <div className="wg-title text-11 fw-6 text-color-heading">
          Detail Properti
        </div>
        <div className="content">
          <p className="description text-1">Memuat informasi...</p>
        </div>
      </>
    );
  }

  const detail = property.detail || {};
  const description = property.description || "Tidak ada deskripsi tersedia.";
  const propertyType = property.type || "rumah";
  const propertyConfig = getPropertyConfig(propertyType);
  const excludedMainFields = new Set(MAIN_DETAIL_FIELDS_BY_TYPE[propertyType] || []);

  const getVal = (value, fallback = "-") => {
    if (value === null || value === undefined || value === "") return fallback;
    return value;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value).toLocaleString("id-ID");
  };

  const formatText = (value) => {
    return formatPropertyValue(null, value);
  };

  const formatRentPeriod = (value) => {
    const period = String(value || "bulan");
    if (period === "hari") return "Harian";
    if (period === "minggu") return "Mingguan";
    if (period === "3bulan") return "3 Bulan";
    if (period === "6bulan") return "6 Bulan";
    if (period === "tahun") return "Tahunan";
    return "Bulanan";
  };

  const cleanLabel = (label) => label.replace(/\s*\([^)]+\)/g, "");

  const formatFieldValue = (field) => {
    const value = detail[field.name];
    if (field.type === "number") {
      if (value === null || value === undefined || value === "") return "-";
      const unit = field.label.match(/\(([^)]+)\)/)?.[1];
      return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
    }
    return formatPropertyValue(field.name, value);
  };

  const detailItems = [
    {
      key: "listing_type",
      label: "Penawaran",
      value: property.listing_type === "sewa" ? "Disewakan" : "Dijual",
    },
    ...(property.listing_type === "sewa"
      ? [
          {
            key: "rent_period",
            label: "Periode Sewa",
            value: formatRentPeriod(property.price_period || property.rent_period),
          },
        ]
      : CERTIFICATE_REQUIRED_TYPES.includes(propertyType)
        ? [
            {
              key: "certificate_type",
              label: "Sertifikat",
              value: `${getVal(property.certificate_type)} (${formatPropertyValue(
                "certificate_status",
                property.certificate_status,
              )})`,
            },
          ]
        : []),
    ...propertyConfig.fields
      .filter((field) => field.type !== "checkbox" && !excludedMainFields.has(field.name))
      .map((field) => ({
        key: field.name,
        label: cleanLabel(field.label),
        value: formatFieldValue(field),
      })),
  ];

  const midpoint = Math.ceil(detailItems.length / 2);
  const columns = [detailItems.slice(0, midpoint), detailItems.slice(midpoint)];

  const renderDetailItem = (item) => (
    <li className="detail-item flex" key={item.key}>
      <p className="detail-label fw-6">
        {item.label}
      </p>
      <p className="detail-value">{item.value}</p>
    </li>
  );

  return (
    <>
      <div className="wg-title text-11 fw-6 text-color-heading">
        Detail Properti
      </div>
      <div className="content">
        <p className="description text-1">{description}</p>
      </div>
      <div className="box">
        {columns.map((items, index) => (
          <ul key={index}>{items.map(renderDetailItem)}</ul>
        ))}
      </div>
    </>
  );
}
