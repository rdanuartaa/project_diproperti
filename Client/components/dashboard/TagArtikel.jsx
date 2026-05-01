"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import DropdownSelect from "../common/DropdownSelect";
import SuccessModal from "../common/SuccesModal";
import ConfirmModal from "../common/ConfirmModal";
import AttentionModal from "../common/AttentionModal";

const emptyForm = {
  name: "",
};

export default function TagArtikel() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [attentionMessage, setAttentionMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // 🔥 NEW (pagination)
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const activeTitle = useMemo(
    () => activeTag?.name || "Selected Tag",
    [activeTag],
  );

  // 🔹 Fetch tags dari API
  const fetchTags = async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== "All") params.status = statusFilter;

      const response = await api.get("/admin/tags", { params });

      setTags(response.data.data || []);
      setPagination(response.data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      alert("❌ Gagal mengambil data tag");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Debounce fetch
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchTags();
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery, statusFilter, currentPage]);

  // 🔥 Reset page saat search/filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const openCreate = () => {
    setFormData(emptyForm);
    setErrors({});
    setIsCreateOpen(true);
  };

  const openEdit = (tag) => {
    setActiveTag(tag);
    setFormData({
      name: tag.name ?? "",
    });
    setErrors({});
    setIsEditOpen(true);
  };

  const openDelete = (tag) => {
    setActiveTag(tag);
    setShowConfirmModal(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setActiveTag(null);
    setFormData(emptyForm);
    setErrors({});
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrors({});

    try {
      await api.post("/admin/tags", formData);
      closeAll();
      showSuccess("Tag berhasil ditambahkan");
      await fetchTags();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        const errorMessage = formatFieldErrors(error.response.data.errors);
        showAttention(errorMessage || "Validasi gagal.");
      } else {
        showAttention("Gagal menambahkan tag.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!activeTag?.id) return;

    setFormLoading(true);
    setErrors({});

    try {
      await api.put(`/admin/tags/${activeTag.id}`, formData);
      closeAll();
      showSuccess("Tag berhasil diperbarui");
      await fetchTags();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        const errorMessage = formatFieldErrors(error.response.data.errors);
        showAttention(errorMessage || "Validasi gagal.");
      } else {
        showAttention("Gagal memperbarui tag.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeTag?.id) return;

    setIsDeleting(true);

    try {
      await api.delete(`/admin/tags/${activeTag.id}`);
      setShowConfirmModal(false);
      closeAll();
      showSuccess("Tag berhasil dihapus");
      await fetchTags();
    } catch (error) {
      if (error.response?.status === 409) {
        showAttention(error.response.data.message || "Tidak bisa menghapus tag.");
      } else {
        showAttention("Gagal menghapus tag.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const slugify = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  return (
    <div className="main-content w-100">
      <div className="main-content-inner wrap-dashboard-content">
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message={successMessage}
        />

        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleDelete}
          title="Konfirmasi Hapus"
          message={`Apakah kamu yakin ingin menghapus tag "${activeTitle}"?`}
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

        {/* Filter & Search */}
        <div className="row mb-3">
          <div className="col-md-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>Status:<span>*</span></label>
                <DropdownSelect
                  options={["All", "active"]}
                  selectedValue={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                  }}
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
                  className="form-control"
                  placeholder="Search by tag name..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </fieldset>
            </form>
          </div>
        </div>

        {/* Tag List */}
        <div className="widget-box-2 wd-listing mt-20">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-12">
            <h3 className="title">Tag Artikel</h3>
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
              <span>Tambah Tag</span>
            </button>
          </div>

          <div className="wrap-table">
            <div className="table-responsive">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Memuat tag...</p>
                </div>
              ) : tags.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tags found. Click "Create Tag" to add one.
                </div>
              ) : (
                <table style={{ tableLayout: "fixed", width: "100%" }}>
                  <colgroup>
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "25%" }} />
                    <col style={{ width: "15%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.map((tag) => (
                      <tr key={tag.id} className="file-delete">
                        <td style={{ maxWidth: 0, paddingLeft: 0 }}>
                          <div
                            className="listing-box"
                            style={{ paddingLeft: 0 }}
                          >
                            <div className="content" style={{ paddingLeft: 0 }}>
                              <div className="title text-truncate">
                                {tag.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-gray-600">{tag.slug}</span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-500">
                            {formatDate(tag.updated_at)}
                          </span>
                        </td>
                        <td>
                          <ul className="list-action">
                            <li>
                              <a
                                className="item"
                                onClick={() => !formLoading && openEdit(tag)}
                                style={{ cursor: formLoading ? "not-allowed" : "pointer" }}
                              >
                                <svg
                                  width={16}
                                  height={16}
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M11.2413 2.9915L12.366 1.86616C12.6005 1.63171 12.9184 1.5 13.25 1.5C13.5816 1.5 13.8995 1.63171 14.134 1.86616C14.3685 2.10062 14.5002 2.4186 14.5002 2.75016C14.5002 3.08173 14.3685 3.39971 14.134 3.63416L4.55467 13.2135C4.20222 13.5657 3.76758 13.8246 3.29 13.9668L1.5 14.5002L2.03333 12.7102C2.17552 12.2326 2.43442 11.7979 2.78667 11.4455L11.242 2.9915H11.2413ZM11.2413 2.9915L13 4.75016"
                                    stroke="#A3ABB0"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Edit
                              </a>
                            </li>
                            <li>
                              <a
                                className="remove-file item"
                                onClick={() => !formLoading && openDelete(tag)}
                                style={{ cursor: formLoading ? "not-allowed" : "pointer" }}
                              >
                                <svg
                                  width={16}
                                  height={16}
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M9.82667 6.00035L9.596 12.0003M6.404 12.0003L6.17333 6.00035M12.8187 3.86035C13.0467 3.89501 13.2733 3.93168 13.5 3.97101M12.8187 3.86035L12.1067 13.1157C12.0776 13.4925 11.9074 13.8445 11.63 14.1012C11.3527 14.3579 10.9886 14.5005 10.6107 14.5003H5.38933C5.0114 14.5005 4.64735 14.3579 4.36999 14.1012C4.09262 13.8445 3.92239 13.4925 3.89333 13.1157L3.18133 3.86035M12.8187 3.86035C12.0492 3.74403 11.2758 3.65574 10.5 3.59568M3.18133 3.86035C2.95333 3.89435 2.72667 3.93101 2.5 3.97035M3.18133 3.86035C3.95076 3.74403 4.72416 3.65575 5.5 3.59568M10.5 3.59568V2.98501C10.5 2.19835 9.89333 1.54235 9.10667 1.51768C8.36908 1.49411 7.63092 1.49411 6.89333 1.51768C6.10667 1.54235 5.5 2.19901 5.5 2.98501V3.59568M10.5 3.59568C8.83581 3.46707 7.16419 3.46707 5.5 3.59568"
                                    stroke="#A3ABB0"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
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

            {/* Pagination - Static untuk saat ini */}
            <ul className="wg-pagination">
              <li className="arrow">
                <a href="#">
                  <i className="icon-arrow-left" />
                </a>
              </li>
              <li className="active">
                <a href="#">1</a>
              </li>
              <li className="arrow">
                <a href="#">
                  <i className="icon-arrow-right" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-dashboard">
          <p>Copyright (c) {new Date().getFullYear()} Propty</p>
          <ul className="list">
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Terms</a>
            </li>
            <li>
              <a href="#">Support</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`overlay-dashboard ${isCreateOpen || isEditOpen ? "show" : ""}`}
        onClick={closeAll}
      />

      {/* CREATE/EDIT MODAL */}
      {(isCreateOpen || isEditOpen) && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header modal-header-title">
                <h5 className="modal-title">
                  {isCreateOpen && "Tambah Tag"}
                  {isEditOpen && `Ubah: ${activeTitle}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAll}
                  aria-label="Close"
                />
              </div>

              <div
                className="modal-body modal-body-wide"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <form
                  className="modal-form-spacing"
                  onSubmit={isCreateOpen ? handleCreate : handleUpdate}
                >
                  <div className="row g-3">
                    <div className="col-12">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Tag Information
                      </h6>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          className={`form-control ${errors.name ? "border-red-500" : ""}`}
                          placeholder="Contoh: tips-properti"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          autoFocus
                        />
                        {errors.name && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.name[0]}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Slug akan digenerate otomatis:{" "}
                          <strong>
                            {slugify(formData.name) || "contoh-slug"}
                          </strong>
                        </p>
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
