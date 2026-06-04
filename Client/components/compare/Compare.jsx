"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCompare } from "@/components/compare/CompareContext";
import AttentionModal from "@/components/common/AttentionModal";
import {
  getBuildingTypeDisplay,
  getBuildingTypeLabel,
  getPropertyConfig,
} from "@/lib/property";

const formatRupiah = (value) => {
  if (!value && value !== 0) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const MINIMUM_WINNING_MARGIN = 2;

const getRentPeriodLabel = (property) => {
  const period = String(property?.price_period || "bulan");
  if (period === "hari") return "hari";
  if (period === "minggu") return "minggu";
  if (period === "3bulan") return "3 bulan";
  if (period === "6bulan") return "6 bulan";
  if (period === "tahun") return "tahun";
  return "bulan";
};

const formatPriceDisplay = (property) => {
  const base = formatRupiah(property?.price);
  if (property?.listing_type !== "sewa") return base;
  if (!property?.price) return base;
  return `${base}/${getRentPeriodLabel(property)}`;
};

const getComparableMonthlyPrice = (property) => {
  const price = Number(property?.price || 0);
  if (property?.listing_type !== "sewa") return price;

  const period = String(property?.price_period || property?.rent_period || "bulan");
  if (period === "hari") return price * 30;
  if (period === "minggu") return price * 4.345;
  if (period === "3bulan") return price / 3;
  if (period === "6bulan") return price / 6;
  if (period === "tahun") return price / 12;
  return price;
};

const COMPARE_ROWS = [
  { key: "type", label: "Tipe Properti", source: "root" },
  { key: "building_type", label: "Tipe Bangunan", source: "root", unit: "m²" },
  { key: "listing_type", label: "Status", source: "root", badge: true },
  { key: "price", label: "Harga", source: "root", format: "rupiah" },
  { key: "city", label: "Kota", source: "root" },
  { key: "kecamatan", label: "Kecamatan", source: "root" },
  { key: "certificate_type", label: "Sertifikat", source: "root" },
  {
    key: "luas_bangunan",
    label: "Luas Bangunan",
    source: "detail",
    unit: "m²",
  },
  { key: "luas_tanah", label: "Luas Tanah", source: "detail", unit: "m²" },
  { key: "bedrooms", label: "Kamar Tidur", source: "detail" },
  { key: "bathrooms", label: "Kamar Mandi", source: "detail" },
  { key: "floors", label: "Lantai", source: "detail" },
  { key: "kitchens", label: "Dapur", source: "detail" },
  { key: "living_rooms", label: "Ruang Tamu", source: "detail" },
  {
    key: "electricity_capacity",
    label: "Daya Listrik",
    source: "detail",
    unit: "VA",
  },
  { key: "water", label: "Sumber Air", source: "detail" },
  { key: "listrik_type", label: "Tipe Listrik", source: "detail" },
  { key: "carport", label: "Carport", source: "detail", boolean: true },
  { key: "garden", label: "Taman", source: "detail", boolean: true },
  {
    key: "one_gate_system",
    label: "Sistem Satu Gerbang",
    source: "detail",
    boolean: true,
  },
  {
    key: "security_24jam",
    label: "Keamanan 24 Jam",
    source: "detail",
    boolean: true,
  },
];

const CERTIFICATE_TYPES = new Set(["rumah", "villa", "ruko", "tanah"]);

const FIELD_UNITS = {
  luas_tanah: "m²",
  luas_bangunan: "m²",
  electricity_capacity: "VA",
  panjang_ruangan: "m",
  lebar_ruangan: "m",
  panjang_tanah: "m",
  lebar_tanah: "m",
  room_size: "m²",
  warehouse_area: "m²",
  shop_front_width: "m²",
  parking_capacity: "mobil",
};

const VALUE_LABELS = {
  listing_type: { jual: "Dijual", sewa: "Disewa" },
  price_period: {
    hari: "Hari",
    minggu: "Minggu",
    bulan: "Bulan",
    "3bulan": "3 Bulan",
    "6bulan": "6 Bulan",
    tahun: "Tahun",
  },
  water: { pdam: "PDAM", sumur: "Sumur", PDAM: "PDAM", Sumur: "Sumur" },
  listrik_type: { overground: "Overground", underground: "Underground", PLN: "PLN" },
  bathroom_position: { dalam: "Dalam", luar: "Luar" },
  gender_type: {
    "laki-laki": "Laki-laki",
    perempuan: "Perempuan",
    campuran: "Campuran",
  },
  road_access: { aspal: "Aspal", cor: "Cor", batu: "Batu", belum: "Belum" },
  land_type: { datar: "Datar", miring: "Miring", bukit: "Bukit" },
};

const normalizeCompareValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const RANK_VALUE_MAPS = {
  water: { pdam: 1, sumur: 0.75, PDAM: 1, Sumur: 0.75 },
  listrik_type: { underground: 1, overground: 0.85, PLN: 1 },
  bathroom_position: { dalam: 1, luar: 0.7 },
  road_access: { aspal: 1, cor: 0.9, batu: 0.65, belum: 0.35 },
  land_type: { datar: 1, miring: 0.75, bukit: 0.65 },
};

const PRESENCE_SCORE_KEYS = new Set(["gender_type", "land_contour", "zoning"]);

const BASE_COMPARE_ROWS = [
  { key: "type", label: "Tipe Properti", source: "root" },
  { key: "building_type_display", label: "Tipe Bangunan", source: "computed" },
  { key: "listing_type", label: "Status", source: "root", badge: true },
  { key: "price", label: "Harga", source: "root", format: "rupiah" },
  { key: "kecamatan", label: "Kecamatan", source: "root" },
  { key: "city", label: "Kota", source: "root" },
];

const cleanLabel = (label) => String(label || "").replace(/\s*\([^)]*\)/g, "");

const getFieldUnit = (field) => {
  const unitFromLabel = String(field?.label || "").match(/\(([^)]+)\)/)?.[1];
  return FIELD_UNITS[field.name] || unitFromLabel || undefined;
};

const getRoomSize = (property) => {
  const length = Number(property?.detail?.panjang_ruangan ?? 0);
  const width = Number(property?.detail?.lebar_ruangan ?? 0);
  if (length > 0 && width > 0) {
    const area = length * width;
    return Number.isInteger(area) ? area : Number(area.toFixed(2));
  }
  return null;
};

const buildCompareRows = (properties) => {
  const type = properties[0]?.type || "rumah";
  const listingType = properties[0]?.listing_type;
  const config = getPropertyConfig(type);
  const rows = BASE_COMPARE_ROWS.map((row) =>
    row.key === "building_type_display"
      ? {
          ...row,
          label: getBuildingTypeLabel(type),
          unit: ["kos", "tanah"].includes(type) ? "m²" : undefined,
          compare: ["kos", "tanah"].includes(type) ? "max" : undefined,
        }
      : row,
  );

  if (listingType === "sewa") {
    rows.splice(3, 0, {
      key: "price_period",
      label: "Periode Sewa",
      source: "root",
    });
  }

  if (CERTIFICATE_TYPES.has(type)) {
    rows.push({ key: "certificate_type", label: "Sertifikat", source: "root" });
  }

  config.fields.forEach((field) => {
    rows.push({
      key: field.name,
      label: cleanLabel(field.label),
      source: "detail",
      unit: getFieldUnit(field),
      boolean: field.type === "checkbox",
      compare:
        field.type === "checkbox"
          ? "boolean"
          : field.type === "number"
            ? "max"
            : RANK_VALUE_MAPS[field.name]
              ? "rank"
              : undefined,
    });
  });

  return rows;
};

const getRawFieldValue = (property, row) => {
  if (row.key === "price") return getComparableMonthlyPrice(property);
  if (row.key === "price_period") return property?.price_period || "bulan";
  if (row.source === "computed") {
    if (row.key === "building_type_display") return getBuildingTypeDisplay(property);
    return row.key === "room_size" ? getRoomSize(property) : null;
  }
  if (property?.type === "tanah" && row.key === "luas_tanah") {
    return property.detail?.luas_tanah || getBuildingTypeDisplay(property);
  }
  return row.source === "detail" ? property.detail?.[row.key] : property[row.key];
};

const getFieldValue = (property, row) => {
  if (!property) return "-";
  const val = getRawFieldValue(property, row);
  if (val === null || val === undefined || val === "") return "-";
  if (row.boolean) return val ? "✓ Ada" : "✗ Tidak";
  if (row.format === "rupiah") {
    if (row.key === "price") return formatPriceDisplay(property);
    return formatRupiah(val);
  }
  if (row.unit) return `${Number(val).toLocaleString("id-ID")} ${row.unit}`;
  if (VALUE_LABELS[row.key]?.[val]) return VALUE_LABELS[row.key][val];
  return String(val);
};

const getBestIndex = (properties, row) => {
  if (row.compare === "max" || row.compare === "rank") {
    const valuesWithIndex = properties.map((p, idx) => {
      const rawValue = getRawFieldValue(p, row);
      const value =
        row.compare === "rank"
          ? RANK_VALUE_MAPS[row.key]?.[rawValue]
          : rawValue;
      return {
        idx,
        value:
          value !== null && value !== undefined && value !== ""
            ? Number(value)
            : null,
      };
    });
    const valid = valuesWithIndex.filter((item) => item.value !== null);
    if (valid.length < 2) return -1;
    const bestValue = Math.max(...valid.map((v) => v.value));
    if (valid.filter((v) => v.value === bestValue).length > 1) return -1;
    return valid.find((v) => v.value === bestValue)?.idx ?? -1;
  }

  const numericKeys = [
    "price",
    "luas_bangunan",
    "luas_tanah",
    "bedrooms",
    "bathrooms",
    "floors",
    "kitchens",
    "living_rooms",
    "electricity_capacity",
  ];

  if (!numericKeys.includes(row.key)) return -1;

  const valuesWithIndex = properties.map((p, idx) => {
    const v = row.source === "detail" ? p.detail?.[row.key] : p[row.key];
    const numValue =
      v !== null && v !== undefined && v !== "" ? Number(v) : null;
    return { idx, value: numValue };
  });

  const valid = valuesWithIndex.filter((item) => item.value !== null);
  if (valid.length < 2) return -1;

  const bestValue =
    row.key === "price"
      ? Math.min(...valid.map((v) => v.value))
      : Math.max(...valid.map((v) => v.value));

  const bestCount = valid.filter((v) => v.value === bestValue).length;
  // ⚠️ Jika ada lebih dari 1 properti dengan nilai terbaik → TIDAK ada yang di-highlight
  if (bestCount > 1) return -1;

  return valid.find((v) => v.value === bestValue)?.idx ?? -1;
};

const buildProsCons = (properties, compareRows = COMPARE_ROWS) => {
  if (!properties.length) return [];

  const rowsForProsCons = compareRows.filter(
    (row) =>
      row.key === "price" ||
      row.boolean ||
      row.compare ||
      [
        "luas_bangunan",
        "luas_tanah",
        "bedrooms",
        "bathrooms",
        "floors",
        "kitchens",
        "living_rooms",
        "electricity_capacity",
      ].includes(row.key),
  );

  const getBooleanBestIndex = (rowKey) => {
    const values = properties.map((p) => p.detail?.[rowKey] ?? p[rowKey]);
    const truthyIndexes = values
      .map((v, idx) => (v ? idx : null))
      .filter((idx) => idx !== null);

    if (truthyIndexes.length !== 1) return -1;
    return truthyIndexes[0];
  };

  const describeAdvantage = (rowKey, rowLabel, value) => {
    if (rowKey === "price") return `Harga termurah (${value}).`;
    return `${rowLabel} terbaik (${value}).`;
  };

  const describeLimitation = (rowKey, rowLabel, value, bestValue) => {
    if (rowKey === "price")
      return `Lebih mahal (${value} vs ${bestValue}).`;
    return `Kalah di ${rowLabel} (${value} vs ${bestValue}).`;
  };

  return properties.map((p, idx) => {
    const pros = [];
    const cons = [];

    rowsForProsCons.forEach((row) => {
      const bestIdx = row.boolean
        ? getBooleanBestIndex(row.key)
        : getBestIndex(properties, row);

      if (bestIdx === -1) return;

      const currentValue = getFieldValue(p, row);
      const bestValue = getFieldValue(properties[bestIdx], row);

      if (bestIdx === idx) {
        pros.push(describeAdvantage(row.key, row.label, currentValue));
      } else {
        cons.push(
          describeLimitation(row.key, row.label, currentValue, bestValue),
        );
      }
    });

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      image: p.images?.[0]?.full_url,
      pros: pros.slice(0, 3),
      cons: cons.slice(0, 3),
    };
  });
};

export default function Compare() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCompare } = useCompare();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attention, setAttention] = useState({ open: false, message: "" });
  const compareRows = useMemo(() => buildCompareRows(properties), [properties]);
  const comparisonWeights = properties[0]?.comparison_weights;
  const rawScores = useMemo(
    () => properties.map((property) => Number(property.comparison_score || 0) * 100),
    [properties],
  );
  const scores = useMemo(
    () => rawScores.map((score) => Math.round(score)),
    [rawScores],
  );
  const prosCons = useMemo(
    () => buildProsCons(properties, compareRows),
    [properties, compareRows],
  );

  const bestScoreIndex = useMemo(() => {
    if (properties.length < 2) return -1;

    const rankedScores = rawScores
      .map((score, index) => ({ index, score }))
      .sort((a, b) => b.score - a.score);

    return rankedScores[0].score - rankedScores[1].score >= MINIMUM_WINNING_MARGIN
      ? rankedScores[0].index
      : -1;
  }, [properties.length, rawScores]);

  const recommendationText = useMemo(() => {
    if (bestScoreIndex >= 0) {
      return `Berdasarkan perbandingan, properti "${properties[bestScoreIndex].title}" memiliki nilai terbaik dengan skor ${scores[bestScoreIndex]}/100 dan lebih layak untuk dipertimbangkan.`;
    }

    if (properties.length > 1) {
      const topScore = Math.max(...rawScores);
      const comparableTitles = properties
        .filter((_, index) => topScore - rawScores[index] < MINIMUM_WINNING_MARGIN)
        .map((property) => `"${property.title}"`);

      return `Belum ada pemenang yang meyakinkan. ${comparableTitles.join(" dan ")} memiliki skor yang relatif setara; pertimbangkan prioritas harga, luas, lokasi, dan fasilitas Anda.`;
    }

    return "Belum cukup data untuk menentukan rekomendasi.";
  }, [bestScoreIndex, properties, rawScores, scores]);

  const validateProperties = (props) => {
    if (props.length < 2) return true;

    const firstType = normalizeCompareValue(props[0].type);
    const firstStatus = normalizeCompareValue(props[0].listing_type);
    const typeLabel = getPropertyConfig(props[0].type).label;
    const statusLabel = VALUE_LABELS.listing_type[props[0].listing_type] || props[0].listing_type;

    for (let p of props) {
      if (normalizeCompareValue(p.type) !== firstType) {
        clearCompare();
        setAttention({
          open: true,
          message:
            `Komparasi hanya bisa untuk tipe properti yang sama. Pilihan pertama adalah ${typeLabel}, jadi tipe lain tidak bisa dibandingkan bersama.`,
        });
        return false;
      }

      if (normalizeCompareValue(p.listing_type) !== firstStatus) {
        clearCompare();
        setAttention({
          open: true,
          message:
            `Komparasi hanya bisa untuk penawaran yang sama. Pilihan pertama adalah ${statusLabel}, jadi penawaran lain tidak bisa dibandingkan bersama.`,
        });
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    const slugsParam = searchParams.get("slugs");
    if (!slugsParam) {
      setProperties([]);
      return;
    }

    const slugs = Array.from(
      new Set(
        decodeURIComponent(slugsParam)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ).slice(0, 3);

    if (slugs.length === 0) {
      setProperties([]);
      return;
    }

    const fetchAll = async () => {
  try {
    setLoading(true);
    setError("");

    const [results, comparisonResponse] = await Promise.all([
      Promise.all(
      slugs.map((slug) =>
        api.get(`/properties/${slug}`).then((r) => r.data),
      ),
      ),
      api.get("/properties/comparisons", {
        params: { slugs: slugs.join(",") },
      }),
    ]);

    // ✅ validasi setelah data ada
    const isValid = validateProperties(results);

    if (!isValid) {
      setProperties([]);
      return;
    }

    const comparisonBySlug = new Map(
      (comparisonResponse.data || []).map((property) => [property.slug, property]),
    );
    setProperties(
      results.map((property) => ({
        ...property,
        ...comparisonBySlug.get(property.slug),
      })),
    );
  } catch {
    setError("Gagal memuat data properti.");
  } finally {
    setLoading(false);
  }
};

    fetchAll();
  }, [searchParams]);

  const emptySlots = 3 - properties.length;

  const handleReset = () => {
    clearCompare();
    router.push("/komparasi");
    setProperties([]);
  };

  const handleAddProperty = () => {
    const reference = properties[0];
    if (reference?.type && reference?.listing_type) {
      router.push(
        `/list-properti?type=${encodeURIComponent(reference.type)}&listing_type=${encodeURIComponent(reference.listing_type)}`,
      );
      return;
    }

    router.push("/list-properti");
  };

  if (loading)
    return (
      <div className="tf-spacing-7 pt-0">
        <div className="tf-container">
          <div
            style={{ textAlign: "center", padding: "80px 0", color: "#888" }}
          >
            Memuat data komparasi...
          </div>
        </div>
      </div>
    );

  return (
    <div className="tf-spacing-7 pt-0">
      <div className="tf-container">
        <div className="row">
          <div className="col-12">
            {/* Header dengan tombol reset */}
            <div style={{ marginBottom: "32px", position: "relative" }}>
              <h2 className="fw-7 mb-8">Komparasi Properti</h2>
              <p className="text-1" style={{ color: "#666" }}>
                {properties.length > 0
                  ? `Membandingkan ${properties.length} properti ${VALUE_LABELS.listing_type[properties[0]?.listing_type] || ""} tipe ${getPropertyConfig(properties[0]?.type).label}. Field komparasi disesuaikan dengan tipe properti ini.`
                  : "Belum ada properti yang dibandingkan"}
              </p>
              {error && (
                <p style={{ color: "red", fontSize: "13px" }}>{error}</p>
              )}
              {comparisonWeights && (
                <div
                  className="text-1"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px 14px",
                    marginTop: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "rgba(2, 70, 155, 0.06)",
                    color: "#374151",
                  }}
                >
                  <strong>Profil bobot komparasi:</strong>
                  <span>Harga {comparisonWeights.price}%</span>
                  <span>Lokasi {comparisonWeights.location}%</span>
                  <span>Luas {comparisonWeights.area}%</span>
                  <span>Fasilitas {comparisonWeights.facilities}%</span>
                </div>
              )}

              {/* Tombol Reset */}
              {properties.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    position: "absolute",
                    right: "1.25rem",
                    top: "1.25rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "24px",
                    color: "#888",
                    padding: "4px",
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#e74c3c")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
                  aria-label="Reset Komparasi"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="tf-compare-table">
              {/* ✅ HEADER FOTO - Flexbox Layout */}

              <div className="tf-compare-row tf-compare-grid">
                {/* Kolom Label (Kosong di header) */}
                <div className="tf-compare-col d-md-block d-none" />

                {/* Properti yang dipilih */}
                {properties.map((prop) => (
                  <div className="tf-compare-col" key={prop.id}>
                    <div className="tf-compare-item">
                      <Link
                        className="tf-compare-image"
                        href={`/properti/${prop.slug}`}
                        style={{
                          display: "block",
                          width: "100%",
                          aspectRatio: "4/3",
                          borderRadius: "12px",
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          alt={prop.title}
                          width={280}
                          height={210}
                          src={
                            prop.images?.[0]?.full_url ||
                            "/images/section/compare-1.jpg"
                          }
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      </Link>
                      <div className="tf-compare-content">
                        <Link
                          className="link text-title h6 line-clamp-1"
                          href={`/properti/${prop.slug}`}
                        >
                          {prop.title}
                        </Link>
                        <div className="property-info">
                          <div className="price text-1 fw-5 text-color-heading">
                            {formatPriceDisplay(prop)}
                          </div>
                          <p className="d-flex align-items-center gap-8">
                            <i className="icon-location text-color-default" />
                            {prop.kecamatan}, {prop.city}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* ✅ Slot Kosong - selalu tampil agar layout 3 kolom konsisten */}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div className="tf-compare-col" key={`empty-${i}`}>
                    <button
                      onClick={handleAddProperty}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        aspectRatio: "4/3",
                        border: "2px dashed #ddd",
                        borderRadius: "12px",
                        background: "#fafafa",
                        cursor: "pointer",
                        color: "#bbb",
                        gap: "8px",
                        fontSize: "13px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f0f0f0";
                        e.currentTarget.style.borderColor = "#ccc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fafafa";
                        e.currentTarget.style.borderColor = "#ddd";
                      }}
                    >
                      <span style={{ fontSize: "32px", lineHeight: 1 }}>+</span>
                      <span>Tambah Properti</span>
                    </button>
                  </div>
                ))}
              </div>
              {/* 🔥 BARIS SKOR */}
              <div className="tf-compare-row">
                <div className="tf-compare-col tf-compare-field d-md-block d-none">
                  <h6>Skor</h6>
                </div>

                {properties.map((property, idx) => {
                  const isBest = idx === bestScoreIndex;
                  const detail = property.comparison_detail || {};
                  const penalty = Math.round(Number(detail.completeness_penalty || 0) * 100);

                  return (
                    <div
                      key={idx}
                      className="tf-compare-col tf-compare-field text-center"
                      style={
                        isBest
                          ? {
                              background: "rgba(2,70,155,0.05)",
                              borderRadius: "6px",
                            }
                          : {}
                      }
                    >
                      <span
                        style={
                          isBest
                            ? { color: "var(--Primary)", fontWeight: 700 }
                            : {}
                        }
                      >
                        {scores[idx] ?? 0} / 100
                        {isBest && (
                          <span
                            style={{
                              marginLeft: "6px",
                              fontSize: "10px",
                              background: "var(--Primary)",
                              color: "#fff",
                              borderRadius: "4px",
                              padding: "2px 6px",
                            }}
                          >
                            Terbaik
                          </span>
                        )}
                      </span>
                      <div style={{ marginTop: "6px", fontSize: "11px", lineHeight: 1.45, color: "#6b7280" }}>
                        Harga {Math.round(Number(detail.price_score || 0) * 100)}% ·
                        Lokasi {Math.round(Number(detail.location_score || 0) * 100)}% ·
                        Luas {Math.round(Number(detail.area_score || 0) * 100)}% ·
                        Fasilitas {Math.round(Number(detail.facility_score || 0) * 100)}%
                        {penalty > 0 && (
                          <div style={{ color: "#b42318", fontWeight: 600 }}>
                            Data belum lengkap: -{penalty}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div
                    key={`empty-score-${i}`}
                    className="tf-compare-col tf-compare-field text-center"
                  >
                    -
                  </div>
                ))}
              </div>
              {compareRows.map((row) => {
                const bestIdx = getBestIndex(properties, row);

                return (
                  <div className="tf-compare-row" key={row.key}>
                    {/* Label */}
                    <div className="tf-compare-col tf-compare-field d-md-block d-none">
                      <h6>{row.label}</h6>
                    </div>

                    {/* Data */}
                    {properties.map((prop, idx) => {
                      const val = getFieldValue(prop, row);
                      const isBest = bestIdx === idx;

                      return (
                        <div
                          key={prop.id}
                          className="tf-compare-col tf-compare-field text-center"
                          style={
                            isBest
                              ? {
                                  background: "rgba(2,70,155,0.05)",
                                  borderRadius: "6px",
                                }
                              : {}
                          }
                        >
                          {row.badge && val && val !== "-" ? (
                            <span className="type">{val}</span>
                          ) : (
                            <span
                              style={
                                isBest
                                  ? {
                                      color: "var(--Primary)",
                                      fontWeight: 700,
                                    }
                                  : {}
                              }
                            >
                              {val ?? "-"}

                              {isBest && val && val !== "-" && (
                                <span
                                  style={{
                                    marginLeft: "6px",
                                    fontSize: "10px",
                                    background: "var(--Primary)",
                                    color: "#fff",
                                    borderRadius: "4px",
                                    padding: "2px 6px",
                                  }}
                                >
                                  {row.key === "price" ? "Termurah" : "Terbaik"}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Slot kosong */}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="tf-compare-col tf-compare-field text-center"
                      >
                        -
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            {/* 🔥 KESIMPULAN */}
            {properties.length > 1 && (
              <div
                style={{
                  marginTop: "24px",
                  padding: "16px",
                  background: "#f8f9fb",
                  borderRadius: "8px",
                }}
              >
                <h6 className="compare-explanation-title">Penjelasan</h6>
                <div
                  className="compare-explanation-list"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  {prosCons.map((item, idx) => (
                    <div
                      className="compare-explanation-card"
                      key={item.id}
                      style={{
                        padding: "10px 12px",
                        background: "#fff",
                        borderRadius: "16px",
                        border: "1px solid #e5e7eb",
                        overflow: "visible",
                      }}
                    >
                      <div
                        className="compare-explanation-media"
                        style={{ position: "relative", marginBottom: "10px" }}
                      >
                        <Link
                          href={`/properti/${item.slug}`}
                          style={{
                            display: "block",
                            width: "100%",
                            aspectRatio: "4 / 3",
                            borderRadius: "16px",
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <Image
                            src={item.image || "/images/section/compare-1.jpg"}
                            alt={item.title}
                            fill
                            sizes="320px"
                            style={{ objectFit: "cover" }}
                          />
                        </Link>
                        <div
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "10px",
                            width: "56px",
                            height: "56px",
                            borderRadius: "999px",
                            background: "var(--Primary, #1a3c6e)",
                            color: "#fff",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 600,
                            lineHeight: 1.1,
                            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                          }}
                        >
                          <span>Skor</span>
                          <span style={{ fontSize: "14px", fontWeight: 700 }}>
                            {scores[idx] ?? 0}
                          </span>
                        </div>
                      </div>

                      <div className="compare-explanation-content">
                      <p style={{ margin: "0 0 6px", fontWeight: 600 }}>
                        {item.title}
                      </p>

                      <div style={{ marginBottom: "6px", color: "#374151", fontSize: "13px" }}>
                        <div style={{ fontWeight: 600, marginBottom: "4px" }}>Kelebihan</div>
                        {item.pros.length ? (
                          item.pros.map((text, i) => (
                            <p key={i} style={{ margin: "0 0 4px" }}>
                              <span style={{ color: "#16a34a", fontWeight: 700 }}>
                                ✓
                              </span>{" "}
                              {text}
                            </p>
                          ))
                        ) : (
                          <p style={{ margin: 0 }}>
                            <span style={{ color: "#16a34a", fontWeight: 700 }}>
                              ✓
                            </span>{" "}
                            Tidak ada poin.
                          </p>
                        )}
                      </div>

                      <div style={{ color: "#374151", fontSize: "13px" }}>
                        <div style={{ fontWeight: 600, marginBottom: "4px" }}>Kekurangan</div>
                        {item.cons.length ? (
                          item.cons.map((text, i) => (
                            <p key={i} style={{ margin: "0 0 4px" }}>
                              <span style={{ color: "#dc2626", fontWeight: 700 }}>
                                ✕
                              </span>{" "}
                              {text}
                            </p>
                          ))
                        ) : (
                          <p style={{ margin: 0 }}>
                            <span style={{ color: "#dc2626", fontWeight: 700 }}>
                              ✕
                            </span>{" "}
                            Tidak ada poin.
                          </p>
                        )}
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
                <h6 style={{ margin: "18px 0 8px" }}>Rekomendasi</h6>
                <p style={{ margin: 0, color: "#555" }}>
                  {recommendationText}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <AttentionModal
        isOpen={attention.open}
        onClose={() => setAttention({ open: false, message: "" })}
        message={attention.message}
      />
    </div>
  );
}
