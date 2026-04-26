"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

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
    setIsDeleteOpen(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setActiveTag(null);
    setFormData(emptyForm);
    setErrors({});
  };

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
      alert("✅ Tag created successfully!");
      await fetchTags();
      closeAll();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("❌ Failed to create tag");
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
      alert("✅ Tag updated successfully!");
      await fetchTags();
      closeAll();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("❌ Failed to update tag");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeTag?.id) return;

    setFormLoading(true);

    try {
      await api.delete(`/admin/tags/${activeTag.id}`);
      alert("✅ Tag deleted successfully!");
      await fetchTags();
      closeAll();
    } catch (error) {
      if (error.response?.status === 409) {
        alert(error.response.data.message);
      } else {
        alert("❌ Failed to delete tag");
      }
    } finally {
      setFormLoading(false);
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
        {/* Filter & Search */}
        <div className="row">
          <div className="col-md-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>
                  Status:<span>*</span>
                </label>
                <select
                  className="form-control"
                  value={statusFilter}
                  onChange={handleFilterChange}
                >
                  <option>All</option>
                  <option>active</option>
                </select>
              </fieldset>
            </form>
          </div>
          <div className="col-md-9">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>
                  Search:<span>*</span>
                </label>
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
              className="tf-btn style-border pd-23"
              onClick={openCreate}
              disabled={formLoading}
            >
              Create Tag
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
                              <button
                                type="button"
                                className="item"
                                onClick={() => openEdit(tag)}
                                disabled={formLoading}
                                title="Edit"
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
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                className="remove-file item"
                                onClick={() => openDelete(tag)}
                                disabled={formLoading}
                                title="Delete"
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
                              </button>
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
        className={`overlay-dashboard ${isCreateOpen || isEditOpen || isDeleteOpen ? "show" : ""}`}
        onClick={closeAll}
      />

      {/* DELETE MODAL */}
      {isDeleteOpen && (
        <div
          className="modal show d-block"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={closeAll}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              maxWidth: "500px",
              width: "100%",
              margin: "0 auto",
              pointerEvents: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content"
              style={{
                pointerEvents: "auto",
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
            >
              <div
                className="modal-header border-0 pb-0"
                style={{ padding: "1.5rem 1.5rem 0" }}
              >
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAll}
                  style={{ position: "absolute", right: "1rem", top: "1rem" }}
                  aria-label="Close"
                />
              </div>

              <div
                className="modal-body text-center pt-0 pb-4"
                style={{ padding: "0 1.5rem 1.5rem" }}
              >
                <div className="mb-4">
                  <div
                    className="mx-auto d-flex align-items-center justify-content-center"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                    }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>

                <h4 className="fw-bold mb-2" style={{ color: "#1f2937" }}>
                  Delete Tag?
                </h4>
                <p
                  className="text-gray-600 mb-1"
                  style={{ fontSize: "1rem", lineHeight: "1.5" }}
                >
                  Are you sure you want to delete{" "}
                  <strong style={{ color: "#111827" }}>{activeTitle}</strong>?
                </p>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  This action cannot be undone.
                </p>
              </div>

              <div
                className="modal-footer border-0 justify-content-center gap-3"
                style={{ padding: "0 1.5rem 1.5rem" }}
              >
                <button
                  type="button"
                  className="btn btn-light px-4 py-2"
                  onClick={closeAll}
                  disabled={formLoading}
                  style={{
                    borderRadius: "8px",
                    fontWeight: "500",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4 py-2"
                  onClick={handleDelete}
                  disabled={formLoading}
                  style={{
                    borderRadius: "8px",
                    fontWeight: "500",
                    backgroundColor: "#dc2626",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {formLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        style={{ width: "1rem", height: "1rem" }}
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M6.854 7.146a.5.5 0 1 0-.708.708L7.293 9l-1.147 1.146a.5.5 0 0 0 .708.708L8 9.707l1.146 1.147a.5.5 0 0 0 .708-.708L8.707 9l1.147-1.146a.5.5 0 0 0-.708-.708L8 8.293 6.854 7.146z" />
                        <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {(isCreateOpen || isEditOpen) && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header modal-header-title">
                <h5 className="modal-title">
                  {isCreateOpen && "Create Tag"}
                  {isEditOpen && `Edit: ${activeTitle}`}
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

                  <div className="d-flex justify-content-end gap-12 mt-20">
                    <button
                      type="button"
                      className="tf-btn style-border"
                      onClick={closeAll}
                      disabled={formLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="tf-btn"
                      disabled={formLoading}
                    >
                      {formLoading
                        ? isCreateOpen
                          ? "Creating..."
                          : "Updating..."
                        : isCreateOpen
                          ? "Create"
                          : "Update"}
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
