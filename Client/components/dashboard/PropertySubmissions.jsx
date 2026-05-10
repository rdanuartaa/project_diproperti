"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import SuccessModal from "@/components/common/SuccesModal";
import AttentionModal from "@/components/common/AttentionModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import DropdownSelect from "../common/DropdownSelect";

/**
 * ReadonlyDropdown — render DropdownSelect persis seperti Properti.jsx
 * tapi tidak bisa diklik (pointer-events: none pada wrapper).
 */
function ReadonlyDropdown({ value }) {
  return (
    <div style={{ pointerEvents: "none", userSelect: "none" }}>
      <DropdownSelect
        options={[value || "-"]}
        selectedValue={value || "-"}
        onChange={() => {}}
      />
    </div>
  );
}

export default function PropertySubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [filters, setFilters] = useState({ search: "", sort: "Terbaru" });

  // Modal States
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [attention, setAttention] = useState({ open: false, message: "" });
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/property-submissions");
      setSubmissions(response.data.data || response.data || []);
    } catch (error) {
      setAttention({ open: true, message: "Gagal memuat data pengajuan." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];

    // Search berdasarkan title
    if (filters.search) {
      const query = filters.search.toLowerCase().trim();
      result = result.filter((item) =>
        (item.title || "").toLowerCase().includes(query)
      );
    }

    // Sort berdasarkan updated_at atau created_at
    result.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return filters.sort === "Terbaru" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [submissions, filters]);

  const openDetail = (submission) => {
    setActiveSubmission(submission);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setActiveSubmission(null);
    setShowDetailModal(false);
  };

  const handleApprove = async () => {
    if (!activeSubmission) return;
    setIsActionLoading(true);
    try {
      await api.put(`/admin/property-submissions/${activeSubmission.id}/approve`);
      setSuccessMessage(
        `Pengajuan "${activeSubmission.title}" berhasil disetujui & otomatis masuk ke menu Properti.`
      );
      setShowSuccess(true);
      closeDetail();
      fetchSubmissions();
    } catch (error) {
      setAttention({ open: true, message: "Gagal menyetujui pengajuan." });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeSubmission) return;
    setIsActionLoading(true);
    try {
      await api.delete(`/admin/property-submissions/${activeSubmission.id}`);
      setSuccessMessage("Pengajuan berhasil ditolak/dihapus.");
      setShowSuccess(true);
      setShowConfirm(false);
      closeDetail();
      fetchSubmissions();
    } catch (error) {
      setAttention({ open: true, message: "Gagal menghapus pengajuan." });
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatPrice = (val) =>
    `Rp ${Number(val || 0).toLocaleString("id-ID")}`;

  const val = (field, fallback = "-") =>
    field !== null && field !== undefined && field !== ""
      ? String(field)
      : fallback;

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="main-content w-100">
        <div className="main-content-inner wrap-dashboard-content">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Memuat data pengajuan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content w-100">
      <div className="main-content-inner wrap-dashboard-content">
        {/* Modals */}
        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          message={successMessage}
        />
        <AttentionModal
          isOpen={attention.open}
          onClose={() => setAttention({ open: false, message: "" })}
          title="Perhatian"
          message={attention.message}
        />
        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleDelete}
          title="Konfirmasi Penolakan"
          message={`Tolak & hapus pengajuan "${activeSubmission?.title}"?`}
          confirmText="Tolak / Hapus"
          cancelText="Batal"
          isLoading={isActionLoading}
        />

        {/* Filter & Search */}
        <div className="row mb-3">
          <div className="col-md-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>Urutkan:<span>*</span></label>
                <DropdownSelect
                  options={["Terbaru", "Terlama"]}
                  selectedValue={filters.sort}
                  onChange={(value) => {
                    setFilters((prev) => ({ ...prev, sort: value }));
                  }}
                  addtionalParentClass=""
                />
              </fieldset>
            </form>
          </div>
          <div className="col-md-9">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>Cari Properti:<span>*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari berdasarkan judul..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, search: e.target.value }));
                  }}
                />
              </fieldset>
            </form>
          </div>
        </div>

        <div className="widget-box-2 wd-listing mt-20">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-12 mb-4">
            <h3 className="title">Pengajuan Properti</h3>
          </div>
          <div className="alert alert-warning mb-4" role="alert">
            <strong>📌 Kebijakan Platform:</strong> Upload listing properti{" "}
            <u>GRATIS 100%</u>. Namun, jika properti berhasil <u>terjual</u>,
            akan dikenakan komisi admin sebesar{" "}
            <strong>2.5% dari harga jual</strong>.
          </div>

          {/* Table List */}
          <div className="wrap-table">
            <div className="table-responsive">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {filters.search 
                    ? "Pengajuan tidak ditemukan untuk pencarian tersebut." 
                    : "Belum ada pengajuan properti saat ini."}
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Properti</th>
                      <th>Pengaju</th>
                      <th>Tipe</th>
                      <th>Harga</th>
                      <th>Diperbarui</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="listing-box">
                            <div className="images">
                              {item.images?.[0]?.full_url ? (
                                <Image
                                  src={item.images[0].full_url}
                                  alt={item.title}
                                  width={150}
                                  height={100}
                                  className="listing-image"
                                />
                              ) : (
                                <div className="listing-image-placeholder">
                                  Tidak ada gambar
                                </div>
                              )}
                            </div>
                            <div className="content">
                              <div className="title">
                                <span className="link">{item.title}</span>
                              </div>
                              <div className="text-date">
                                {item.kecamatan}, {item.city}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm text-gray-600">
                            {item.user?.name || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-600">
                            {item.type || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="font-semibold text-blue-600">
                            {formatPrice(item.price)}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDateTime(item.updated_at)}
                          </span>
                        </td>
                        <td>
                          <ul className="list-action">
                            <li>
                              <a
                                className="item"
                                onClick={() => openDetail(item)}
                                style={{ cursor: "pointer" }}
                              >
                                <svg
                                  width={16}
                                  height={16}
                                  viewBox="0 0 16 16"
                                  fill="none"
                                >
                                  <path
                                    d="M8 1.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"
                                    stroke="#A3ABB0"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Verifikasi
                              </a>
                            </li>
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-dashboard">
          <p>© {new Date().getFullYear()} DIPROPERTI REAL ESTATE. All rights reserved.</p>
          <ul className="list">
            <li>
              <a href="#">Privasi</a>
            </li>
            <li>
              <a href="#">Syarat</a>
            </li>
            <li>
              <a href="#">Bantuan</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`overlay-dashboard ${showDetailModal ? "show" : ""}`}
        onClick={closeDetail}
      />

      {/* ===================== DETAIL MODAL ===================== */}
      {showDetailModal && activeSubmission && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">

              {/* Header */}
              <div className="modal-header modal-header-title">
                <h5 className="modal-title">
                  Verifikasi Pengajuan: {activeSubmission.title}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDetail}
                  aria-label="Close"
                />
              </div>

              {/* Body */}
              <div
                className="modal-body modal-body-wide"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <div className="alert alert-warning" role="alert">
                  Semua data wajib diisi dan tidak boleh kosong. Minimal upload
                  1 gambar.
                </div>

                {/* Wrapper pakai class yang sama dgn Properti.jsx */}
                <div className="modal-form-spacing">
                  <div className="row g-3">

                    {/* ===== SECTION 1: INFORMASI DASAR ===== */}
                    <div className="col-12">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        📋 Informasi Dasar
                      </h6>
                    </div>

                    {/* Judul */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Judul</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.title)}
                          readOnly
                          placeholder="Contoh: Apartemen Kota Modern"
                        />
                      </fieldset>
                    </div>

                    {/* Harga */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Harga (IDR)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatPrice(activeSubmission.price)}
                          readOnly
                          placeholder="Contoh: 500.000.000"
                        />
                      </fieldset>
                    </div>

                    {/* Tipe */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Tipe</label>
                        <ReadonlyDropdown value={val(activeSubmission.type)} />
                      </fieldset>
                    </div>

                    {/* Tipe Bangunan */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Tipe Bangunan (angka)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.building_type)}
                          readOnly
                          placeholder="Contoh: 1"
                        />
                      </fieldset>
                    </div>

                    {/* Status */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Status</label>
                        <ReadonlyDropdown value={val(activeSubmission.status)} />
                      </fieldset>
                    </div>

                    {/* Tipe Listing */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Tipe Listing</label>
                        <ReadonlyDropdown value={val(activeSubmission.listing_type)} />
                      </fieldset>
                    </div>

                    {/* Kota */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Kota</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.city)}
                          readOnly
                          placeholder="Contoh: Jember"
                        />
                      </fieldset>
                    </div>

                    {/* Kecamatan */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Kecamatan</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.kecamatan)}
                          readOnly
                          placeholder="Contoh: Sumbersari"
                        />
                      </fieldset>
                    </div>

                    {/* Status Sertifikat */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Status Sertifikat</label>
                        <ReadonlyDropdown value={val(activeSubmission.certificate_status)} />
                      </fieldset>
                    </div>

                    {/* Jenis Sertifikat */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Jenis Sertifikat</label>
                        <ReadonlyDropdown value={val(activeSubmission.certificate_type)} />
                      </fieldset>
                    </div>

                    {/* Deskripsi */}
                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Deskripsi</label>
                        <textarea
                          className="textarea"
                          rows={3}
                          value={val(activeSubmission.description)}
                          readOnly
                          placeholder="Tuliskan deskripsi singkat properti..."
                        />
                      </fieldset>
                    </div>

                    {/* ===== SECTION 2: DETAIL PROPERTI ===== */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        🏠 Detail Properti
                      </h6>
                    </div>

                    {/* Checkboxes — pakai style label sama dgn Properti.jsx */}
                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label className="d-flex align-items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!activeSubmission.detail?.carport}
                            readOnly
                            disabled
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
                            checked={!!activeSubmission.detail?.garden}
                            readOnly
                            disabled
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
                            checked={!!activeSubmission.detail?.one_gate_system}
                            readOnly
                            disabled
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
                            checked={!!activeSubmission.detail?.security_24jam}
                            readOnly
                            disabled
                          />
                          Keamanan 24 Jam
                        </label>
                      </fieldset>
                    </div>

                    {/* Luas Tanah */}
                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Luas Tanah (m²)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.detail?.luas_tanah)}
                          readOnly
                          placeholder="Contoh: 120"
                        />
                      </fieldset>
                    </div>

                    {/* Luas Bangunan */}
                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Luas Bangunan (m²)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.detail?.luas_bangunan)}
                          readOnly
                          placeholder="Contoh: 90"
                        />
                      </fieldset>
                    </div>

                    {/* Jumlah Lantai */}
                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Jumlah Lantai</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.detail?.floors, 0)}
                          readOnly
                          placeholder="Contoh: 2"
                        />
                      </fieldset>
                    </div>

                    {/* Kamar Tidur */}
                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Kamar Tidur</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.detail?.bedrooms, 0)}
                          readOnly
                          placeholder="Contoh: 3"
                        />
                      </fieldset>
                    </div>

                    {/* Kamar Mandi */}
                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Kamar Mandi</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.detail?.bathrooms, 0)}
                          readOnly
                          placeholder="Contoh: 2"
                        />
                      </fieldset>
                    </div>

                    {/* Dapur */}
                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Dapur</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.detail?.kitchens, 0)}
                          readOnly
                          placeholder="Contoh: 1"
                        />
                      </fieldset>
                    </div>

                    {/* Ruang Tamu */}
                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Ruang Tamu</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.detail?.living_rooms, 0)}
                          readOnly
                          placeholder="Contoh: 1"
                        />
                      </fieldset>
                    </div>

                    {/* Daya Listrik */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Daya Listrik (VA)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.detail?.electricity_capacity)}
                          readOnly
                          placeholder="Contoh: 2200"
                        />
                      </fieldset>
                    </div>

                    {/* Penyedia WiFi */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Penyedia WiFi</label>
                        <input
                          type="text"
                          className="form-control"
                          value={val(activeSubmission.detail?.wifi_provider)}
                          readOnly
                          placeholder="Contoh: IndiHome, Biznet"
                        />
                      </fieldset>
                    </div>

                    {/* Sumber Air */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Sumber Air</label>
                        <ReadonlyDropdown value={val(activeSubmission.detail?.water)} />
                      </fieldset>
                    </div>

                    {/* Jenis Listrik */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Jenis Listrik</label>
                        <ReadonlyDropdown value={val(activeSubmission.detail?.listrik_type)} />
                      </fieldset>
                    </div>

                    {/* ===== SECTION 3: GAMBAR PROPERTI ===== */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        🖼️ Gambar Properti
                      </h6>
                    </div>

                    <div className="col-12">
                      {/* Pakai class box-img-upload + item-upload persis seperti Properti.jsx */}
                      <div className="box-img-upload">
                        {activeSubmission.images?.length > 0 ? (
                          activeSubmission.images.map((img, idx) => (
                            <div
                              key={idx}
                              className={`item-upload${img.is_primary ? " is-primary" : ""}`}
                            >
                              <Image
                                src={img.full_url}
                                alt={`Preview ${idx + 1}`}
                                width={615}
                                height={405}
                              />
                              {/* Tidak ada tombol hapus / star — readonly */}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 py-4 text-center">
                            Tidak ada gambar diunggah.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ===== SECTION 4: DOKUMEN PENDUKUNG ===== */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        📂 Dokumen Pendukung
                      </h6>
                    </div>

                    {/* Sertifikat */}
                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Sertifikat</label>
                        {activeSubmission.certificate_file_url ? (
                          <a
                            href={activeSubmission.certificate_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            📄 Lihat File
                          </a>
                        ) : (
                          <input
                            type="text"
                            className="form-control"
                            value="-"
                            readOnly
                          />
                        )}
                      </fieldset>
                    </div>

                    {/* Tagihan Listrik */}
                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Tagihan Listrik</label>
                        {activeSubmission.electric_bill_file_url ? (
                          <a
                            href={activeSubmission.electric_bill_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            📄 Lihat File
                          </a>
                        ) : (
                          <input
                            type="text"
                            className="form-control"
                            value="-"
                            readOnly
                          />
                        )}
                      </fieldset>
                    </div>

                    {/* Tagihan Air */}
                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Tagihan Air</label>
                        {activeSubmission.water_bill_file_url ? (
                          <a
                            href={activeSubmission.water_bill_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            📄 Lihat File
                          </a>
                        ) : (
                          <input
                            type="text"
                            className="form-control"
                            value="-"
                            readOnly
                          />
                        )}
                      </fieldset>
                    </div>

                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="tf-btn style-border pd-23 btn-cancel-danger"
                  onClick={() => setShowConfirm(true)}
                  disabled={isActionLoading}
                >
                  Tolak / Hapus
                </button>
                <button
                  type="button"
                  className="tf-btn bg-color-primary pd-23"
                  onClick={handleApprove}
                  disabled={isActionLoading}
                >
                  {isActionLoading && (
                    <span className="btn-spinner" aria-hidden="true" />
                  )}
                  <span>Setujui &amp; Publikasikan</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}