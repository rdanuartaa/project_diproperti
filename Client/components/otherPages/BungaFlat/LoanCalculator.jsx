"use client";
import Image from "next/image";
import React, { useState } from "react";
import DropdownSelect from "@/components/common/DropdownSelect";
import image from "next/image";

const formatRupiah = (value) => {
  if (!value && value !== 0) return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const parseNumber = (str) => {
  const cleaned = String(str).replace(/[^\d]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

const formatInput = (value) => {
  if (!value) return "";
  return Number(value).toLocaleString("id-ID");
};

const TENOR_OPTIONS = [
  { label: "Pilih tenor", value: "" },
  { label: "12 bulan (1 tahun)", value: 12 },
  { label: "24 bulan (2 tahun)", value: 24 },
  { label: "36 bulan (3 tahun)", value: 36 },
  { label: "48 bulan (4 tahun)", value: 48 },
  { label: "60 bulan (5 tahun)", value: 60 },
  { label: "84 bulan (7 tahun)", value: 84 },
  { label: "120 bulan (10 tahun)", value: 120 },
  { label: "180 bulan (15 tahun)", value: 180 },
  { label: "240 bulan (20 tahun)", value: 240 },
];

const EMPTY_FORM = {
  hargaProperti: "",
  uangMuka: "",
  bungaFlat: "",
  tenor: "",
  tenorLabel: "Pilih tenor",
};

export default function LoanCalculator() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  // ✅ Error hanya muncul setelah submit — tidak ganggu user saat mengisi
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // ✅ Persen uang muka — hitung realtime tapi tidak blokir input
  const persenUM = (() => {
    const harga = parseNumber(form.hargaProperti);
    const um = parseNumber(form.uangMuka);
    if (harga > 0 && um > 0) return Math.round((um / harga) * 100);
    return 0;
  })();

  // ✅ Handler input numerik — bebas diisi kapan saja tanpa error
  const handleNumericChange = (field, rawValue) => {
    const num = parseNumber(rawValue);
    setForm((prev) => ({
      ...prev,
      [field]: num ? formatInput(num) : "",
    }));
    // Hapus error field ini jika sudah diisi
    if (submitted) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // ✅ Handler input biasa
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (submitted) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // ✅ Handler dropdown tenor
  const handleTenorChange = (selectedLabel) => {
    const selected = TENOR_OPTIONS.find((opt) => opt.label === selectedLabel);
    setForm((prev) => ({
      ...prev,
      tenor: selected?.value || "",
      tenorLabel: selectedLabel,
    }));
    if (submitted) {
      setErrors((prev) => ({ ...prev, tenor: "" }));
    }
  };

  // ✅ Validasi hanya saat submit
  const validate = () => {
    const newErrors = {};
    const harga = parseNumber(form.hargaProperti);
    const um = parseNumber(form.uangMuka);

    if (!form.hargaProperti || harga === 0)
      newErrors.hargaProperti = "Harga properti wajib diisi";

    if (!form.uangMuka || um === 0)
      newErrors.uangMuka = "Uang muka wajib diisi";
    else if (harga > 0 && um >= harga)
      newErrors.uangMuka =
        "Uang muka tidak boleh lebih besar dari harga properti";

    if (!form.bungaFlat || Number(form.bungaFlat) <= 0)
      newErrors.bungaFlat = "Bunga flat wajib diisi (> 0)";

    if (!form.tenor) newErrors.tenor = "Pilih tenor terlebih dahulu";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Submit — hitung bunga flat
  const handleCalculate = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) return;

    const harga = parseNumber(form.hargaProperti);
    const um = parseNumber(form.uangMuka);
    const bunga = Number(form.bungaFlat);
    const tenor = Number(form.tenor);

    const pokokPinjaman = harga - um;
    const bungaPerBulan = (pokokPinjaman * (bunga / 100)) / 12;
    const pokokPerBulan = pokokPinjaman / tenor;
    const angsuranPerBulan = pokokPerBulan + bungaPerBulan;
    const totalBayar = angsuranPerBulan * tenor;
    const totalBunga = totalBayar - pokokPinjaman;
    const persenUangMuka = Math.round((um / harga) * 100);

    setResult({
      pokokPinjaman,
      bungaPerBulan,
      angsuranPerBulan,
      totalBayar,
      totalBunga,
      persenUangMuka,
    });
  };

  // ✅ Reset — bersihkan semua termasuk error dan hasil
  const handleReset = () => {
    setForm(EMPTY_FORM);
    setResult(null);
    setErrors({});
    setSubmitted(false);
  };

  return (
    <section id="calculator" className="section-calculate">
      <div className="tf-container tf-spacing-1">
        <div className="row">
          <div className="col-12">
            <div
              className="box-calculate"
              style={{ overflow: "visible", position: "relative" }}
            >
              <div
                className="image-wrap"
                style={{
                  height: "666px", // ubah sesuai kebutuhan
                  marginTop: "-70px",
                  borderRadius: "24px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <Image
                  src="/images/diproperti/bungaflatbanner2.jpg"
                  alt="Kalkulator KPR"
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
              <form
                className="form-pre-approved"
                onSubmit={handleCalculate}
                style={{
                  overflow: "visible",
                  position: "relative",
                  position: "relative",
                  marginTop: "-25px",
                  zIndex: 2,
                }}
              >
                {/* HEADING */}
                <div className="heading-section mb-48">
                  <h2
                    className="title wow animate__fadeInUp animate__animated mt-48"
                    data-wow-duration="1s"
                    data-wow-delay="0s"
                  >
                    Kalkulator KPR Bunga Flat
                  </h2>
                  <p
                    className="text-1 wow animate__fadeInUp animate__animated"
                    data-wow-duration="1s"
                    data-wow-delay="0s"
                  >
                    Simulasikan cicilan KPR Anda dengan metode bunga flat. Isi
                    semua kolom lalu klik Hitung Sekarang.
                  </p>
                </div>

                {/* BARIS 1: Harga Properti + Uang Muka */}
                <div className="cols">
                  <fieldset>
                    <label className="text-1 fw-6 mb-12" htmlFor="harga">
                      Harga Properti (Rp)
                    </label>
                    <input
                      type="text"
                      id="harga"
                      placeholder="Cth: 500.000.000"
                      value={form.hargaProperti}
                      onChange={(e) =>
                        handleNumericChange("hargaProperti", e.target.value)
                      }
                      style={
                        submitted && errors.hargaProperti
                          ? { borderColor: "red" }
                          : {}
                      }
                    />
                    {submitted && errors.hargaProperti && (
                      <span
                        style={{
                          color: "red",
                          fontSize: "12px",
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        {errors.hargaProperti}
                      </span>
                    )}
                  </fieldset>

                  <div className="wrap-input">
                    <fieldset className="payment">
                      <label className="text-1 fw-6 mb-12" htmlFor="uangmuka">
                        Uang Muka (Rp)
                      </label>
                      <input
                        type="text"
                        id="uangmuka"
                        placeholder="Cth: 100.000.000"
                        value={form.uangMuka}
                        onChange={(e) =>
                          handleNumericChange("uangMuka", e.target.value)
                        }
                        style={
                          submitted && errors.uangMuka
                            ? { borderColor: "red" }
                            : {}
                        }
                      />
                      {submitted && errors.uangMuka && (
                        <span
                          style={{
                            color: "red",
                            fontSize: "12px",
                            marginTop: "4px",
                            display: "block",
                          }}
                        >
                          {errors.uangMuka}
                        </span>
                      )}
                    </fieldset>
                    {/* Persen uang muka otomatis */}
                    <fieldset className="percent">
                      <input
                        className="input-percent"
                        type="text"
                        value={persenUM > 0 ? `${persenUM}%` : "0%"}
                        readOnly
                      />
                    </fieldset>
                  </div>
                </div>
                {/* BARIS 2: Bunga Flat + Tenor */}
                <div className="cols">
                  <fieldset className="interest-rate">
                    <label className="text-1 fw-6 mb-12" htmlFor="bunga">
                      Bunga Flat (% per tahun)
                    </label>
                    <input
                      type="number"
                      id="bunga"
                      placeholder="Cth: 8"
                      min="0"
                      max="100"
                      step="0.1"
                      value={form.bungaFlat}
                      onChange={(e) =>
                        handleChange("bungaFlat", e.target.value)
                      }
                      style={
                        submitted && errors.bungaFlat
                          ? { borderColor: "red" }
                          : {}
                      }
                    />
                    {submitted && errors.bungaFlat && (
                      <span
                        style={{
                          color: "red",
                          fontSize: "12px",
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        {errors.bungaFlat}
                      </span>
                    )}
                  </fieldset>
                  <div
                    className="select"
                    style={{ position: "relative", zIndex: 999 }}
                  >
                    <label className="text-1 fw-6 mb-12">Tenor (bulan)</label>
                    <DropdownSelect
                      options={TENOR_OPTIONS.map((opt) => opt.label)}
                      selectedValue={form.tenorLabel}
                      onChange={handleTenorChange}
                      addtionalParentClass=""
                    />
                    {submitted && errors.tenor && (
                      <span
                        style={{
                          color: "red",
                          fontSize: "12px",
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        {errors.tenor}
                      </span>
                    )}
                  </div>
                </div>
                {result && (
                  <div
                    style={{
                      background: "#f0f4f8",
                      borderRadius: "20px",
                      padding: "24px",
                      marginBottom: "24px",
                      marginTop: "8px",
                      border: "1px solid #dde3ea",
                    }}
                  >
                    <h5
                      className="fw-7"
                      style={{ color: "#1a1a2e", marginBottom: "16px" }}
                    >
                      Hasil Simulasi
                    </h5>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      {[
                        {
                          label: "Pokok Pinjaman",
                          value: formatRupiah(result.pokokPinjaman),
                        },
                        {
                          label: "Uang Muka",
                          value: `${result.persenUangMuka}% dari harga`,
                        },
                        {
                          label: "Bunga per Bulan",
                          value: formatRupiah(result.bungaPerBulan),
                        },
                        {
                          label: "Angsuran per Bulan",
                          value: formatRupiah(result.angsuranPerBulan),
                          highlight: true,
                        },
                        {
                          label: "Total Bunga",
                          value: formatRupiah(result.totalBunga),
                        },
                        {
                          label: "Total Keseluruhan",
                          value: formatRupiah(result.totalBayar),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            background: item.highlight
                              ? "var(--Primary, #1a3c6e)"
                              : "#fff",
                            borderRadius: "16px",
                            padding: "8px 12px",
                            border: item.highlight
                              ? "none"
                              : "1px solid #dde3ea",
                          }}
                        >
                          <p
                            style={{
                              color: item.highlight
                                ? "rgba(255,255,255,0.75)"
                                : "#888",
                              fontSize: "14px",
                              margin: "0 0 2px",
                            }}
                          >
                            {item.label}
                          </p>
                          <p
                            style={{
                              color: item.highlight ? "#fff" : "#1a1a2e",
                              fontWeight: item.highlight ? 700 : 600,
                              fontSize: item.highlight ? "17px" : "15px",
                              margin: 0,
                            }}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p
                      className="text-1"
                      style={{
                        color: "#1a1a2e",
                        marginTop: "16px",
                        marginBottom: 0,
                        fontSize: "14px",
                      }}
                    >
                      Estimasi cicilan per bulan:{" "}
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "16px",
                          color: "var(--Primary, #1a3c6e)",
                        }}
                      >
                        {formatRupiah(result.angsuranPerBulan)}
                      </span>
                    </p>
                  </div>
                )}

                {/* TOMBOL */}
                <div className="wrap-btn">
                  <button
                    type="submit"
                    className="tf-btn bg-color-primary pd-6 fw-7"
                  >
                    Hitung Sekarang
                  </button>
                  <button
                    type="button"
                    className="tf-btn style-border pd-7"
                    onClick={handleReset}
                  >
                    Mulai Ulang
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
