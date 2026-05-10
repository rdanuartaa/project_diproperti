"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL, api } from "@/lib/api";
import SuccessModal from "@/components/common/SuccesModal";
import AttentionModal from "@/components/common/AttentionModal";
import Image from "next/image";
import DropdownSelect from "@/components/common/DropdownSelect";

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
  
  // ✅ State untuk Terms & Conditions Modal (tidak otomatis muncul)
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  
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

  const formatThousands = (rawValue) => {
    const digits = String(rawValue ?? "").replace(/\D/g, "");
    if (!digits) return "";
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const updateDetail = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      detail: { ...prev.detail, [field]: value },
    }));
    const key = `detail.${field}`;
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
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
    
    // ✅ Validasi: User harus setuju terms sebelum submit
    if (!hasAgreedToTerms) {
      setShowTermsModal(true);
      return;
    }
    
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
    <section className="tf-spacing-1 pt-0">
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

          {/* ✅ MODAL SYARAT & KETENTUAN (Hanya muncul saat diklik) */}
          {showTermsModal && (
            <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">📋 Syarat & Ketentuan Penjualan Properti</h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setShowTermsModal(false)}
                      aria-label="Close"
                    />
                  </div>
                  <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    <div className="alert alert-info mb-3">
                      <strong>⚠️ Harap baca dengan seksama sebelum menyetujui.</strong>
                    </div>
                    
                    <h6 className="fw-bold mb-2">1. Kebijakan Biaya Platform</h6>
                    <ul className="mb-3">
                      <li>✅ <strong>GRATIS 100%</strong> untuk mengupload/mendaftarkan properti di platform kami.</li>
                      <li>✅ Tidak ada biaya admin, biaya listing, atau biaya tersembunyi saat pendaftaran.</li>
                      <li>⚠️ <strong>Komisi Penjualan:</strong> Jika properti Anda berhasil <u>terjual</u> melalui platform kami, akan dikenakan komisi admin sebesar <strong>2.5% dari harga jual final</strong>.</li>
                      <li>⚠️ Komisi hanya dibayarkan <strong>setelah transaksi berhasil</strong> dan dana telah diterima oleh penjual.</li>
                    </ul>

                    <h6 className="fw-bold mb-2">2. Verifikasi & Persetujuan Admin</h6>
                    <ul className="mb-3">
                      <li>Semua pengajuan properti akan diverifikasi oleh tim admin sebelum ditampilkan di listing publik.</li>
                      <li>Admin berhak menolak pengajuan jika data tidak lengkap, tidak valid, atau melanggar kebijakan platform.</li>
                      <li>Proses verifikasi biasanya memakan waktu 1-3 hari kerja.</li>
                    </ul>

                    <h6 className="fw-bold mb-2">3. Keabsahan Data</h6>
                    <ul className="mb-3">
                      <li>Penjual bertanggung jawab penuh atas keakuratan dan keabsahan semua data yang diupload (gambar, dokumen, deskripsi).</li>
                      <li>Platform tidak bertanggung jawab atas kerugian akibat data palsu atau menyesatkan dari pihak penjual.</li>
                      <li>Dokumen pendukung (sertifikat, tagihan) bersifat opsional namun sangat disarankan untuk mempercepat verifikasi.</li>
                    </ul>

                    <h6 className="fw-bold mb-2">4. Privasi & Keamanan</h6>
                    <ul className="mb-3">
                      <li>Data pribadi penjual hanya digunakan untuk keperluan verifikasi dan transaksi.</li>
                      <li>Kami tidak akan membagikan data kontak Anda kepada pihak ketiga tanpa izin eksplisit.</li>
                    </ul>

                    <div className="alert alert-warning">
                      <strong>Dengan mengklik "Saya Setuju", Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat & ketentuan di atas.</strong>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="tf-btn style-border pd-23"
                      onClick={() => setShowTermsModal(false)}
                    >
                      Tutup
                    </button>
                    <button 
                      type="button" 
                      className="tf-btn bg-color-primary pd-23"
                      onClick={() => {
                        setHasAgreedToTerms(true);
                        setShowTermsModal(false);
                      }}
                    >
                      ✅ Saya Setuju
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row">
            <div className="col-12">
              <div style={{ marginBottom: "24px" }}>
                <h2 className="fw-7">Jual Properti</h2>
                <p style={{ color: "#6b7280" }}>
                  Lengkapi data properti, detail, dan gambar. Admin akan memverifikasi sebelum tampil di listing.
                </p>
              </div>

              {/* ✅ Notifikasi Kebijakan Singkat */}
              <div className="alert alert-warning mb-4" role="alert">
                <strong>📌 Info Penting:</strong> Listing properti <u>GRATIS</u>. Komisi <strong>2.5%</strong> hanya dikenakan jika properti <u>berhasil terjual</u>.
              </div>

              <form onSubmit={handleSubmit} className="form-contact modal-form-spacing">
                <div className="modal-body-wide pd-0">
                  <div className="row g-3">
                    {/* === SECTION 1: BASIC INFO === */}
                    <div className="col-12">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        📋 Informasi Dasar
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Judul</label>
                        <input
                          type="text"
                          name="title"
                          className={`form-control ${errors.title ? "border-red-500" : ""}`}
                          placeholder="Contoh: Apartemen Kota Modern"
                          value={formData.title}
                          onChange={handleChange}
                          required
                        />
                        {errors.title && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.title[0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Harga (Rp)</label>
                        <input
                          type="text"
                          name="price"
                          className={`form-control ${errors.price ? "border-red-500" : ""}`}
                          placeholder="Contoh: 500.000.000"
                          value={formatThousands(formData.price)}
                          onChange={handlePriceChange}
                          required
                        />
                        {errors.price && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.price[0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label htmlFor="type">Tipe</label>
                        <DropdownSelect
                          options={["rumah", "perumahan", "ruko", "kos", "tanah"]}
                          selectedValue={formData.type}
                          onChange={(value) => updateField("type", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label htmlFor="listing_type">Tipe Listing</label>
                        <DropdownSelect
                          options={["jual", "sewa"]}
                          selectedValue={formData.listing_type}
                          onChange={(value) => updateField("listing_type", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Kecamatan</label>
                        <input
                          type="text"
                          name="kecamatan"
                          className={`form-control ${errors.kecamatan ? "border-red-500" : ""}`}
                          placeholder="Contoh: Sumbersari"
                          value={formData.kecamatan}
                          onChange={handleChange}
                          required
                        />
                        {errors.kecamatan && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.kecamatan[0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Kota</label>
                        <input
                          type="text"
                          name="city"
                          className={`form-control ${errors.city ? "border-red-500" : ""}`}
                          placeholder="Contoh: Jember"
                          value={formData.city}
                          onChange={handleChange}
                          required
                        />
                        {errors.city && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.city[0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label htmlFor="certificate_type">Jenis Sertifikat</label>
                        <DropdownSelect
                          options={["SHM", "SHGB"]}
                          selectedValue={formData.certificate_type}
                          onChange={(value) => updateField("certificate_type", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label htmlFor="certificate_status">Status Sertifikat</label>
                        <DropdownSelect
                          options={["lunas", "bank"]}
                          selectedValue={formData.certificate_status}
                          onChange={(value) => updateField("certificate_status", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Deskripsi</label>
                        <textarea
                          name="description"
                          className={`textarea ${errors.description ? "border-red-500" : ""}`}
                          value={formData.description}
                          onChange={handleChange}
                          rows={3}
                          placeholder="Ceritakan keunggulan properti"
                        />
                        {errors.description && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.description[0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    {/* === SECTION 2: PROPERTY DETAILS === */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        🏠 Detail Properti
                      </h6>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Luas Tanah (m²)</label>
                        <input
                          type="number"
                          name="detail.luas_tanah"
                          className={`form-control ${errors["detail.luas_tanah"] ? "border-red-500" : ""}`}
                          placeholder="0"
                          value={formData.detail.luas_tanah}
                          onChange={handleChange}
                          required
                        />
                        {errors["detail.luas_tanah"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["detail.luas_tanah"][0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Luas Bangunan (m²)</label>
                        <input
                          type="number"
                          name="detail.luas_bangunan"
                          className={`form-control ${errors["detail.luas_bangunan"] ? "border-red-500" : ""}`}
                          placeholder="0"
                          value={formData.detail.luas_bangunan}
                          onChange={handleChange}
                        />
                        {errors["detail.luas_bangunan"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["detail.luas_bangunan"][0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Lantai</label>
                        <input
                          type="number"
                          name="detail.floors"
                          className={`form-control ${errors["detail.floors"] ? "border-red-500" : ""}`}
                          value={formData.detail.floors}
                          onChange={handleChange}
                        />
                        {errors["detail.floors"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["detail.floors"][0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Kamar Tidur</label>
                        <input
                          type="number"
                          name="detail.bedrooms"
                          className={`form-control ${errors["detail.bedrooms"] ? "border-red-500" : ""}`}
                          value={formData.detail.bedrooms}
                          onChange={handleChange}
                        />
                        {errors["detail.bedrooms"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["detail.bedrooms"][0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Kamar Mandi</label>
                        <input
                          type="number"
                          name="detail.bathrooms"
                          className={`form-control ${errors["detail.bathrooms"] ? "border-red-500" : ""}`}
                          value={formData.detail.bathrooms}
                          onChange={handleChange}
                        />
                        {errors["detail.bathrooms"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["detail.bathrooms"][0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Dapur</label>
                        <input
                          type="number"
                          name="detail.kitchens"
                          className={`form-control ${errors["detail.kitchens"] ? "border-red-500" : ""}`}
                          value={formData.detail.kitchens}
                          onChange={handleChange}
                        />
                        {errors["detail.kitchens"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["detail.kitchens"][0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Ruang Tamu</label>
                        <input
                          type="number"
                          name="detail.living_rooms"
                          className={`form-control ${errors["detail.living_rooms"] ? "border-red-500" : ""}`}
                          value={formData.detail.living_rooms}
                          onChange={handleChange}
                        />
                        {errors["detail.living_rooms"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["detail.living_rooms"][0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Daya Listrik (VA)</label>
                        <input
                          type="text"
                          name="detail.electricity_capacity"
                          className={`form-control ${errors["detail.electricity_capacity"] ? "border-red-500" : ""}`}
                          placeholder="Contoh: 1300"
                          value={formData.detail.electricity_capacity}
                          onChange={handleChange}
                        />
                        {errors["detail.electricity_capacity"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["detail.electricity_capacity"][0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label htmlFor="detail.water">Sumber Air</label>
                        <DropdownSelect
                          options={["pdam", "sumur"]}
                          selectedValue={formData.detail.water}
                          onChange={(value) => updateDetail("water", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label htmlFor="detail.listrik_type">Tipe Listrik</label>
                        <DropdownSelect
                          options={["overground", "underground"]}
                          selectedValue={formData.detail.listrik_type}
                          onChange={(value) => updateDetail("listrik_type", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Provider Wifi</label>
                        <input
                          type="text"
                          name="detail.wifi_provider"
                          className={`form-control ${errors["detail.wifi_provider"] ? "border-red-500" : ""}`}
                          placeholder="Contoh: IndiHome"
                          value={formData.detail.wifi_provider}
                          onChange={handleChange}
                        />
                        {errors["detail.wifi_provider"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["detail.wifi_provider"][0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-12 mt-2">
                      <div className="row g-3">
                        <div className="col-md-3">
                          <fieldset className="box-fieldset">
                            <label className="d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                name="detail.carport"
                                checked={formData.detail.carport}
                                onChange={handleChange}
                              />
                              Carport
                            </label>
                          </fieldset>
                        </div>
                        <div className="col-md-3">
                          <fieldset className="box-fieldset">
                            <label className="d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                name="detail.garden"
                                checked={formData.detail.garden}
                                onChange={handleChange}
                              />
                              Taman
                            </label>
                          </fieldset>
                        </div>
                        <div className="col-md-3">
                          <fieldset className="box-fieldset">
                            <label className="d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                name="detail.one_gate_system"
                                checked={formData.detail.one_gate_system}
                                onChange={handleChange}
                              />
                              One Gate System
                            </label>
                          </fieldset>
                        </div>
                        <div className="col-md-3">
                          <fieldset className="box-fieldset">
                            <label className="d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                name="detail.security_24jam"
                                checked={formData.detail.security_24jam}
                                onChange={handleChange}
                              />
                              Keamanan 24 Jam
                            </label>
                          </fieldset>
                        </div>
                      </div>
                    </div>

                    {/* === SECTION 3: IMAGES === */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        🖼️ Gambar Properti
                      </h6>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <div className="box-uploadfile text-center">
                          <div className="uploadfile">
                            <label className="tf-btn bg-color-primary pd-10 btn-upload mx-auto">
                              <svg
                                width={21}
                                height={20}
                                viewBox="0 0 21 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M13.625 14.375V17.1875C13.625 17.705 13.205 18.125 12.6875 18.125H4.5625C4.31386 18.125 4.0754 18.0262 3.89959 17.8504C3.72377 17.6746 3.625 17.4361 3.625 17.1875V6.5625C3.625 6.045 4.045 5.625 4.5625 5.625H6.125C6.54381 5.62472 6.96192 5.65928 7.375 5.72834M13.625 14.375H16.4375C16.955 14.375 17.375 13.955 17.375 13.4375V9.375C17.375 5.65834 14.6725 2.57417 11.125 1.97834C10.7119 1.90928 10.2938 1.87472 9.875 1.875H8.3125C7.795 1.875 7.375 2.295 7.375 2.8125V5.72834M13.625 14.375H8.3125C8.06386 14.375 7.8254 14.2762 7.64959 14.1004C7.47377 13.9246 7.375 13.6861 7.375 13.4375V5.72834M17.375 11.25V9.6875C17.375 8.94158 17.0787 8.22621 16.5512 7.69876C16.0238 7.17132 15.3084 6.875 14.5625 6.875H13.3125C13.0639 6.875 12.8254 6.77623 12.6496 6.60041C12.4738 6.4246 12.375 6.18614 12.375 5.9375V4.6875C12.375 4.31816 12.3023 3.95243 12.1609 3.6112C12.0196 3.26998 11.8124 2.95993 11.5512 2.69876C11.2901 2.4376 10.98 2.23043 10.6388 2.08909C10.2976 1.94775 9.93184 1.875 9.5625 1.875H8.625"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Pilih foto
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImagesChange}
                                className="ip-file"
                              />
                            </label>
                            <p className="file-name fw-5">
                              atau seret foto ke sini <br />
                              <span>(Maks 10 foto)</span>
                            </p>
                          </div>
                        </div>
                      </fieldset>

                      {totalImages > 0 && (
                        <div className="box-img-upload mt-3">
                          {formData.newImages.map((file, index) => (
                            <div
                              key={`${file.name}-${index}`}
                              className={`item-upload file-delete${
                                primaryNewIndex === index ? " is-primary" : ""
                              }`}
                            >
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                width={615}
                                height={405}
                              />
                              <button
                                type="button"
                                className="icon primary-toggle"
                                onClick={() => setPrimaryNewIndex(index)}
                                aria-label="Jadikan utama"
                              >
                                <svg
                                  width={16}
                                  height={16}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M12 3.5L14.7 8.97L20.75 9.85L16.37 14.1L17.4 20.12L12 17.28L6.6 20.12L7.63 14.1L3.25 9.85L9.3 8.97L12 3.5Z"
                                    stroke="white"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="icon icon-trashcan1 remove-file"
                                onClick={() => handleRemoveImage(index)}
                                aria-label="Hapus"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* === SECTION 4: DOCUMENTS === */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        📂 Dokumen Pendukung (Opsional)
                      </h6>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <fieldset className="box-fieldset">
                          <label>Sertifikat</label>
                          <input
                            type="file"
                            className="form-control"
                            accept=".pdf,image/*"
                            onChange={handleFileChange("certificateFile")}
                          />
                        </fieldset>
                      </div>
                      <div className="col-md-4">
                        <fieldset className="box-fieldset">
                          <label>Tagihan Listrik</label>
                          <input
                            type="file"
                            className="form-control"
                            accept=".pdf,image/*"
                            onChange={handleFileChange("electricBillFile")}
                          />
                        </fieldset>
                      </div>
                      <div className="col-md-4">
                        <fieldset className="box-fieldset">
                          <label>Tagihan Air</label>
                          <input
                            type="file"
                            className="form-control"
                            accept=".pdf,image/*"
                            onChange={handleFileChange("waterBillFile")}
                          />
                        </fieldset>
                      </div>
                    </div>

                    {/* ✅ LINK SYARAT & KETENTUAN (Clickable Text) */}
                    <div className="col-12 mt-4">
                      <div className="text-center">
                        <button
                          type="button"
                          className="btn btn-link text-decoration-none fw-6"
                          style={{ color: "#2563eb", fontSize: "0.95rem" }}
                          onClick={() => setShowTermsModal(true)}
                        >
                          📋 Baca Syarat & Ketentuan Penjualan
                        </button>
                        {hasAgreedToTerms && (
                          <span className="text-success ms-2 fw-5">
                            ✓ Sudah disetujui
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ✅ Tombol Submit */}
                    <div style={{ marginTop: "24px" }}>
                      <button
                        type="submit"
                        className={`tf-btn fw-7 pd-8 w-100 ${
                          !hasAgreedToTerms 
                            ? "bg-secondary disabled" 
                            : "bg-color-primary"
                        } ${isSubmitting ? "is-loading" : ""}`}
                        disabled={isSubmitting || !hasAgreedToTerms}
                        onClick={!hasAgreedToTerms ? (e) => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        } : undefined}
                      >
                        {isSubmitting && <span className="btn-spinner" aria-hidden="true" />}
                        <span>
                          {isSubmitting 
                            ? "Mengirim..." 
                            : !hasAgreedToTerms 
                              ? "📋 Setujui Syarat & Ketentuan Terlebih Dahulu" 
                              : "✅ Kirim Pengajuan"}
                        </span>
                      </button>
                      
                      {/* Helper text */}
                      {!hasAgreedToTerms && (
                        <p className="text-muted text-center mt-2 mb-0" style={{ fontSize: "0.875rem" }}>
                          Klik link di atas untuk membaca dan menyetujui syarat penjualan
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}