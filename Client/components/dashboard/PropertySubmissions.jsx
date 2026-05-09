"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import SuccessModal from "@/components/common/SuccesModal";
import AttentionModal from "@/components/common/AttentionModal";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function PropertySubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [attention, setAttention] = useState({ open: false, message: "" });
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/property-submissions");
      setSubmissions(response.data.data || response.data || []);
    } catch (error) {
      setAttention({ open: true, message: "Gagal memuat pengajuan properti." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const approveSubmission = async (submission) => {
    try {
      setIsApproving(true);
      await api.put(`/admin/property-submissions/${submission.id}/approve`);
      setSuccessMessage("Pengajuan properti disetujui");
      setShowSuccess(true);
      fetchSubmissions();
    } catch (error) {
      setAttention({ open: true, message: "Gagal menyetujui pengajuan." });
    } finally {
      setIsApproving(false);
    }
  };

  const confirmDelete = (submission) => {
    setActiveSubmission(submission);
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    if (!activeSubmission) return;

    try {
      setIsDeleting(true);
      await api.delete(`/admin/properties/${activeSubmission.id}`);
      setSuccessMessage("Pengajuan properti dihapus");
      setShowSuccess(true);
      setShowConfirm(false);
      fetchSubmissions();
    } catch (error) {
      setAttention({ open: true, message: "Gagal menghapus pengajuan." });
    } finally {
      setIsDeleting(false);
      setActiveSubmission(null);
    }
  };

  if (loading) {
    return (
      <div className="main-content w-100">
        <div className="main-content-inner wrap-dashboard-content">
          <p style={{ padding: "32px 0" }}>Memuat data pengajuan...</p>
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
          title="Konfirmasi Hapus"
          message={
            activeSubmission
              ? `Hapus pengajuan "${activeSubmission.title}"?`
              : "Hapus pengajuan ini?"
          }
          confirmText="Hapus"
          cancelText="Batal"
          isLoading={isDeleting}
        />

        <div style={{ marginBottom: "24px" }}>
          <h3 className="fw-7">Pengajuan Properti</h3>
          <p style={{ color: "#6b7280" }}>
            Daftar properti yang diajukan user dan menunggu verifikasi admin.
          </p>
        </div>

        {submissions.length === 0 ? (
          <p>Tidak ada pengajuan saat ini.</p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {submissions.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "grid",
                  gridTemplateColumns: "120px 1fr auto",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <div style={{ position: "relative", width: "120px", height: "90px" }}>
                  <Image
                    src={item.images?.[0]?.full_url || "/images/section/compare-1.jpg"}
                    alt={item.title}
                    fill
                    sizes="120px"
                    style={{ objectFit: "cover", borderRadius: "8px" }}
                  />
                </div>

                <div>
                  <h5 style={{ margin: 0 }}>{item.title}</h5>
                  <p style={{ margin: "4px 0", color: "#6b7280" }}>
                    {item.kecamatan}, {item.city}
                  </p>
                  <p style={{ margin: "4px 0", color: "#6b7280" }}>
                    Pengaju: {item.user?.name || "-"}
                  </p>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {item.certificate_file_url && (
                      <a href={item.certificate_file_url} target="_blank" rel="noreferrer">
                        Sertifikat
                      </a>
                    )}
                    {item.electric_bill_file_url && (
                      <a href={item.electric_bill_file_url} target="_blank" rel="noreferrer">
                        Tagihan Listrik
                      </a>
                    )}
                    {item.water_bill_file_url && (
                      <a href={item.water_bill_file_url} target="_blank" rel="noreferrer">
                        Tagihan Air
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    type="button"
                    className="tf-btn style-border pd-23"
                    onClick={() => approveSubmission(item)}
                    disabled={isApproving}
                  >
                    Setujui
                  </button>
                  <button
                    type="button"
                    className="tf-btn style-border pd-23 btn-cancel-danger"
                    onClick={() => confirmDelete(item)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
