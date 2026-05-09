"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

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

const CRITERIA = [
  { key: "price", label: "Harga", hint: "Lebih terjangkau = skor lebih tinggi" },
  { key: "location", label: "Lokasi", hint: "Lokasi yang lebih strategis mendapat skor lebih tinggi" },
  { key: "area", label: "Luas", hint: "Semakin luas, semakin tinggi skornya" },
  { key: "facilities", label: "Fasilitas", hint: "Berdasarkan fasilitas yang tersedia di data properti" },
];

const clampWeight = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const rebalanceWeights = (currentWeights, changedKey, nextValue) => {
  const clampedValue = clampWeight(nextValue);
  const otherKeys = CRITERIA.map((criterion) => criterion.key).filter((key) => key !== changedKey);
  const nextWeights = { ...currentWeights, [changedKey]: clampedValue };
  const remaining = 100 - clampedValue;
  const otherTotal = otherKeys.reduce((sum, key) => sum + (Number(currentWeights[key]) || 0), 0);

  if (otherKeys.length === 0) {
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


export default function RekomendasiProperti() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
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
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/properties/recommendations", {
          params: {
            per_page: 8,
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
  }, [weights]);

  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const topProperty = properties[0];

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  const formatArea = (property) => {
    const detailArea = property?.detail?.luas_bangunan ?? property?.detail?.luas_tanah ?? null;
    return detailArea || property?.sqft || "-";
  };

  const getPropertyImage = (property) => {
    const firstImage = Array.isArray(property?.images) ? property.images[0] : null;
    return firstImage?.full_url || firstImage?.image_url || "/images/section/box-house.jpg";
  };

  const getPropertyLocation = (property) => {
    const parts = [property?.kecamatan, property?.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : property?.location || "Lokasi tidak tersedia";
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
              <h2 style={{ marginTop: 10, marginBottom: 12, fontSize: "clamp(28px, 4vw, 48px)" }}>
                Atur bobot sesuai prioritas pembelian Anda.
              </h2>
              <p style={{ margin: 0, maxWidth: 760, color: "rgba(255,255,255,0.8)", fontSize: 16, lineHeight: 1.7 }}>
                Geser bobot Harga, Lokasi, Luas, dan Fasilitas. Total selalu diseimbangkan otomatis menjadi 100%, lalu daftar properti di bawah akan berubah mengikuti preferensi Anda.
              </p>
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

        <div className="row g-4">
          <div className="col-lg-5">
            <div
              style={{
                padding: 24,
                borderRadius: 24,
                background: "#fff",
                border: "1px solid rgba(15, 23, 42, 0.08)",
                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>Bobot preferensi</h3>
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

              <div style={{ display: "grid", gap: 18 }}>
                {CRITERIA.map((criterion) => (
                  <div key={criterion.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{criterion.label}</div>
                        <div className="text-1" style={{ fontSize: 13, lineHeight: 1.5 }}>
                          {criterion.hint}
                        </div>
                      </div>
                      <strong style={{ minWidth: 48, textAlign: "right" }}>{weights[criterion.key]}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={weights[criterion.key]}
                      onChange={(event) =>
                        setWeights((currentWeights) =>
                          rebalanceWeights(currentWeights, criterion.key, event.target.value),
                        )
                      }
                      style={{ width: "100%", accentColor: "var(--Primary)" }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  className="tf-btn style-border pd-23"
                  onClick={() => setWeights(DEFAULT_WEIGHTS)}
                >
                  Gunakan default
                </button>
                <button
                  type="button"
                  className="tf-btn style-border pd-23"
                  onClick={() => setWeights(RESET_WEIGHTS)}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div
              style={{
                padding: 24,
                borderRadius: 24,
                background: "#fff",
                border: "1px solid rgba(15, 23, 42, 0.08)",
                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>Properti rekomendasi</h3>
                  <p className="text-1" style={{ margin: 0 }}>
                    Hasil diurutkan dari yang paling sesuai dengan bobot Anda.
                  </p>
                </div>
                <div style={{ color: "#475569", fontWeight: 600 }}>
                  {pagination.total} properti tersedia
                </div>
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                {loading ? (
                  <div className="w-100 py-5 text-center text-1">Memuat rekomendasi properti...</div>
                ) : error ? (
                  <div className="w-100 py-5 text-center text-1">{error}</div>
                ) : properties.length > 0 ? (
                  properties.map((property, index) => (
                  <article
                    key={property.id ?? property.slug ?? `${property.title}-${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "320px minmax(0, 1fr)",
                      gap: 16,
                      padding: 16,
                      borderRadius: 20,
                      border: index === 0 ? "1px solid rgba(29, 78, 216, 0.24)" : "1px solid rgba(15, 23, 42, 0.08)",
                      background: index === 0 ? "linear-gradient(135deg, rgba(239, 246, 255, 1), rgba(255, 255, 255, 1))" : "#fff",
                    }}
                  >
                    <div style={{ position: "relative", width: "320px", height: "250px", borderRadius: 16, overflow: "hidden", background: "#e2e8f0" }}>
                      <img
                        src={getPropertyImage(property)}
                        alt={property.title || "Properti rekomendasi"}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                          <div>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 999,
                                  background: index === 0 ? "rgba(29, 78, 216, 0.12)" : "rgba(15, 23, 42, 0.06)",
                                  color: index === 0 ? "#1d4ed8" : "#475569",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                #{index + 1} rekomendasi
                              </span>
                              <span style={{ fontSize: 12, color: "#64748b" }}>
                                Skor {Math.round((property.recommendation_score || 0) * 100)}
                              </span>
                            </div>
                            <h4 style={{ marginBottom: 6, fontSize: 20 }}>{property.title}</h4>
                            <div className="text-1" style={{ marginBottom: 8 }}>
                              {getPropertyLocation(property)}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: 18 }}>{formatPrice(property.price)}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>Harga properti</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                          <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f8fafc", color: "#334155", fontSize: 12 }}>
                            Luas {formatArea(property)}
                          </span>
                          <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f8fafc", color: "#334155", fontSize: 12 }}>
                            Kamar {property?.detail?.bedrooms ?? property.beds ?? "-"}
                          </span>
                          <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f8fafc", color: "#334155", fontSize: 12 }}>
                            Kamar mandi {property?.detail?.bathrooms ?? property.baths ?? "-"}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <div className="text-1" style={{ fontSize: 13, lineHeight: 1.6 }}>
                          Bobot terpengaruh dari harga, lokasi, luas, dan fasilitas.
                        </div>
                        <Link
                          href={`/properti/${property.slug}`}
                          className="tf-btn style-border pd-23"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          Lihat detail
                        </Link>
                      </div>
                    </div>
                  </article>
                  ))
                ) : (
                  <div className="w-100 py-5 text-center text-1">Tidak ada properti rekomendasi yang cocok.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}