"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { api, downloadFile } from "@/lib/api";
import SuccessModal from "@/components/common/SuccesModal";
import AttentionModal from "@/components/common/AttentionModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import DropdownSelect from "../common/DropdownSelect";

export default function PropertySubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [filters, setFilters] = useState({ search: "", sort: "Terbaru" });
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
    result = result.filter(item => {
    const role = String(item.user?.role || "").toLowerCase();
    const isAdm = item.user?.is_admin === true || role === "admin";
    return !isAdm; // Jika true (admin), data akan dibuang dari array
  }); 
    if (filters.search) {
      const query = filters.search.toLowerCase().trim();
      result = result.filter((item) =>
        (item.title || "").toLowerCase().includes(query),
      );
    }
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
    if (!activeSubmission || !canActOnSubmission(activeSubmission)) return;
    setIsActionLoading(true);
    try {
      await api.put(
        `/admin/property-submissions/${activeSubmission.id}/approve`,
      );
      setSuccessMessage(
        `Pengajuan "${activeSubmission.title}" berhasil disetujui & otomatis masuk ke menu Properti.`,
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
    if (!activeSubmission || !canActOnSubmission(activeSubmission)) return;
    setIsActionLoading(true);
    try {
      await api.delete(`/admin/properties/${activeSubmission.id}`);
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

  const formatPrice = (val) => `Rp ${Number(val || 0).toLocaleString("id-ID")}`;
  const getRentPeriodLabel = (item) => {
    const period = String(item?.price_period || "bulan");
    if (period === "3bulan") return "3 bulan";
    if (period === "6bulan") return "6 bulan";
    if (period === "tahun") return "tahun";
    return "bulan";
  };

  const formatPriceDisplay = (item) => {
    const base = formatPrice(item?.price);
    if (item?.listing_type !== "sewa") return base;
    if (!item?.price) return base;
    return `${base}/${getRentPeriodLabel(item)}`;
  };

  const getSubmissionStatus = (item) => {
    if (!item) return "-";
    if (item.status === "sold") return "sold";
    return item.is_verified ? "published" : "pending";
  };

  const canActOnSubmission = (item) => {
    if (!item) return false;
    return !item.is_verified && item.status !== "published" && item.status !== "sold";
  };

  const getStatusBadge = (item) => {
    if (!item) return "-";
    if (item.status === "sold") {
      return (
        <span
          className="badge bg-danger"
          style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}
        >
          🔴 Laku
        </span>
      );
    }
    if (item.is_verified && item.status === "published") {
      return (
        <span
          className="badge bg-success"
          style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}
        >
          ✅ Disetujui
        </span>
      );
    }
    return (
      <span
        className="badge bg-warning"
        style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}
      >
        ⏳ Ditinjau
      </span>
    );
  };

  const val = (field, fallback = "-") =>
    field !== null && field !== undefined && field !== " "
      ? String(field)
      : fallback;

  const getLocationInfo = (submission) => {
    if (!submission) {
      return {
        hasCoordinates: false,
        coordinatesLabel: "-",
        mapsUrl: null,
        directionsUrl: null,
        embedUrl: null,
      };
    }

    const latitude = Number(submission.latitude);
    const longitude = Number(submission.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    const addressParts = [
      submission.address,
      submission.kecamatan,
      submission.city,
    ].filter(Boolean);
    const addressQuery = addressParts.join(", ");
    const mapQuery = hasCoordinates
      ? `${latitude},${longitude}`
      : addressQuery;
    const encodedQuery = encodeURIComponent(mapQuery);

    return {
      hasCoordinates,
      coordinatesLabel: hasCoordinates
        ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        : "-",
      mapsUrl: mapQuery
        ? `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`
        : null,
      directionsUrl: mapQuery
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`
        : null,
      embedUrl: mapQuery
        ? `https://maps.google.com/maps?q=${encodedQuery}&z=16&output=embed`
        : null,
    };
  };

  const isImageDocument = (url) => {
    if (!url) return false;
    const cleanUrl = String(url).split("?")[0].toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(cleanUrl);
  };

  const documentItems = (submission) => [
    {
      label: "Sertifikat",
      url: submission?.certificate_file_url,
      downloadUrl: `/admin/property-submissions/${submission?.id}/documents/certificate/download`,
    },
    {
      label: "Tagihan Listrik",
      url: submission?.electric_bill_file_url,
      downloadUrl: `/admin/property-submissions/${submission?.id}/documents/electric-bill/download`,
    },
    {
      label: "Tagihan Air",
      url: submission?.water_bill_file_url,
      downloadUrl: `/admin/property-submissions/${submission?.id}/documents/water-bill/download`,
    },
  ];

  const getDocumentFilename = (label, url) => {
    const extension = String(url || "")
      .split("?")[0]
      .split(".")
      .pop();
    const safeLabel = label.toLowerCase().replace(/\s+/g, "-");
    return extension && extension.length <= 5
      ? `${safeLabel}.${extension}`
      : safeLabel;
  };

  const handleDownload = async (downloadUrl, filename) => {
    try {
      await downloadFile(downloadUrl, filename);
    } catch (error) {
      setAttention({
        open: true,
        message: "Gagal mengunduh file. Pastikan file masih tersedia.",
      });
    }
  };

  const getBuildingTypeDisplay = (submission) => {
    if (!submission) return "";
    if (submission.type === "tanah") {
      return submission.detail?.luas_tanah ?? submission.building_type ?? "";
    }
    if (submission.type === "kos") {
      const panjang = Number(submission.detail?.panjang_ruangan ?? 0);
      const lebar = Number(submission.detail?.lebar_ruangan ?? 0);
      const total = panjang + lebar;
      return total > 0 ? String(total) : (submission.building_type ?? "");
    }
    return submission.building_type ?? "";
  };

  const ReadOnlyDetailCheckbox = ({ checked }) => (
    <div
      className="detail-checkbox"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <input
        type="checkbox"
        className="form-check-input m-0"
        checked={!!checked}
        readOnly
      />
      {!!checked && (
        <span className="detail-checkbox-check" aria-hidden="true">
          <svg
            width={14}
            height={14}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.5 8.5L6.5 11.5L12.5 5.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <span>Ya</span>
    </div>
  );

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

        <div className="row mb-3">
          <div className="col-md-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>
                  Urutkan: <span>*</span>
                </label>
                <DropdownSelect
                  options={["Terbaru", "Terlama"]}
                  selectedValue={filters.sort}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, sort: value }))
                  }
                  addtionalParentClass=" "
                />
              </fieldset>
            </form>
          </div>
          <div className="col-md-9">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>
                  Cari Properti: <span>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari berdasarkan judul..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
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
            <strong>📌 Kebijakan Platform: </strong> Upload listing properti{" "}
            <u>GRATIS 100%</u>. Namun, jika properti berhasil <u>terjual</u>,
            akan dikenakan komisi admin sebesar{" "}
            <strong>2.5% dari harga jual</strong>.
          </div>
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
                      <th>Status</th>
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
                            {formatPriceDisplay(item)}
                          </span>
                        </td>
                        <td>{getStatusBadge(item)}</td>
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

        <div className="footer-dashboard">
          <p>
            © {new Date().getFullYear()} DIPROPERTI REAL ESTATE. All rights
            reserved.
          </p>
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

      <div
        className={`overlay-dashboard ${showDetailModal ? " show" : ""}`}
        onClick={closeDetail}
      />

      {showDetailModal && activeSubmission && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
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
              <div
                className="modal-body modal-body-wide"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <div className="alert alert-warning" role="alert">
                  Detail pengajuan berikut bersifat read-only. Pastikan data
                  sudah benar sebelum menyetujui.
                </div>
                <form
                  className="modal-form-spacing"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="row g-3">
                    {/* INFORMASI DASAR */}
                    <div className="col-12">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Informasi Dasar
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Judul</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.title)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Harga (IDR)</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={formatPriceDisplay(activeSubmission)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Tipe</label>
                        <div
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          <DropdownSelect
                            options={[val(activeSubmission.type)]}
                            selectedValue={val(activeSubmission.type)}
                            onChange={() => {}}
                          />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Tipe Bangunan</label>
                        <input
                          type="text"
                          name="building_type"
                          className="form-control bg-gray-100"
                          value={getBuildingTypeDisplay(activeSubmission)}
                          readOnly
                          placeholder={
                            activeSubmission.type === "tanah"
                              ? "Otomatis: Luas Tanah"
                              : "Otomatis: Luas Bangunan / Luas Tanah"
                          }
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Status</label>
                        <div
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          <DropdownSelect
                            options={[
                              val(getSubmissionStatus(activeSubmission)),
                            ]}
                            selectedValue={val(
                              getSubmissionStatus(activeSubmission),
                            )}
                            onChange={() => {}}
                          />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Tipe Listing</label>
                        <div
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          <DropdownSelect
                            options={[val(activeSubmission.listing_type)]}
                            selectedValue={val(activeSubmission.listing_type)}
                            onChange={() => {}}
                          />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Kota</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.city)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Kecamatan</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.kecamatan)}
                          readOnly
                        />
                      </fieldset>
                    </div>

                    {activeSubmission.certificate_status && (
                      <>
                        <div className="col-md-6">
                          <fieldset className="box-fieldset">
                            <label>Status Sertifikat</label>
                            <div
                              style={{
                                pointerEvents: "none",
                                userSelect: "none",
                              }}
                            >
                              <DropdownSelect
                                options={[
                                  val(activeSubmission.certificate_status),
                                ]}
                                selectedValue={val(
                                  activeSubmission.certificate_status,
                                )}
                                onChange={() => {}}
                              />
                            </div>
                          </fieldset>
                        </div>
                        <div className="col-md-6">
                          <fieldset className="box-fieldset">
                            <label>Jenis Sertifikat</label>
                            <div
                              style={{
                                pointerEvents: "none",
                                userSelect: "none",
                              }}
                            >
                              <DropdownSelect
                                options={[
                                  val(activeSubmission.certificate_type),
                                ]}
                                selectedValue={val(
                                  activeSubmission.certificate_type,
                                )}
                                onChange={() => {}}
                              />
                            </div>
                          </fieldset>
                        </div>
                      </>
                    )}

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Deskripsi</label>
                        <textarea
                          className="textarea bg-gray-100"
                          rows={3}
                          value={val(activeSubmission.description)}
                          readOnly
                        />
                      </fieldset>
                    </div>

                    {/* LOKASI & TRACKING MAPS */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Lokasi & Tracking Maps
                      </h6>
                    </div>
                    <div className="col-md-8">
                      <fieldset className="box-fieldset">
                        <label>Alamat Lengkap</label>
                        <textarea
                          className="textarea bg-gray-100"
                          rows={3}
                          value={val(activeSubmission.address)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Koordinat</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={getLocationInfo(activeSubmission).coordinatesLabel}
                          readOnly
                        />
                      </fieldset>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {getLocationInfo(activeSubmission).mapsUrl ? (
                          <>
                            <a
                              href={getLocationInfo(activeSubmission).mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="tf-btn bg-color-primary pd-23"
                            >
                              Buka Maps
                            </a>
                            <a
                              href={getLocationInfo(activeSubmission).directionsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="tf-btn style-border pd-23"
                            >
                              Rute ke Lokasi
                            </a>
                          </>
                        ) : (
                          <span className="text-muted">
                            Lokasi maps belum dikirim oleh pengaju.
                          </span>
                        )}
                      </div>
                    </div>
                    {getLocationInfo(activeSubmission).embedUrl && (
                      <div className="col-12">
                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            overflow: "hidden",
                            height: "320px",
                          }}
                        >
                          <iframe
                            title={`Peta lokasi ${activeSubmission.title}`}
                            src={getLocationInfo(activeSubmission).embedUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                        {!getLocationInfo(activeSubmission).hasCoordinates && (
                          <p className="text-muted mt-2 mb-0">
                            Preview maps memakai alamat karena koordinat belum tersedia.
                          </p>
                        )}
                      </div>
                    )}

                    {/* DETAIL PROPERTI */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Detail Properti
                      </h6>
                    </div>
                    <div className="col-md-3">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Carport</label>
                        <ReadOnlyDetailCheckbox
                          checked={activeSubmission.detail?.carport}
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Taman</label>
                        <ReadOnlyDetailCheckbox
                          checked={activeSubmission.detail?.garden}
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>One Gate System</label>
                        <ReadOnlyDetailCheckbox
                          checked={activeSubmission.detail?.one_gate_system}
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Keamanan 24 Jam</label>
                        <ReadOnlyDetailCheckbox
                          checked={activeSubmission.detail?.security_24jam}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Luas Tanah (m²)</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.detail?.luas_tanah)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-4">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Luas Bangunan (m²)</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.detail?.luas_bangunan)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-4">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Jumlah Lantai</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.detail?.floors, 0)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Kamar Tidur</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.detail?.bedrooms, 0)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Kamar Mandi</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.detail?.bathrooms, 0)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Dapur</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.detail?.kitchens, 0)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-3">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Ruang Tamu</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.detail?.living_rooms, 0)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Daya Listrik (VA)</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(
                            activeSubmission.detail?.electricity_capacity,
                          )}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Penyedia WiFi</label>
                        <input
                          type="text"
                          className="form-control bg-gray-100"
                          value={val(activeSubmission.detail?.wifi_provider)}
                          readOnly
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Sumber Air</label>
                        <div
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          <DropdownSelect
                            options={[val(activeSubmission.detail?.water)]}
                            selectedValue={val(activeSubmission.detail?.water)}
                            onChange={() => {}}
                          />
                        </div>
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset detail-fieldset">
                        <label>Jenis Listrik</label>
                        <div
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          <DropdownSelect
                            options={[
                              val(activeSubmission.detail?.listrik_type),
                            ]}
                            selectedValue={val(
                              activeSubmission.detail?.listrik_type,
                            )}
                            onChange={() => {}}
                          />
                        </div>
                      </fieldset>
                    </div>

                    {/* GAMBAR PROPERTI */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Gambar Properti
                      </h6>
                    </div>
                    <div className="col-12">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "18px",
                          width: "100%",
                        }}
                      >
                        {activeSubmission.images?.length > 0 ? (
                          activeSubmission.images.map((img, idx) => (
                            <div
                              key={idx}
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                overflow: "hidden",
                                background: "#fff",
                              }}
                            >
                              <div
                                style={{
                                  width: "100%",
                                  aspectRatio: "1 / 1",
                                  position: "relative",
                                  overflow: "hidden",
                                  background: "#f8fafc",
                                }}
                              >
                                <Image
                                  src={img.full_url}
                                  alt={`Preview ${idx + 1}`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                  style={{ objectFit: "cover" }}
                                />
                                <span
                                  style={{
                                    position: "absolute",
                                    left: "8px",
                                    bottom: "8px",
                                    background: "rgba(17, 24, 39, 0.78)",
                                    color: "#fff",
                                    borderRadius: "6px",
                                    padding: "4px 8px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {img.is_primary ? "Primary" : `Gambar ${idx + 1}`}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  padding: "12px",
                                }}
                              >
                                <a
                                  href={img.full_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="tf-btn style-border pd-23"
                                  style={{ flex: 1, justifyContent: "center" }}
                                >
                                  Lihat
                                </a>
                                {img.id && (
                                  <button
                                    type="button"
                                    className="tf-btn bg-color-primary pd-23"
                                    onClick={() =>
                                      handleDownload(
                                        `/admin/property-images/${img.id}/download`,
                                        getDocumentFilename(
                                          `${activeSubmission.title}-gambar-${idx + 1}`,
                                          img.full_url,
                                        ),
                                      )
                                    }
                                    style={{ flex: 1, justifyContent: "center" }}
                                  >
                                    Download
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 py-4 text-center">
                            Tidak ada gambar diunggah.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* DOKUMEN PENDUKUNG */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Dokumen Pendukung
                      </h6>
                    </div>
                    <div className="col-12">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "18px",
                          width: "100%",
                        }}
                      >
                        {documentItems(activeSubmission).some((doc) => doc.url) ? (
                          documentItems(activeSubmission).map((doc) => (
                            <div
                              key={doc.label}
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                overflow: "hidden",
                                background: "#fff",
                              }}
                            >
                              {doc.url ? (
                                <>
                                <div
                                  style={{
                                    width: "100%",
                                    aspectRatio: "1 / 1",
                                    position: "relative",
                                    overflow: "hidden",
                                    background: "#f8fafc",
                                  }}
                                >
                                  {isImageDocument(doc.url) ? (
                                    <Image
                                      src={doc.url}
                                      alt={doc.label}
                                      fill
                                      sizes="(max-width: 768px) 100vw, 33vw"
                                      style={{ objectFit: "cover" }}
                                    />
                                  ) : (
                                    <div
                                      className="listing-image-placeholder"
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        padding: "16px",
                                      }}
                                    >
                                      <span style={{ fontSize: "28px" }}>PDF</span>
                                      <span>Lihat File</span>
                                    </div>
                                  )}
                                  <span
                                    style={{
                                      position: "absolute",
                                      left: "8px",
                                      bottom: "8px",
                                      background: "rgba(17, 24, 39, 0.78)",
                                      color: "#fff",
                                      borderRadius: "6px",
                                      padding: "4px 8px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {doc.label}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    padding: "12px",
                                  }}
                                >
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="tf-btn style-border pd-23"
                                    style={{ flex: 1, justifyContent: "center" }}
                                  >
                                    Lihat
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDownload(
                                        doc.downloadUrl,
                                        getDocumentFilename(doc.label, doc.url),
                                      )
                                    }
                                    className="tf-btn bg-color-primary pd-23"
                                    style={{ flex: 1, justifyContent: "center" }}
                                  >
                                    Download
                                  </button>
                                </div>
                                </>
                              ) : (
                                <div
                                  className="listing-image-placeholder"
                                  style={{
                                    width: "100%",
                                    aspectRatio: "1 / 1",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "16px",
                                  }}
                                >
                                  {doc.label} belum diunggah
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 py-4 text-center">
                            Tidak ada dokumen pendukung diunggah.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-top">
                {canActOnSubmission(activeSubmission) ? (
                  <>
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
                      <span>Setujui & Publikasikan</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-muted me-auto">
                      Pengajuan ini sudah final dan hanya dapat dilihat. Kelola perubahan atau penghapusan melalui menu Kelola Properti.
                    </span>
                    <button
                      type="button"
                      className="tf-btn style-border pd-23"
                      onClick={closeDetail}
                    >
                      Tutup
                    </button>
                  </>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
