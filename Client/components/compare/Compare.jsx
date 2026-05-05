"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCompare } from "@/components/compare/CompareContext";
import AttentionModal from "@/components/common/AttentionModal";

const formatRupiah = (value) => {
  if (!value && value !== 0) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
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
    label: "One Gate System",
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

const getFieldValue = (property, row) => {
  if (!property) return "-";
  const val =
    row.source === "detail" ? property.detail?.[row.key] : property[row.key];
  if (val === null || val === undefined || val === "") return "-";
  if (row.boolean) return val ? "✓ Ada" : "✗ Tidak";
  if (row.format === "rupiah") return formatRupiah(val);
  if (row.unit) return `${Number(val).toLocaleString("id-ID")} ${row.unit}`;
  if (row.key === "listing_type") return val === "jual" ? "Dijual" : "Disewa";
  return String(val);
};

const getBestIndex = (properties, row) => {
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

const calculateScore = (properties) => {
  if (!properties.length) return [];

  const weights = {
    price: 0.3,

    luas_bangunan: 0.15,
    luas_tanah: 0.1,

    bedrooms: 0.08,
    bathrooms: 0.05,
    floors: 0.03,
    kitchens: 0.02,
    living_rooms: 0.02,

    electricity_capacity: 0.05,
    water: 0.03,
    listrik_type: 0.02,

    one_gate_system: 0.05,
    security_24jam: 0.05,

    carport: 0.02,
    garden: 0.03,
  };

  const getValue = (p, key) => {
    if (key === "price") return p.price;
    if (["water", "listrik_type"].includes(key)) return p.detail?.[key] || null;
    return p.detail?.[key] ?? p[key];
  };

  // mapping string → numeric
  const mapValue = (key, val) => {
    if (val === null || val === undefined) return null;

    if (typeof val === "boolean") return val ? 1 : 0;

    if (key === "water") {
      if (val === "PDAM") return 1;
      if (val === "Sumur") return 0.7;
      return 0.5;
    }

    if (key === "listrik_type") {
      if (val === "PLN") return 1;
      return 0.7;
    }

    return Number(val);
  };

  const keys = Object.keys(weights);

  // ambil semua nilai
  const matrix = properties.map((p) =>
    keys.map((key) => mapValue(key, getValue(p, key))),
  );

  const scores = properties.map(() => 0);

  keys.forEach((key, colIndex) => {
    const column = matrix.map((row) => row[colIndex]).filter((v) => v !== null);

    if (column.length === 0) return;

    const isCost = key === "price";

    const min = Math.min(...column);
    const max = Math.max(...column);

    matrix.forEach((row, i) => {
      const val = row[colIndex];
      if (val === null) return;

      let normalized = 0;

      if (isCost) {
        normalized = min / val;
      } else {
        normalized = max ? val / max : 0;
      }

      scores[i] += normalized * weights[key];
    });
  });

  // convert ke 0–100
  return scores.map((s) => Math.round(s * 100));
};

const buildProsCons = (properties) => {
  if (!properties.length) return [];

  const rowsForProsCons = COMPARE_ROWS.filter(
    (row) =>
      row.key === "price" ||
      row.boolean ||
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

  const rowAverages = rowsForProsCons.reduce((acc, row) => {
    const values = properties
      .map((p) => (row.source === "detail" ? p.detail?.[row.key] : p[row.key]))
      .map((v) => {
        if (v === null || v === undefined || v === "") return null;
        if (row.boolean) return v ? 1 : 0;
        const num = Number(v);
        return Number.isFinite(num) ? num : null;
      })
      .filter((v) => v !== null);

    if (!values.length) return acc;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return { ...acc, [row.key]: { avg, row } };
  }, {});

  const describeAdvantage = (rowKey, rowLabel) => {
    if (rowKey === "price") return "Harga lebih rendah dari rata-rata.";
    if (rowKey === "luas_bangunan") return "Luas bangunan lebih besar dari rata-rata.";
    if (rowKey === "luas_tanah") return "Luas tanah lebih besar dari rata-rata.";
    if (rowKey === "bedrooms") return "Jumlah kamar tidur lebih banyak dari rata-rata.";
    if (rowKey === "bathrooms") return "Jumlah kamar mandi lebih banyak dari rata-rata.";
    if (rowKey === "floors") return "Jumlah lantai lebih banyak dari rata-rata.";
    if (rowKey === "kitchens") return "Jumlah dapur lebih banyak dari rata-rata.";
    if (rowKey === "living_rooms") return "Jumlah ruang tamu lebih banyak dari rata-rata.";
    if (rowKey === "electricity_capacity") return "Daya listrik lebih besar dari rata-rata.";
    if (rowKey === "carport") return "Ada carport.";
    if (rowKey === "garden") return "Ada taman.";
    if (rowKey === "one_gate_system") return "Ada one gate system.";
    if (rowKey === "security_24jam") return "Ada keamanan 24 jam.";
    return `${rowLabel} lebih tinggi dari rata-rata.`;
  };

  const describeLimitation = (rowKey, rowLabel) => {
    if (rowKey === "price") return "Harga lebih tinggi dari rata-rata.";
    if (rowKey === "luas_bangunan") return "Luas bangunan lebih kecil dari rata-rata.";
    if (rowKey === "luas_tanah") return "Luas tanah lebih kecil dari rata-rata.";
    if (rowKey === "bedrooms") return "Jumlah kamar tidur lebih sedikit dari rata-rata.";
    if (rowKey === "bathrooms") return "Jumlah kamar mandi lebih sedikit dari rata-rata.";
    if (rowKey === "floors") return "Jumlah lantai lebih sedikit dari rata-rata.";
    if (rowKey === "kitchens") return "Jumlah dapur lebih sedikit dari rata-rata.";
    if (rowKey === "living_rooms") return "Jumlah ruang tamu lebih sedikit dari rata-rata.";
    if (rowKey === "electricity_capacity") return "Daya listrik lebih kecil dari rata-rata.";
    if (rowKey === "carport") return "Tidak ada carport.";
    if (rowKey === "garden") return "Tidak ada taman.";
    if (rowKey === "one_gate_system") return "Tidak ada one gate system.";
    if (rowKey === "security_24jam") return "Tidak ada keamanan 24 jam.";
    return `${rowLabel} lebih rendah dari rata-rata.`;
  };

  return properties.map((p) => {
    const pros = [];
    const cons = [];

    rowsForProsCons.forEach((row) => {
      const entry = rowAverages[row.key];
      if (!entry) return;

      const raw = row.source === "detail" ? p.detail?.[row.key] : p[row.key];
      if (raw === null || raw === undefined || raw === "") return;

      if (row.boolean) {
        if (raw) pros.push(describeAdvantage(row.key, row.label));
        else cons.push(describeLimitation(row.key, row.label));
        return;
      }

      const num = Number(raw);
      if (!Number.isFinite(num)) return;

      if (row.key === "price") {
        if (num <= entry.avg) pros.push(describeAdvantage(row.key, row.label));
        else cons.push(describeLimitation(row.key, row.label));
      } else if (num >= entry.avg) {
        pros.push(describeAdvantage(row.key, row.label));
      } else {
        cons.push(describeLimitation(row.key, row.label));
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
  const { setIsModalOpen, clearCompare } = useCompare();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attention, setAttention] = useState({ open: false, message: "" });
  const scores = useMemo(() => calculateScore(properties), [properties]);
  const prosCons = useMemo(() => buildProsCons(properties), [properties]);

  const bestScoreIndex = useMemo(() => {
    if (!scores.length) return -1;
    return scores.indexOf(Math.max(...scores));
  }, [scores]);

  const validateProperties = (props) => {
    if (props.length < 2) return true;

    const firstType = props[0].type;
    const firstStatus = props[0].listing_type;

    for (let p of props) {
      if (p.type !== firstType) {
        clearCompare();
        setAttention({
          open: true,
          message:
            "Komparasi hanya bisa untuk tipe properti yang sama (misalnya Rumah dengan Rumah).",
        });
        return false;
      }

      if (p.listing_type !== firstStatus) {
        clearCompare();
        setAttention({
          open: true,
          message:
            "Komparasi hanya bisa untuk status yang sama (Jual dengan Jual atau Sewa dengan Sewa).",
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

    const slugs = decodeURIComponent(slugsParam)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (slugs.length === 0) {
      setProperties([]);
      return;
    }

    const fetchAll = async () => {
  try {
    setLoading(true);

    const results = await Promise.all(
      slugs.map((slug) =>
        api.get(`/properties/${slug}`).then((r) => r.data),
      ),
    );

    // ✅ validasi setelah data ada
    const isValid = validateProperties(results);

    if (!isValid) {
      setProperties([]);
      return;
    }

    setProperties(results);
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
                  ? `Membandingkan ${properties.length} properti`
                  : "Belum ada properti yang dibandingkan"}
              </p>
              {error && (
                <p style={{ color: "red", fontSize: "13px" }}>{error}</p>
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
                            {formatRupiah(prop.price)}
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

                {properties.map((_, idx) => {
                  const isBest = idx === bestScoreIndex;

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
              {COMPARE_ROWS.map((row) => {
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
                <h6 style={{ marginBottom: "8px" }}>Penjelasan</h6>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  {prosCons.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        flex: "0 0 calc(33.333% - 8px)",
                        maxWidth: "calc(33.333% - 8px)",
                        padding: "10px 12px",
                        background: "#fff",
                        borderRadius: "16px",
                        border: "1px solid #e5e7eb",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ position: "relative", marginBottom: "10px" }}>
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
                  ))}
                </div>
                <h6 style={{ margin: "12px 0 8px" }}>Rekomendasi</h6>
                <p style={{ margin: 0, color: "#555" }}>
                  {properties[bestScoreIndex]?.title
                    ? `Berdasarkan perbandingan, properti "${properties[bestScoreIndex].title}" memiliki nilai terbaik dengan skor ${scores[bestScoreIndex]}/100 dan lebih layak untuk dipertimbangkan.`
                    : "Belum cukup data untuk menentukan rekomendasi."}
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
