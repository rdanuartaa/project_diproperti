"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import DropdownSelect from "@/components/common/DropdownSelect";
import PropertyGridItems from "@/components/properties/PropertyGridItems";
import PropertyListItems from "@/components/properties/PropertyListItems";

const PAGE_SIZE = 10;
const PROPERTY_TYPE_OPTIONS = ["rumah", "villa", "ruko", "kos", "tanah"];
const LISTING_TYPE_OPTIONS = ["Dijual", "Disewa"];
const DEFAULT_FILTERS = {
  type: "rumah",
  listing_type: "jual",
};

const DEFAULT_WEIGHTS = {
  price: 25,
  location: 25,
  area: 25,
  facilities: 25,
};

const CRITERIA_LABELS = {
  price: {
    label: "Harga",
    hint: "Lebih terjangkau = skor lebih tinggi",
  },
  location: {
    label: "Lokasi",
    hint: "Semakin dekat ke pusat kota / Alun-Alun Jember, skor makin tinggi",
  },
  area: {
    label: "Luas",
    hints: {
      rumah: "60% luas bangunan + 40% luas tanah",
      villa: "60% luas bangunan + 40% luas tanah",
      ruko: "50% luas bangunan + 30% luas tanah + 20% lebar depan/gudang",
      kos: "70% luas kamar + 30% total kamar",
      tanah: "100% luas tanah",
      default: "Disesuaikan dengan tipe properti yang dipilih",
    },
  },
  facilities: {
    label: "Fasilitas",
    hints: {
      rumah: "45% kelengkapan ruang + 55% carport, taman, keamanan, listrik, dan air",
      villa: "40% kelengkapan ruang + 60% kolam renang, furnished, wisata, view, dan taman",
      ruko: "40% kebutuhan bisnis + 60% utilitas listrik dan air",
      kos: "40% kelengkapan kamar + 60% WiFi, listrik, air, dapur, parkir, dan CCTV",
      tanah: "Akses jalan, zoning, kondisi tanah, dan kontur tanah",
      default: "Disesuaikan dengan tipe properti yang dipilih",
    },
  },
};

const CRITERIA = [
  { key: "price" },
  { key: "location" },
  { key: "area" },
  { key: "facilities" },
];

const AHP_PAIRS = [
  { a: "price", b: "location" },
  { a: "price", b: "area" },
  { a: "price", b: "facilities" },
  { a: "location", b: "area" },
  { a: "location", b: "facilities" },
  { a: "area", b: "facilities" },
];

const DEFAULT_AHP_COMPARISONS = Object.fromEntries(
  AHP_PAIRS.map((pair) => [`${pair.a}:${pair.b}`, 1]),
);

function getPageItems(currentPage, lastPage) {
  if (lastPage <= 4) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  if (currentPage <= 2) return [1, 2, "...", lastPage];
  if (currentPage >= lastPage - 1) return [1, "...", lastPage - 1, lastPage];

  return [1, currentPage, "...", lastPage];
}

const RANDOM_INDEX_BY_SIZE = {
  4: 0.9,
};

const getCriterionDisplay = (criterionKey, propertyType) => {
  const config = CRITERIA_LABELS[criterionKey];
  return {
    label: config.label,
    hint: config.hints?.[propertyType] || config.hints?.default || config.hint,
  };
};

const normalizeWeightsToTotal = (rawWeights) => {
  const keys = CRITERIA.map((criterion) => criterion.key);
  const rounded = {};
  let assigned = 0;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      rounded[key] = Math.max(0, 100 - assigned);
      return;
    }
    rounded[key] = Math.max(0, Math.round(rawWeights[key] || 0));
    assigned += rounded[key];
  });

  return rounded;
};

const calculateAhpResult = (comparisons) => {
  const keys = CRITERIA.map((criterion) => criterion.key);
  const size = keys.length;
  const matrix = Array.from({ length: size }, () => Array(size).fill(1));

  AHP_PAIRS.forEach((pair) => {
    const row = keys.indexOf(pair.a);
    const column = keys.indexOf(pair.b);
    const value = Number(comparisons[`${pair.a}:${pair.b}`]) || 1;
    matrix[row][column] = value;
    matrix[column][row] = 1 / value;
  });

  const columnTotals = keys.map((_, column) =>
    matrix.reduce((sum, row) => sum + row[column], 0),
  );
  const priorityVector = matrix.map((row) =>
    row.reduce((sum, value, column) => sum + value / columnTotals[column], 0) / size,
  );
  const lambdaMax =
    matrix
      .map((row, rowIndex) => {
        const weightedSum = row.reduce(
          (sum, value, column) => sum + value * priorityVector[column],
          0,
        );
        return weightedSum / priorityVector[rowIndex];
      })
      .reduce((sum, value) => sum + value, 0) / size;
  const consistencyIndex = (lambdaMax - size) / (size - 1);
  const consistencyRatio = consistencyIndex / RANDOM_INDEX_BY_SIZE[size];
  const weights = normalizeWeightsToTotal(
    Object.fromEntries(
      keys.map((key, index) => [key, priorityVector[index] * 100]),
    ),
  );

  return {
    weights,
    consistencyRatio,
  };
};


export default function RekomendasiProperti() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [showAhp, setShowAhp] = useState(true);
  const [hasAppliedAhp, setHasAppliedAhp] = useState(false);
  const [ahpComparisons, setAhpComparisons] = useState(DEFAULT_AHP_COMPARISONS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: PAGE_SIZE,
    from: 0,
    to: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const updateLayout = () => setIsMobileLayout(window.innerWidth < 768);
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const timeout = setTimeout(async () => {
      if (!hasAppliedAhp) {
        setProperties([]);
        setPagination({
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: PAGE_SIZE,
          from: 0,
          to: 0,
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get("/properties/recommendations", {
          params: {
            page,
            per_page: PAGE_SIZE,
            type: filters.type,
            listing_type: filters.listing_type,
            price_weight: weights.price,
            location_weight: weights.location,
            area_weight: weights.area,
            facilities_weight: weights.facilities,
          },
        });

        if (!isMounted) return;

        const payload = response.data || {};
        const items = Array.isArray(payload.data) ? payload.data : [];

        setProperties(items);
        setPagination({
          current_page: payload.current_page || 1,
          last_page: payload.last_page || 1,
          total: payload.total || items.length || 0,
          per_page: payload.per_page || PAGE_SIZE,
          from: payload.from || 0,
          to: payload.to || items.length || 0,
        });
      } catch (fetchError) {
        if (!isMounted) return;
        setProperties([]);
        setPagination({
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: PAGE_SIZE,
          from: 0,
          to: 0,
        });
        setError(fetchError.response?.data?.message || "Data rekomendasi gagal dimuat dari server.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [weights, filters, hasAppliedAhp, page]);

  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const ahpResult = calculateAhpResult(ahpComparisons);
  const ahpIsConsistent = ahpResult.consistencyRatio <= 0.1;

  const applyAhpWeights = () => {
    if (!ahpIsConsistent) return;

    setWeights(ahpResult.weights);
    setHasAppliedAhp(true);
    setShowAhp(false);
    setPage(1);
  };

  const resetRecommendationWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    setAhpComparisons(DEFAULT_AHP_COMPARISONS);
    setHasAppliedAhp(false);
    setShowAhp(true);
    setProperties([]);
    setPage(1);
  };

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    resetRecommendationWeights();
  };

  const handlePageChange = (nextPage) => {
    const lastPage = pagination.last_page || 1;
    const normalizedPage = Math.min(Math.max(1, nextPage), lastPage);
    if (normalizedPage === pagination.current_page || loading) return;
    setPage(normalizedPage);
  };

  const pageItems = getPageItems(
    pagination.current_page || page,
    pagination.last_page || 1,
  );
  const startItem =
    pagination.total === 0
      ? 0
      : pagination.from ||
        ((pagination.current_page || page) - 1) * pagination.per_page + 1;
  const endItem =
    pagination.to || Math.min(startItem + properties.length - 1, pagination.total);

  return (
    <section className="flat-title style-2 recommendation-page" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="tf-container">
        <div
          className="recommendation-hero-card wow animate__fadeInUp animate__animated"
          data-wow-duration="1s"
          data-wow-delay="0s"
          style={{
            marginBottom: 28,
            padding: "72px 0 72px 69px",
            borderRadius: 24,
            background:
              "linear-gradient(90deg, #5f9cda 0%, #78afe3 58%, #9cc8ef 100%)",
            color: "#fff",
            boxShadow: "0 18px 42px rgba(31, 84, 139, 0.16)",
            overflow: "visible",
            position: "relative",
          }}
        >
          <div className="row align-items-center g-4">
            <div className="col-lg-8" style={{ position: "relative", zIndex: 2 }}>
              <div
                className="text-1 wow animate__fadeInUp animate__animated"
                data-wow-duration="1s"
                data-wow-delay="0.1s"
                style={{ letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.8 }}
              >
                Sistem Pintar Rekomendasi Properti
              </div>
              <h2
                className="wow animate__fadeInUp animate__animated"
                data-wow-duration="1s"
                data-wow-delay="0.18s"
                style={{ marginTop: 10, marginBottom: 12, fontSize: "clamp(28px, 4vw, 48px)", color: "#fff" }}
              >
                Atur preferensi untuk rekomendasi yang lebih tepat.
              </h2>
              <p
                className="wow animate__fadeInUp animate__animated"
                data-wow-duration="1s"
                data-wow-delay="0.26s"
                style={{ margin: 0, maxWidth: 760, color: "rgba(255,255,255,0.8)", fontSize: 16, lineHeight: 1.7 }}
              >
                Bandingkan kriteria Harga, Lokasi, Luas, dan Fasilitas. Sistem akan membuat skor kecocokan dan mengurutkan properti sesuai preferensi Anda.
              </p>
              <div
                className="recommendation-hero-note wow animate__fadeInUp animate__animated"
                data-wow-duration="1s"
                data-wow-delay="0.34s"
                style={{
                  marginTop: 18,
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  color: "rgba(255,255,255,0.86)",
                  lineHeight: 1.6,
                }}
              >
                Pilih tipe properti dan tipe penawaran terlebih dahulu agar rekomendasi lebih akurat,
                terstruktur, dan tidak mencampur karakteristik rumah, kos, ruko, villa, atau tanah.
                Secara default halaman ini menampilkan rekomendasi rumah dijual.
              </div>
            </div>
            <div className="col-lg-4">
              <div
                className="recommendation-hero-side"
                style={{
                  minHeight: 0,
                }}
              >
              <Image
                className="recommendation-hero-person wow animate__fadeInRight animate__animated"
                data-wow-duration="1.3s"
                data-wow-delay="0.15s"
                src="/images/diproperti/womenbannerhome.png"
                alt="Asisten rekomendasi properti"
                width={486}
                height={650}
                priority={false}
                style={{
                  position: "absolute",
                  right: 87,
                  bottom: 0,
                  width: 486,
                  height: "auto",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              />
              </div>
            </div>
          </div>
          <style jsx global>{`
            .recommendation-hero-card {
              transition:
                transform 0.35s ease,
                box-shadow 0.35s ease,
                filter 0.35s ease;
            }

            .recommendation-hero-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 24px 52px rgba(31, 84, 139, 0.22) !important;
            }

            .recommendation-hero-note {
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              transition:
                background 0.3s ease,
                border-color 0.3s ease,
                transform 0.3s ease;
            }

            .recommendation-hero-card:hover .recommendation-hero-note {
              background: rgba(255, 255, 255, 0.14) !important;
              border-color: rgba(255, 255, 255, 0.24) !important;
              transform: translateY(-2px);
            }

            .recommendation-hero-person {
              filter: drop-shadow(0 22px 30px rgba(31, 84, 139, 0.18));
              transition: transform 0.35s ease;
            }

            .recommendation-hero-card:hover .recommendation-hero-person {
              transform: translateY(-5px);
            }

            @media (min-width: 992px) {
              .recommendation-hero-side {
                min-height: 0 !important;
              }
            }

            @media (max-width: 991px) {
              .recommendation-hero-card {
                padding: 70px 15px !important;
              }

              .recommendation-hero-side {
                min-height: 0 !important;
              }

              .recommendation-hero-person {
                display: none !important;
              }
            }

            @media (max-width: 575px) {
              .recommendation-hero-person {
                display: none !important;
              }

              .recommendation-hero-side {
                min-height: auto !important;
              }
            }
          `}</style>
        </div>

        <div className="row" style={{ marginTop: isMobileLayout ? 24 : undefined }}>
          <div className="col-12">
            <div className="box-title" style={{ marginBottom: isMobileLayout ? 16 : undefined }}>
              <div>
                <h2>Rekomendasi Properti Terbaik</h2>
                <p className="text-1" style={{ margin: "8px 0 0" }}>
                  Hasil diurutkan dari yang paling sesuai dengan bobot dan preferensi Anda.
                </p>
              </div>
              <div className="right wrap-sort">
                <DropdownSelect
                  addtionalParentClass="select-filter list-sort"
                  options={PROPERTY_TYPE_OPTIONS}
                  selectedValue={filters.type}
                  onChange={(value) =>
                    handleFilterChange({
                      ...filters,
                      type: value,
                      listing_type: value === "kos" ? "sewa" : filters.listing_type,
                    })
                  }
                />
                <DropdownSelect
                  addtionalParentClass="select-filter list-sort"
                  options={filters.type === "kos" ? ["Disewa"] : LISTING_TYPE_OPTIONS}
                  selectedValue={
                    filters.listing_type === "jual"
                      ? "Dijual"
                      : "Disewa"
                  }
                  onChange={(value) =>
                    handleFilterChange({
                      ...filters,
                      listing_type: value === "Dijual" ? "jual" : "sewa",
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4" style={{ marginTop: isMobileLayout ? 0 : undefined }}>
          <div className="col-lg-8" style={{ order: isMobileLayout ? 2 : 1 }}>
            <div className="text-1" style={{ marginBottom: 16, fontWeight: 600, textAlign: "right" }}>
              {pagination.total} properti tersedia
            </div>

            {!hasAppliedAhp ? (
              <div className="w-100 py-5 text-center text-1">
                Atur dan terapkan preferensi terlebih dahulu untuk melihat rekomendasi properti.
              </div>
            ) : loading ? (
              <div className="w-100 py-5 text-center text-1">Memuat rekomendasi properti...</div>
            ) : error ? (
              <div className="w-100 py-5 text-center text-1">{error}</div>
            ) : properties.length > 0 ? (
              isMobileLayout ? (
                <div className="tf-grid-layout md-col-2">
                  <PropertyGridItems properties={properties} showTopRankBadges />
                </div>
              ) : (
                <PropertyListItems properties={properties} showTopRankBadges />
              )
            ) : (
              <div className="w-100 py-5 text-center text-1">Tidak ada properti rekomendasi yang cocok.</div>
            )}

            {hasAppliedAhp && pagination.total > 0 && (
              <div className="wrap-pagination">
                <p className="text-1">
                  Menampilkan {startItem}-{endItem} of {pagination.total} hasil.
                </p>
                <ul className="wg-pagination">
                  <li className={`arrow ${pagination.current_page <= 1 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      onClick={() => handlePageChange((pagination.current_page || page) - 1)}
                      disabled={pagination.current_page <= 1 || loading}
                    >
                      <i className="icon-arrow-left" />
                    </button>
                  </li>
                  {pageItems.map((item, index) =>
                    item === "..." ? (
                      <li key={`ellipsis-${index}`}>
                        <span>...</span>
                      </li>
                    ) : (
                      <li key={item} className={item === pagination.current_page ? "active" : ""}>
                        <button
                          type="button"
                          onClick={() => handlePageChange(item)}
                          disabled={item === pagination.current_page || loading}
                        >
                          {item}
                        </button>
                      </li>
                    ),
                  )}
                  <li className={`arrow ${pagination.current_page >= pagination.last_page ? "disabled" : ""}`}>
                    <button
                      type="button"
                      onClick={() => handlePageChange((pagination.current_page || page) + 1)}
                      disabled={pagination.current_page >= pagination.last_page || loading}
                    >
                      <i className="icon-arrow-right" />
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="col-lg-4" style={{ order: isMobileLayout ? 1 : 2, marginTop: isMobileLayout ? 0 : undefined }}>
            <div className="tf-sidebar sticky-sidebar" style={{ marginTop: isMobileLayout ? 0 : undefined }}>
              <form
                className="form-advanced-search mb-0"
                onSubmit={(event) => event.preventDefault()}
              >
                <div className="d-flex align-items-center justify-content-between mb-24">
                  <div>
                    <h4 className="heading-title mb-0">Rekomendasi Pintar</h4>
                    <p className="text-1" style={{ margin: 0 }}>
                      Sistem menilai properti berdasarkan preferensi yang paling Anda butuhkan.
                    </p>
                  </div>
                  <span
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(37, 99, 235, 0.08)",
                      color: "#1d4ed8",
                      fontWeight: 600,
                    }}
                  >
                    {totalWeight}%
                  </span>
                </div>

                <div
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid var(--Line, #e5e7eb)",
                    background: "#f8fafc",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Preferensi Pintar</div>
                      <div className="text-1" style={{ fontSize: 13, lineHeight: 1.5 }}>
                        Atur perbandingan kriteria terlebih dahulu. Skor otomatis akan dipakai untuk menghitung rekomendasi.
                      </div>
                    </div>
                    {!hasAppliedAhp && (
                      <button
                        type="button"
                        className="tf-btn style-border w-full"
                        onClick={() => setShowAhp((current) => !current)}
                        style={{ minHeight: 46, whiteSpace: "normal", lineHeight: 1.35 }}
                      >
                        {showAhp ? "Tutup" : "Atur Preferensi"}
                      </button>
                    )}
                  </div>

                  {showAhp && (
                    <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
                      {AHP_PAIRS.map((pair) => {
                        const pairKey = `${pair.a}:${pair.b}`;
                        const first = getCriterionDisplay(pair.a, filters.type);
                        const second = getCriterionDisplay(pair.b, filters.type);
                        const rawValue = Number(ahpComparisons[pairKey]) || 1;
                        const activeSide =
                          rawValue > 1 ? pair.a : rawValue < 1 ? pair.b : null;
                        const intensity = rawValue < 1 ? Math.round(1 / rawValue) : Math.round(rawValue);
                        const importanceLabel =
                          intensity === 1
                            ? "Sama penting"
                            : `${intensity}x lebih penting`;

                        return (
                          <div key={pairKey}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                  fontSize: 13,
                                  fontWeight: activeSide === pair.a ? 700 : 500,
                                  color:
                                    activeSide === pair.a
                                      ? "var(--Primary)"
                                      : undefined,
                                }}
                              >
                                {first.label}
                                {activeSide === pair.a && intensity !== 1 && (
                                  <span
                                    className="text-1"
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 500,
                                      color: "var(--Text)",
                                    }}
                                  >
                                    {importanceLabel}
                                  </span>
                                )}
                              </span>
                              {intensity === 1 && (
                                <span className="text-1" style={{ fontSize: 12 }}>
                                  {importanceLabel}
                                </span>
                              )}
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                  justifyContent: "flex-end",
                                  fontSize: 13,
                                  fontWeight: activeSide === pair.b ? 700 : 500,
                                  textAlign: "right",
                                  color:
                                    activeSide === pair.b
                                      ? "var(--Primary)"
                                      : undefined,
                                }}
                              >
                                {activeSide === pair.b && intensity !== 1 && (
                                  <span
                                    className="text-1"
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 500,
                                      color: "var(--Text)",
                                    }}
                                  >
                                    {importanceLabel}
                                  </span>
                                )}
                                {second.label}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-8"
                              max="8"
                              step="1"
                              value={rawValue < 1 ? -Math.round(1 / rawValue) + 1 : Math.round(rawValue) - 1}
                              onChange={(event) => {
                                const sliderValue = Number(event.target.value);
                                const nextValue =
                                  sliderValue === 0
                                    ? 1
                                    : sliderValue > 0
                                      ? sliderValue + 1
                                      : 1 / (Math.abs(sliderValue) + 1);
                                setAhpComparisons((current) => ({
                                  ...current,
                                  [pairKey]: nextValue,
                                }));
                              }}
                              style={{ width: "100%", accentColor: "var(--Primary)" }}
                            />
                          </div>
                        );
                      })}

                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                          padding: 12,
                          borderRadius: 12,
                          background: "#fff",
                          border: "1px solid var(--Line, #e5e7eb)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span className="text-1">Rasio konsistensi</span>
                          <strong style={{ color: ahpIsConsistent ? "var(--Primary)" : "#b42318" }}>
                            {(ahpResult.consistencyRatio * 100).toFixed(1)}%
                          </strong>
                        </div>
                        <div className="text-1" style={{ fontSize: 13, lineHeight: 1.5 }}>
                          {ahpIsConsistent
                            ? "Preferensi sudah konsisten."
                            : "Preferensi belum konsisten. Idealnya di bawah 10%."}
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        <button
                          type="button"
                          className="tf-btn style-border w-full"
                          onClick={applyAhpWeights}
                          disabled={!ahpIsConsistent}
                          style={{ minHeight: 46, whiteSpace: "normal", lineHeight: 1.35 }}
                        >
                          Terapkan Preferensi
                        </button>
                        <button
                          type="button"
                          className="tf-btn style-border w-full"
                          onClick={() => setAhpComparisons(DEFAULT_AHP_COMPARISONS)}
                          style={{ minHeight: 46, whiteSpace: "normal", lineHeight: 1.35 }}
                        >
                          Reset Preferensi
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!hasAppliedAhp ? (
                  <div
                    className="text-1"
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      background: "rgba(2, 70, 155, 0.06)",
                      color: "var(--Primary)",
                      lineHeight: 1.5,
                    }}
                  >
                    Skor kecocokan akan muncul setelah preferensi diterapkan.
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: 700 }}>Skor Kecocokan</div>
                      <div className="text-1" style={{ fontSize: 13, lineHeight: 1.5 }}>
                        Skor ini dibuat otomatis dari preferensi Anda. Untuk mengubahnya, reset lalu atur preferensi kembali.
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 18 }}>
                      {CRITERIA.map((criterion) => {
                        const display = getCriterionDisplay(criterion.key, filters.type);
                        const weightValue = Number(weights[criterion.key]) || 0;

                        return (
                          <div key={criterion.key}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
                              <div>
                                <div style={{ fontWeight: 600 }}>{display.label}</div>
                                <div className="text-1" style={{ fontSize: 13, lineHeight: 1.5 }}>
                                  {display.hint}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                  minWidth: 82,
                                  justifyContent: "flex-end",
                                }}
                              >
                                <strong style={{ textAlign: "right" }}>{weightValue}%</strong>
                              </div>
                            </div>
                            <div
                              aria-label={`Bobot ${display.label} ${weightValue}%`}
                              style={{
                                width: "100%",
                                height: 10,
                                borderRadius: 999,
                                background: "#e5e7eb",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${weightValue}%`,
                                  height: "100%",
                                  borderRadius: 999,
                                  background: "var(--Primary)",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
                      <button
                        type="button"
                        className="tf-btn style-border w-full"
                        onClick={resetRecommendationWeights}
                        style={{ minHeight: 46, whiteSpace: "normal", lineHeight: 1.35 }}
                      >
                        Atur Ulang Preferensi
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
