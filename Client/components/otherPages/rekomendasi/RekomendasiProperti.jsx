"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import DropdownSelect from "@/components/common/DropdownSelect";
import PropertyListItems from "@/components/properties/PropertyListItems";

const PROPERTY_TYPE_OPTIONS = ["Semua Tipe", "rumah", "villa", "ruko", "kos", "tanah"];
const LISTING_TYPE_OPTIONS = ["Jual/Sewa", "Dijual", "Disewa"];
const DEFAULT_FILTERS = {
  type: "rumah",
  listing_type: "jual",
};

const DEFAULT_WEIGHTS = {
  price: 35,
  location: 30,
  area: 20,
  facilities: 15,
};

const RESET_WEIGHTS = {
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

const clampWeight = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const EMPTY_LOCKED_WEIGHTS = {};

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

const rebalanceWeights = (currentWeights, changedKey, nextValue, lockedWeights = EMPTY_LOCKED_WEIGHTS) => {
  if (lockedWeights[changedKey]) return currentWeights;

  const lockedKeys = CRITERIA.map((criterion) => criterion.key).filter((key) => lockedWeights[key]);
  const lockedTotal = lockedKeys.reduce((sum, key) => sum + (Number(currentWeights[key]) || 0), 0);
  const maxChangedValue = Math.max(0, 100 - lockedTotal);
  const clampedValue = Math.min(clampWeight(nextValue), maxChangedValue);
  const otherKeys = CRITERIA.map((criterion) => criterion.key).filter(
    (key) => key !== changedKey && !lockedWeights[key],
  );
  const nextWeights = { ...currentWeights, [changedKey]: clampedValue };
  const remaining = 100 - lockedTotal - clampedValue;
  const otherTotal = otherKeys.reduce((sum, key) => sum + (Number(currentWeights[key]) || 0), 0);

  if (otherKeys.length === 0) {
    nextWeights[changedKey] = Math.max(0, 100 - lockedTotal);
    return nextWeights;
  }

  let assigned = 0;
  otherKeys.forEach((key, index) => {
    if (index === otherKeys.length - 1) {
      nextWeights[key] = Math.max(0, remaining - assigned);
      return;
    }

    const base = otherTotal > 0
      ? Math.round(((Number(currentWeights[key]) || 0) / otherTotal) * remaining)
      : Math.floor(remaining / otherKeys.length);
    const value = Math.max(0, base);
    nextWeights[key] = value;
    assigned += value;
  });

  const total = Object.values(nextWeights).reduce((sum, value) => sum + value, 0);
  if (total !== 100) {
    const firstKey = otherKeys[0] || changedKey;
    nextWeights[firstKey] = Math.max(0, nextWeights[firstKey] + (100 - total));
  }

  return nextWeights;
};

function LockIcon({ locked }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d={locked ? "M8 10V7a4 4 0 0 1 8 0v3" : "M8 10V7a4 4 0 0 1 7.5-2"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}


export default function RekomendasiProperti() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [lockedWeights, setLockedWeights] = useState(EMPTY_LOCKED_WEIGHTS);
  const [showAhp, setShowAhp] = useState(true);
  const [hasAppliedAhp, setHasAppliedAhp] = useState(false);
  const [ahpComparisons, setAhpComparisons] = useState(DEFAULT_AHP_COMPARISONS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 8,
    from: 0,
    to: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const timeout = setTimeout(async () => {
      if (!hasAppliedAhp) {
        setProperties([]);
        setPagination({
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: 8,
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
            per_page: 8,
            ...(filters.type ? { type: filters.type } : {}),
            ...(filters.listing_type ? { listing_type: filters.listing_type } : {}),
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
          per_page: payload.per_page || 8,
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
          per_page: 8,
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
  }, [weights, filters, hasAppliedAhp]);

  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const topProperty = properties[0];
  const ahpResult = calculateAhpResult(ahpComparisons);
  const ahpIsConsistent = ahpResult.consistencyRatio <= 0.1;

  const applyAhpWeights = () => {
    setWeights(ahpResult.weights);
    setLockedWeights(EMPTY_LOCKED_WEIGHTS);
    setHasAppliedAhp(true);
    setShowAhp(false);
  };

  return (
    <section className="flat-title style-2" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="tf-container">
        <div
          style={{
            marginBottom: 28,
            padding: 28,
            borderRadius: 24,
            background:
              "linear-gradient(135deg, rgba(16, 24, 40, 0.96), rgba(35, 55, 92, 0.92))",
            color: "#fff",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
          }}
        >
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <div className="text-1" style={{ letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.8 }}>
                Sistem Rekomendasi Properti
              </div>
              <h2 style={{ marginTop: 10, marginBottom: 12, fontSize: "clamp(28px, 4vw, 48px)", color: "#fff" }}>
                Atur bobot sesuai prioritas pembelian Anda.
              </h2>
              <p style={{ margin: 0, maxWidth: 760, color: "rgba(255,255,255,0.8)", fontSize: 16, lineHeight: 1.7 }}>
                Geser bobot Harga, Lokasi, Luas, dan Fasilitas. Total selalu diseimbangkan otomatis menjadi 100%, lalu daftar properti di bawah akan berubah mengikuti preferensi Anda.
              </p>
              <div
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
                style={{
                  padding: 20,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div style={{ color: "rgba(255,255,255,0.72)", marginBottom: 6 }}>Total bobot</div>
                <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{totalWeight}%</div>
                <div style={{ marginTop: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.6 }}>
                  {topProperty ? (
                    <>
                      Rekomendasi teratas saat ini: <strong style={{ color: "#fff" }}>{topProperty.title}</strong>
                    </>
                  ) : (
                    "Belum ada properti untuk direkomendasikan."
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="box-title">
              <div>
                <h2>Rekomendasi Properti Terbaik</h2>
                <p className="text-1" style={{ margin: "8px 0 0" }}>
                  Hasil diurutkan dari yang paling sesuai dengan bobot dan filter Anda.
                </p>
              </div>
              <div className="right wrap-sort">
                <DropdownSelect
                  addtionalParentClass="select-filter list-sort"
                  options={PROPERTY_TYPE_OPTIONS}
                  selectedValue={filters.type || "Semua Tipe"}
                  onChange={(value) =>
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      type: value === "Semua Tipe" ? "" : value,
                    }))
                  }
                />
                <DropdownSelect
                  addtionalParentClass="select-filter list-sort"
                  options={LISTING_TYPE_OPTIONS}
                  selectedValue={
                    filters.listing_type === "jual"
                      ? "Dijual"
                      : filters.listing_type === "sewa"
                        ? "Disewa"
                        : "Jual/Sewa"
                  }
                  onChange={(value) =>
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      listing_type:
                        value === "Dijual"
                          ? "jual"
                          : value === "Disewa"
                            ? "sewa"
                            : "",
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="text-1" style={{ marginBottom: 16, fontWeight: 600, textAlign: "right" }}>
              {pagination.total} properti tersedia
            </div>

            {!hasAppliedAhp ? (
              <div className="w-100 py-5 text-center text-1">
                Isi dan terapkan AHP terlebih dahulu untuk melihat rekomendasi properti.
              </div>
            ) : loading ? (
              <div className="w-100 py-5 text-center text-1">Memuat rekomendasi properti...</div>
            ) : error ? (
              <div className="w-100 py-5 text-center text-1">{error}</div>
            ) : properties.length > 0 ? (
              <PropertyListItems properties={properties} showTopRankBadges />
            ) : (
              <div className="w-100 py-5 text-center text-1">Tidak ada properti rekomendasi yang cocok.</div>
            )}
          </div>

          <div className="col-lg-4">
            <div className="tf-sidebar sticky-sidebar">
              <form
                className="form-advanced-search mb-0"
                onSubmit={(event) => event.preventDefault()}
              >
                <div className="d-flex align-items-center justify-content-between mb-24">
                  <div>
                    <h4 className="heading-title mb-0">Bobot preferensi</h4>
                    <p className="text-1" style={{ margin: 0 }}>
                      Total akan selalu kembali ke 100%.
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
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>AHP + SAW</div>
                      <div className="text-1" style={{ fontSize: 13, lineHeight: 1.5 }}>
                        Wajib isi AHP dulu. Setelah diterapkan, slider SAW akan aktif untuk penyesuaian.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="tf-btn style-border"
                      onClick={() => setShowAhp((current) => !current)}
                      style={{ height: 38, padding: "0 14px", whiteSpace: "nowrap" }}
                    >
                      {showAhp ? "Tutup" : hasAppliedAhp ? "Ubah AHP" : "Isi AHP"}
                    </button>
                  </div>

                  {showAhp && (
                    <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
                      {AHP_PAIRS.map((pair) => {
                        const pairKey = `${pair.a}:${pair.b}`;
                        const first = getCriterionDisplay(pair.a, filters.type);
                        const second = getCriterionDisplay(pair.b, filters.type);
                        const rawValue = Number(ahpComparisons[pairKey]) || 1;
                        const activeSide = rawValue < 1 ? pair.b : pair.a;
                        const intensity = rawValue < 1 ? Math.round(1 / rawValue) : Math.round(rawValue);

                        return (
                          <div key={pairKey}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: activeSide === pair.a ? 700 : 500 }}>
                                {first.label}
                              </span>
                              <span className="text-1" style={{ fontSize: 12 }}>
                                {intensity === 1 ? "Sama penting" : `${intensity}x lebih penting`}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: activeSide === pair.b ? 700 : 500, textAlign: "right" }}>
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

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <button
                          type="button"
                          className="tf-btn style-border w-full"
                          onClick={applyAhpWeights}
                        >
                          Terapkan AHP
                        </button>
                        <button
                          type="button"
                          className="tf-btn style-border w-full"
                          onClick={() => setAhpComparisons(DEFAULT_AHP_COMPARISONS)}
                        >
                          Reset AHP
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
                    Tahap SAW akan muncul setelah bobot AHP diterapkan.
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: 700 }}>SAW - Penyesuaian Bobot</div>
                      <div className="text-1" style={{ fontSize: 13, lineHeight: 1.5 }}>
                        Bobot dari AHP sudah diterapkan. Anda masih bisa menggeser slider untuk fine-tuning.
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 18 }}>
                      {CRITERIA.map((criterion) => {
                        const display = getCriterionDisplay(criterion.key, filters.type);

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
                                <strong style={{ textAlign: "right" }}>{weights[criterion.key]}%</strong>
                                <button
                                  type="button"
                                  aria-label={
                                    lockedWeights[criterion.key]
                                      ? `Buka kunci bobot ${display.label}`
                                      : `Kunci bobot ${display.label}`
                                  }
                                  title={
                                    lockedWeights[criterion.key]
                                      ? "Buka kunci bobot"
                                      : "Kunci bobot"
                                  }
                                  onClick={() =>
                                    setLockedWeights((currentLocks) => ({
                                      ...currentLocks,
                                      [criterion.key]: !currentLocks[criterion.key],
                                    }))
                                  }
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 999,
                                    border: lockedWeights[criterion.key]
                                      ? "1px solid var(--Primary)"
                                      : "1px solid var(--Line, #e5e7eb)",
                                    background: lockedWeights[criterion.key]
                                      ? "rgba(2, 70, 155, 0.08)"
                                      : "#fff",
                                    color: lockedWeights[criterion.key]
                                      ? "var(--Primary)"
                                      : "#98a2b3",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 0,
                                    cursor: "pointer",
                                  }}
                                >
                                  <LockIcon locked={Boolean(lockedWeights[criterion.key])} />
                                </button>
                              </div>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={weights[criterion.key]}
                              disabled={Boolean(lockedWeights[criterion.key])}
                              onChange={(event) =>
                                setWeights((currentWeights) =>
                                  rebalanceWeights(
                                    currentWeights,
                                    criterion.key,
                                    event.target.value,
                                    lockedWeights,
                                  ),
                                )
                              }
                              style={{
                                width: "100%",
                                accentColor: "var(--Primary)",
                                opacity: lockedWeights[criterion.key] ? 0.58 : 1,
                                cursor: lockedWeights[criterion.key] ? "not-allowed" : "pointer",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "grid", gap: 20, marginTop: 24 }}>
                      <button
                        type="button"
                        className="tf-btn style-border w-full"
                        onClick={() => {
                          setWeights(DEFAULT_WEIGHTS);
                          setLockedWeights(EMPTY_LOCKED_WEIGHTS);
                          setHasAppliedAhp(false);
                          setShowAhp(true);
                        }}
                      >
                        Gunakan default
                      </button>
                      <button
                        type="button"
                        className="tf-btn style-border w-full"
                        onClick={() => {
                          setWeights(RESET_WEIGHTS);
                          setLockedWeights(EMPTY_LOCKED_WEIGHTS);
                          setAhpComparisons(DEFAULT_AHP_COMPARISONS);
                          setHasAppliedAhp(false);
                          setShowAhp(true);
                        }}
                      >
                        Reset
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
