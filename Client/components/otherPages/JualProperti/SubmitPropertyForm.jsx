"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL, api } from "@/lib/api";
import SuccessModal from "@/components/common/SuccesModal";
import AttentionModal from "@/components/common/AttentionModal";

const EMPTY_FORM = {
  title: "",
  price: "",
  type: "rumah",
  building_type: "",
  listing_type: "jual",
  kecamatan: "",
  city: "Jember",
  certificate_type: "SHM",
  certificate_status: "lunas",
  description: "",
  detail: {
    luas_tanah: "",
    luas_bangunan: "",
    floors: 1,
    bedrooms: 0,
    bathrooms: 0,
    kitchens: 0,
    living_rooms: 0,
    carport: false,
    garden: false,
    electricity_capacity: "",
    water: "pdam",
    one_gate_system: false,
    security_24jam: false,
    listrik_type: "overground",
    wifi_provider: "",
  },
  newImages: [],
  certificateFile: null,
  electricBillFile: null,
  waterBillFile: null,
};

export default function SubmitPropertyForm() {
  const { isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryNewIndex, setPrimaryNewIndex] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [attention, setAttention] = useState({ open: false, message: "" });
  const redirectOnce = useRef(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && !redirectOnce.current) {
      redirectOnce.current = true;
      setAttention({
        open: true,
        message: "Anda harus login terlebih dahulu untuk menjual properti.",
      });

      const timer = setTimeout(() => {
        window.location.href = `${API_URL}/auth/google/redirect`;
      }, 300);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [loading, isAuthenticated]);

  const totalImages = useMemo(
    () => (formData.newImages?.length || 0),
    [formData.newImages]
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("detail.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        detail: { ...prev.detail, [key]: type === "checkbox" ? checked : value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePriceChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, price: digits }));
    if (errors.price) {
      setErrors((prev) => ({ ...prev, price: null }));
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (formData.newImages.length + files.length > 10) {
      setAttention({ open: true, message: "Maksimal 10 gambar diperbolehkan." });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...files],
    }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));

    if (primaryNewIndex === index) {
      setPrimaryNewIndex(null);
    } else if (primaryNewIndex !== null && index < primaryNewIndex) {
      setPrimaryNewIndex(primaryNewIndex - 1);
    }
  };

  const handleFileChange = (field) => (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const validateRequired = () => {
    const requiredMain = [
      "title",
      "price",
      "type",
      "listing_type",
      "city",
      "kecamatan",
      "certificate_type",
    ];

    for (const field of requiredMain) {
      if (!String(formData[field] ?? "").trim()) {
        return "Semua data wajib diisi dan tidak boleh kosong.";
      }
    }

    if (!String(formData.detail.luas_tanah ?? "").trim()) {
      return "Luas tanah wajib diisi.";
    }

    if (totalImages < 1) {
      return "Minimal upload 1 gambar.";
    }

    return null;
  };

  const buildPayload = () => {
    const payload = new FormData();

    payload.append("title", formData.title);
    payload.append("price", Number(formData.price));
    payload.append("type", formData.type);
    if (String(formData.building_type || "").trim()) {
      payload.append("building_type", formData.building_type);
    }
    payload.append("listing_type", formData.listing_type);
    payload.append("kecamatan", formData.kecamatan);
    payload.append("city", formData.city);
    payload.append("certificate_type", formData.certificate_type);
    payload.append("certificate_status", formData.certificate_status);
    payload.append("description", formData.description || "");

    Object.keys(formData.detail).forEach((key) => {
      payload.append(`detail[${key}]`, formData.detail[key]);
    });

    formData.newImages.forEach((file) => {
      payload.append("images[]", file);
    });

    if (primaryNewIndex !== null) {
      payload.append("primary_new_index", primaryNewIndex);
    } else if (formData.newImages.length > 0) {
      payload.append("primary_new_index", 0);
    }

    if (formData.certificateFile) {
      payload.append("certificate_file", formData.certificateFile);
    }
    if (formData.electricBillFile) {
      payload.append("electric_bill_file", formData.electricBillFile);
    }
    if (formData.waterBillFile) {
      payload.append("water_bill_file", formData.waterBillFile);
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const requiredError = validateRequired();
    if (requiredError) {
      setAttention({ open: true, message: requiredError });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = buildPayload();
      await api.post("/properties/submit", payload, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      setShowSuccess(true);
      setFormData(EMPTY_FORM);
      setPrimaryNewIndex(null);
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        setAttention({
          open: true,
          message: "Ada data yang belum lengkap atau tidak valid.",
        });
      } else {
        setAttention({
          open: true,
          message: "Gagal mengirim pengajuan. Silakan coba lagi.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tf-spacing-7 pt-0">
        <div className="tf-container">
          <p style={{ textAlign: "center", padding: "48px 0" }}>Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="tf-spacing-7 pt-0">
        <div className="tf-container">
          <AttentionModal
            isOpen={attention.open}
            onClose={() => setAttention({ open: false, message: "" })}
            title="Perhatian"
            message={attention.message}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="tf-spacing-7 pt-0">
      <div className="box">
        <div className="tf-container tf-spacing-1">
          <SuccessModal
            isOpen={showSuccess}
            onClose={() => setShowSuccess(false)}
            message="Pengajuan properti berhasil dikirim. Admin akan meninjau sebelum ditampilkan."
          />
          <AttentionModal
            isOpen={attention.open}
            onClose={() => setAttention({ open: false, message: "" })}
            title="Perhatian"
            message={attention.message}
          />

          <div className="row">
            <div className="col-12">
              <div style={{ marginBottom: "24px" }}>
                <h2 className="fw-7">Jual Properti</h2>
                <p style={{ color: "#6b7280" }}>
                  Lengkapi data properti, detail, dan gambar. Admin akan memverifikasi sebelum tampil di listing.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="form-contact">
              <div className="row">
                <div className="col-lg-6 mb-12">
                  <fieldset>
                    <label className="text-1 fw-6 mb-12" htmlFor="title">
                      Judul Properti
                    </label>
                    <input
                      id="title"
                      name="title"
                      className="form-control"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Contoh: Rumah Minimalis 2 Lantai"
                    />
                  </fieldset>
                </div>

                <div className="col-lg-6 mb-12">
                  <fieldset>
                    <label className="text-1 fw-6 mb-12" htmlFor="price">
                      Harga (Rp)
                    </label>
                    <input
                      id="price"
                      name="price"
                      className="form-control"
                      value={formData.price}
                      onChange={handlePriceChange}
                      placeholder="Masukkan harga"
                    />
                  </fieldset>
                </div>

                <div className="col-lg-6 mb-12">
                  <div className="select w-full">
                    <label className="text-1 fw-6 mb-12" htmlFor="type">
                      Tipe Properti
                    </label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange}>
                      <option value="rumah">Rumah</option>
                      <option value="perumahan">Perumahan</option>
                      <option value="ruko">Ruko</option>
                      <option value="kos">Kos</option>
                      <option value="tanah">Tanah</option>
                    </select>
                  </div>
                </div>

                <div className="col-lg-6 mb-12">
                  <div className="select w-full">
                    <label className="text-1 fw-6 mb-12" htmlFor="listing_type">
                      Status
                    </label>
                    <select
                      id="listing_type"
                      name="listing_type"
                      value={formData.listing_type}
                      onChange={handleChange}
                    >
                      <option value="jual">Dijual</option>
                      <option value="sewa">Disewa</option>
                    </select>
                  </div>
                </div>

                <div className="col-lg-6 mb-12">
                  <fieldset>
                    <label className="text-1 fw-6 mb-12" htmlFor="kecamatan">
                      Kecamatan
                    </label>
                    <input
                      id="kecamatan"
                      name="kecamatan"
                      className="form-control"
                      value={formData.kecamatan}
                      onChange={handleChange}
                      placeholder="Contoh: Sumbersari"
                    />
                  </fieldset>
                </div>

                <div className="col-lg-6 mb-12">
                  <fieldset>
                    <label className="text-1 fw-6 mb-12" htmlFor="city">
                      Kota
                    </label>
                    <input
                      id="city"
                      name="city"
                      className="form-control"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </fieldset>
                </div>

                <div className="col-lg-6 mb-12">
                  <div className="select w-full">
                    <label className="text-1 fw-6 mb-12" htmlFor="certificate_type">
                      Tipe Sertifikat
                    </label>
                    <select
                      id="certificate_type"
                      name="certificate_type"
                      value={formData.certificate_type}
                      onChange={handleChange}
                    >
                      <option value="SHM">SHM</option>
                      <option value="SHGB">SHGB</option>
                    </select>
                  </div>
                </div>

                <div className="col-lg-6 mb-12">
                  <div className="select w-full">
                    <label className="text-1 fw-6 mb-12" htmlFor="certificate_status">
                      Status Sertifikat
                    </label>
                    <select
                      id="certificate_status"
                      name="certificate_status"
                      value={formData.certificate_status}
                      onChange={handleChange}
                    >
                      <option value="lunas">Lunas</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>
                </div>

                <div className="col-12">
                  <fieldset className="box-fieldset">
                    <label className="text-1 fw-6 mb-12" htmlFor="description">
                      Deskripsi
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      className="textarea"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Ceritakan keunggulan properti"
                    />
                  </fieldset>
                </div>
              </div>

              <div style={{ marginTop: "24px" }}>
                <h5 className="fw-6">Detail Properti</h5>
                <div className="row">
                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.luas_tanah">
                        Luas Tanah (m2)
                      </label>
                      <input
                        id="detail.luas_tanah"
                        name="detail.luas_tanah"
                        className="form-control"
                        value={formData.detail.luas_tanah}
                        onChange={handleChange}
                      />
                    </fieldset>
                  </div>

                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.luas_bangunan">
                        Luas Bangunan (m2)
                      </label>
                      <input
                        id="detail.luas_bangunan"
                        name="detail.luas_bangunan"
                        className="form-control"
                        value={formData.detail.luas_bangunan}
                        onChange={handleChange}
                      />
                    </fieldset>
                  </div>

                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.floors">
                        Lantai
                      </label>
                      <input
                        id="detail.floors"
                        name="detail.floors"
                        className="form-control"
                        type="number"
                        value={formData.detail.floors}
                        onChange={handleChange}
                      />
                    </fieldset>
                  </div>

                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.bedrooms">
                        Kamar Tidur
                      </label>
                      <input
                        id="detail.bedrooms"
                        name="detail.bedrooms"
                        className="form-control"
                        type="number"
                        value={formData.detail.bedrooms}
                        onChange={handleChange}
                      />
                    </fieldset>
                  </div>

                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.bathrooms">
                        Kamar Mandi
                      </label>
                      <input
                        id="detail.bathrooms"
                        name="detail.bathrooms"
                        className="form-control"
                        type="number"
                        value={formData.detail.bathrooms}
                        onChange={handleChange}
                      />
                    </fieldset>
                  </div>

                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.kitchens">
                        Dapur
                      </label>
                      <input
                        id="detail.kitchens"
                        name="detail.kitchens"
                        className="form-control"
                        type="number"
                        value={formData.detail.kitchens}
                        onChange={handleChange}
                      />
                    </fieldset>
                  </div>

                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.living_rooms">
                        Ruang Tamu
                      </label>
                      <input
                        id="detail.living_rooms"
                        name="detail.living_rooms"
                        className="form-control"
                        type="number"
                        value={formData.detail.living_rooms}
                        onChange={handleChange}
                      />
                    </fieldset>
                  </div>

                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.electricity_capacity">
                        Daya Listrik (VA)
                      </label>
                      <input
                        id="detail.electricity_capacity"
                        name="detail.electricity_capacity"
                        className="form-control"
                        value={formData.detail.electricity_capacity}
                        onChange={handleChange}
                      />
                    </fieldset>
                  </div>

                  <div className="col-lg-4 mb-12">
                    <div className="select w-full">
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.water">
                        Sumber Air
                      </label>
                      <select
                        id="detail.water"
                        name="detail.water"
                        value={formData.detail.water}
                        onChange={handleChange}
                      >
                        <option value="pdam">PDAM</option>
                        <option value="sumur">Sumur</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-lg-4 mb-12">
                    <div className="select w-full">
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.listrik_type">
                        Tipe Listrik
                      </label>
                      <select
                        id="detail.listrik_type"
                        name="detail.listrik_type"
                        value={formData.detail.listrik_type}
                        onChange={handleChange}
                      >
                        <option value="overground">Overground</option>
                        <option value="underground">Underground</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12" htmlFor="detail.wifi_provider">
                        Provider Wifi
                      </label>
                      <input
                        id="detail.wifi_provider"
                        name="detail.wifi_provider"
                        className="form-control"
                        value={formData.detail.wifi_provider}
                        onChange={handleChange}
                      />
                    </fieldset>
                  </div>

                  <div className="col-12" style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      <label>
                        <input
                          type="checkbox"
                          name="detail.carport"
                          checked={formData.detail.carport}
                          onChange={handleChange}
                        />{" "}
                        Carport
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          name="detail.garden"
                          checked={formData.detail.garden}
                          onChange={handleChange}
                        />{" "}
                        Taman
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          name="detail.one_gate_system"
                          checked={formData.detail.one_gate_system}
                          onChange={handleChange}
                        />{" "}
                        One Gate System
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          name="detail.security_24jam"
                          checked={formData.detail.security_24jam}
                          onChange={handleChange}
                        />{" "}
                        Keamanan 24 Jam
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "24px" }}>
                <h5 className="fw-6">Gambar Properti</h5>
                <fieldset>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    accept="image/*"
                    onChange={handleImagesChange}
                  />
                </fieldset>
                {totalImages > 0 && (
                  <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                    {formData.newImages.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="radio"
                          name="primaryImage"
                          checked={primaryNewIndex === index}
                          onChange={() => setPrimaryNewIndex(index)}
                        />
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          style={{ border: "none", background: "none", color: "#dc2626" }}
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "24px" }}>
                <h5 className="fw-6">Dokumen Pendukung (Opsional)</h5>
                <div className="row">
                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12">Sertifikat</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf,image/*"
                        onChange={handleFileChange("certificateFile")}
                      />
                    </fieldset>
                  </div>
                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12">Tagihan Listrik</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf,image/*"
                        onChange={handleFileChange("electricBillFile")}
                      />
                    </fieldset>
                  </div>
                  <div className="col-lg-4 mb-12">
                    <fieldset>
                      <label className="text-1 fw-6 mb-12">Tagihan Air</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf,image/*"
                        onChange={handleFileChange("waterBillFile")}
                      />
                    </fieldset>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "32px" }}>
                <button
                  type="submit"
                  className="tf-btn bg-color-primary fw-7 pd-8 w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
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
