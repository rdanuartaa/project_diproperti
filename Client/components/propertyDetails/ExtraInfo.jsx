import React from "react";
import { CERTIFICATE_REQUIRED_TYPES, getPropertyConfig } from "@/lib/property";

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

  const getVal = (value, fallback = "-") => {
    if (value === null || value === undefined || value === "") return fallback;
    return value;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value).toLocaleString("id-ID");
  };

  const formatText = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Ya" : "Tidak";
    return String(value)
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("-");
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
      const unit = field.label.match(/\(([^)]+)\)/)?.[1];
      return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
    }
    return formatText(value);
  };

  const detailItems = [
    {
      key: "listing_type",
      label: "Status Listing",
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
              value: `${getVal(property.certificate_type)} (${getVal(property.certificate_status)})`,
            },
          ]
        : []),
    ...propertyConfig.fields
      .filter((field) => field.type !== "checkbox")
      .map((field) => ({
        key: field.name,
        label: cleanLabel(field.label),
        value: formatFieldValue(field),
      })),
  ].filter((item) => item.value !== "-");

  const midpoint = Math.ceil(detailItems.length / 2);
  const columns = [detailItems.slice(0, midpoint), detailItems.slice(midpoint)];

  const renderDetailItem = (item) => (
    <li className="flex" style={{ whiteSpace: "nowrap", gap: "8px" }} key={item.key}>
      <p className="fw-6" style={{ minWidth: "140px" }}>
        {item.label}
      </p>
      <p>{item.value}</p>
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
