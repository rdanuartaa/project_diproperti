"use client";
import React, { useMemo, useState, useEffect } from "react";
import api from "@/lib/api";
import DropdownSelect from "../common/DropdownSelect";
import SuccessModal from "../common/SuccesModal";
import ConfirmModal from "../common/ConfirmModal";
import AttentionModal from "../common/AttentionModal";

const emptyForm = {
  question: "",
  answer: "",
  topic: "umum",
  status: "draft",
};

export default function Faq() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [filters, setFilters] = useState({ status: "All", search: "" });
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [attentionMessage, setAttentionMessage] = useState("");

  // Fetch FAQs from API
  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status !== "All") params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const { data } = await api.get(`/admin/faqs?${params}`);

      if (data.success) {
        setFaqs(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [filters]);

  const activeTitle = useMemo(() => activeFaq?.question || "Selected FAQ", [activeFaq]);

  const openCreate = () => {
    setFormData(emptyForm);
    setIsCreateOpen(true);
  };

  const openEdit = (faq) => {
    setActiveFaq(faq);
    setFormData({
      question: faq.question ?? "",
      answer: faq.answer ?? "",
      topic: faq.topic ?? "umum",
      status: faq.status ?? "draft",
    });
    setIsEditOpen(true);
  };

  const openDelete = (faq) => {
    setActiveFaq(faq);
    setShowConfirmModal(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setActiveFaq(null);
    setFormData(emptyForm);
    // ✅ Jangan tutup confirm modal di sini, biarkan handleDelete yang menutup
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2500);
  };

  const showAttention = (message) => {
    setAttentionMessage(message);
    setShowAttentionModal(true);
  };

  const formatFieldErrors = (fieldErrors) =>
    Object.entries(fieldErrors || {})
      .map(([field, messages]) => `${field}: ${messages?.[0] || "Invalid"}`)
      .join(" | ");

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const { data } = await api.post('/admin/faqs', formData);
      
      if (data.success) {
        setFaqs((prev) => [data.data, ...prev]);
        closeAll();
        showSuccess("FAQ berhasil ditambahkan");
      }
    } catch (error) {
      console.error("Create failed:", error);
      if (error.response?.status === 422) {
        const errorMessage = formatFieldErrors(error.response.data.errors);
        showAttention(errorMessage || "Validasi gagal.");
      } else {
        showAttention("Gagal menambahkan FAQ.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!activeFaq?.id) return;
    setFormLoading(true);
    try {
      const { data } = await api.put(`/admin/faqs/${activeFaq.id}`, formData);
      
      if (data.success) {
        setFaqs((prev) =>
          prev.map((item) =>
            item.id === activeFaq.id ? { ...item, ...formData } : item
          )
        );
        closeAll();
        showSuccess("FAQ berhasil diperbarui");
      }
    } catch (error) {
      console.error("Update failed:", error);
      if (error.response?.status === 422) {
        const errorMessage = formatFieldErrors(error.response.data.errors);
        showAttention(errorMessage || "Validasi gagal.");
      } else {
        showAttention("Gagal memperbarui FAQ.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeFaq?.id) return;
    
    setIsDeleting(true);
    try {
      const { data } = await api.delete(`/admin/faqs/${activeFaq.id}`);
      
      if (data.success) {
        setFaqs((prev) => prev.filter((item) => item.id !== activeFaq.id));
        setShowConfirmModal(false); // ✅ Tutup confirm modal setelah delete
        closeAll();
        showSuccess("FAQ berhasil dihapus");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      showAttention("Gagal menghapus FAQ.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="main-content w-100">
      <div className="main-content-inner wrap-dashboard-content">
        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message={successMessage}
        />
        
        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleDelete}
          title="Konfirmasi Hapus"
          message={`Apakah kamu yakin ingin menghapus FAQ "${activeTitle}"?`}
          confirmText="Hapus"
          cancelText="Batal"
          isLoading={isDeleting}
        />

        <AttentionModal
          isOpen={showAttentionModal}
          onClose={() => setShowAttentionModal(false)}
          title="Perhatian"
          message={attentionMessage}
        />

        {/* Filters */}
        <div className="row mb-3">
          <div className="col-md-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>Status:<span>*</span></label>
                <DropdownSelect
                  options={["All", "published", "draft"]}
                  selectedValue={filters.status}
                  onChange={(value) => {
                    setFilters((prev) => ({ ...prev, status: value }));
                  }}
                  name="status"
                  addtionalParentClass=""
                />
              </fieldset>
            </form>
          </div>
          <div className="col-md-9">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>Search:<span>*</span></label>
                <input
                  type="text"
                  name="search"
                  className="form-control"
                  placeholder="Search by question..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, search: e.target.value }));
                  }}
                />
              </fieldset>
            </form>
          </div>
        </div>

        {/* Table Section */}
        <div className="widget-box-2 wd-listing mt-20">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-12">
            <h3 className="title">FAQ</h3>
            <button
              type="button"
              className={`tf-btn style-border pd-23${
                formLoading ? " is-loading" : ""
              }`}
              onClick={openCreate}
              disabled={formLoading}
            >
              {formLoading && (
                <span className="btn-spinner" aria-hidden="true" />
              )}
              <span>Tambah FAQ</span>
            </button>
          </div>

          <div className="tf-new-listing w-100">
            <div className="new-listing wrap-table">
              <div className="table-content">
                <div className="wrap-listing table-responsive">
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : faqs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No FAQ found. Click "Create FAQ" to add one.
                    </div>
                  ) : (
                    <table className="table-save-search">
                      <thead>
                        <tr>
                          <th className="fw-6">Question</th>
                          <th className="fw-6">Topic</th>
                          <th className="fw-6">Status</th>
                          <th className="fw-6">Updated</th>
                          <th className="fw-6">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faqs.map((faq) => (
                          <tr key={faq.id} className="file-delete">
                            <td>
                              <div className="listing-box">
                                <div className="content">
                                  <div className="title fw-6">{faq.question}</div>
                                  <div className="text-date text-muted">
                                    {faq.answer?.substring(0, 80)}
                                    {faq.answer?.length > 80 ? '...' : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="text-capitalize">{faq.topic}</span>
                            </td>
                            <td>
                              <span className={`px-3 py-1 text-xs rounded-full ${
                                faq.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {faq.status}
                              </span>
                            </td>
                            <td>
                              <span>{formatDate(faq.updated_at)}</span>
                            </td>
                            <td>
                              <ul className="list-action">
                                <li>
                                  <a 
                                    className="item" 
                                    onClick={() => openEdit(faq)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M11.2413 2.9915L12.366 1.86616C12.6005 1.63171 12.9184 1.5 13.25 1.5C13.5816 1.5 13.8995 1.63171 14.134 1.86616C14.3685 2.10062 14.5002 2.4186 14.5002 2.75016C14.5002 3.08173 14.3685 3.39971 14.134 3.63416L4.55467 13.2135C4.20222 13.5657 3.76758 13.8246 3.29 13.9668L1.5 14.5002L2.03333 12.7102C2.17552 12.2326 2.43442 11.7979 2.78667 11.4455L11.242 2.9915H11.2413ZM11.2413 2.9915L13 4.75016" stroke="#A3ABB0" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Edit
                                  </a>
                                </li>
                                <li>
                                  <a 
                                    className="remove-file item" 
                                    onClick={() => openDelete(faq)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M9.82667 6.00035L9.596 12.0003M6.404 12.0003L6.17333 6.00035M12.8187 3.86035C13.0467 3.89501 13.2733 3.93168 13.5 3.97101M12.8187 3.86035L12.1067 13.1157C12.0776 13.4925 11.9074 13.8445 11.63 14.1012C11.3527 14.3579 10.9886 14.5005 10.6107 14.5003H5.38933C5.0114 14.5005 4.64735 14.3579 4.36999 14.1012C4.09262 13.8445 3.92239 13.4925 3.89333 13.1157L3.18133 3.86035M12.8187 3.86035C12.0492 3.74403 11.2758 3.65574 10.5 3.59568M3.18133 3.86035C2.95333 3.89435 2.72667 3.93101 2.5 3.97035M3.18133 3.86035C3.95076 3.74403 4.72416 3.65575 5.5 3.59568M10.5 3.59568V2.98501C10.5 2.19835 9.89333 1.54235 9.10667 1.51768C8.36908 1.49411 7.63092 1.49411 6.89333 1.51768C6.10667 1.54235 5.5 2.19901 5.5 2.98501V3.59568M10.5 3.59568C8.83581 3.46707 7.16419 3.46707 5.5 3.59568" stroke="#A3ABB0" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Delete
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
          </div>
        </div>

        {/* Footer */}
        <div className="footer-dashboard">
          <p>Copyright (c) {new Date().getFullYear()} Propty</p>
          <ul className="list">
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Support</a></li>
          </ul>
        </div>
      </div>

      {/* ✅ Overlay - HANYA untuk Create/Edit modal */}
      {(isCreateOpen || isEditOpen) && (
        <div className={`overlay-dashboard show`} onClick={closeAll} />
      )}

      {/* ✅ Create/Edit Modal */}
      {(isCreateOpen || isEditOpen) && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header modal-header-title">
                <h5 className="modal-title">
                  {isCreateOpen ? "Tambah FAQ" : `Ubah: ${activeTitle}`}
                </h5>
                <button type="button" className="btn-close" onClick={closeAll} aria-label="Close" />
              </div>
              <div className="modal-body modal-body-wide" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <form className="modal-form-spacing" onSubmit={isCreateOpen ? handleCreate : handleUpdate}>
                  <div className="row g-3">
                    <div className="col-12">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">FAQ Information</h6>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Question<span>*</span></label>
                        <input
                          type="text"
                          name="question"
                          className="form-control"
                          placeholder="Tulis pertanyaan FAQ"
                          value={formData.question}
                          onChange={handleChange}
                          required
                        />
                      </fieldset>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Answer<span>*</span></label>
                        <textarea
                          name="answer"
                          className="textarea"
                          rows={4}
                          placeholder="Tulis jawaban FAQ"
                          value={formData.answer}
                          onChange={handleChange}
                          required
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Topic<span>*</span></label>
                        <DropdownSelect
                          options={["properti", "kpr", "platform", "umum"]}
                          selectedValue={formData.topic}
                          onChange={(value) => {
                            setFormData((prev) => ({ ...prev, topic: value }));
                          }}
                          name="topic"
                          addtionalParentClass=""
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Status<span>*</span></label>
                        <DropdownSelect
                          options={["draft", "published"]}
                          selectedValue={formData.status}
                          onChange={(value) => {
                            setFormData((prev) => ({ ...prev, status: value }));
                          }}
                          name="status"
                          addtionalParentClass=""
                        />
                      </fieldset>
                    </div>
                  </div>

                  <div className="modal-footer border-top">
                    <button
                      type="button"
                      className="tf-btn style-border pd-23 btn-cancel-danger"
                      onClick={closeAll}
                      disabled={formLoading}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className={`tf-btn style-border pd-23${
                        formLoading ? " is-loading" : ""
                      }`}
                      disabled={formLoading}
                    >
                      {formLoading && (
                        <span className="btn-spinner" aria-hidden="true" />
                      )}
                      <span>
                        {formLoading
                          ? isCreateOpen
                            ? "Menambah..."
                            : "Menyimpan..."
                          : isCreateOpen
                            ? "Tambah"
                            : "Simpan"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}