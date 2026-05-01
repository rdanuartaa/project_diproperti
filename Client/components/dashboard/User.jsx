"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import api from "@/lib/api"; // ✅ Instance api sudah ada interceptor auth_token
import DropdownSelect from "../common/DropdownSelect";
import SuccessModal from "../common/SuccesModal";
import ConfirmModal from "../common/ConfirmModal";
import AttentionModal from "../common/AttentionModal";

const emptyForm = { role: "user" };

export default function User() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [filters, setFilters] = useState({ role: "All", search: "" });
  const [formLoading, setFormLoading] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [attentionMessage, setAttentionMessage] = useState("");

  // ✅ Fetch users from API - FIX: Hapus manual token & gunakan relative URL
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.role !== "All") params.append("role", filters.role);
      if (filters.search) params.append("search", filters.search);

      // ✅ FIX 1: Gunakan relative URL (api instance sudah punya baseURL)
      // ✅ FIX 2: Hapus manual token (interceptor auto-attach 'auth_token')
      const { data } = await api.get(`/admin/users?${params}`);

      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const activeTitle = useMemo(
    () => activeUser?.name || "Selected User",
    [activeUser],
  );

  const isEditDirty = useMemo(() => {
    if (!activeUser) return false;
    const currentRole = activeUser.role ?? "user";
    return formData.role !== currentRole;
  }, [activeUser, formData.role]);

  const openEdit = (user) => {
    setActiveUser(user);
    setFormData({ role: user.role ?? "user" });
    setIsEditOpen(true);
  };

  const openDelete = (user) => {
    setActiveUser(user);
    setShowConfirmModal(true);
  };

  const closeAll = () => {
    setIsEditOpen(false);
    setActiveUser(null);
    setFormData(emptyForm);
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

  // ✅ Handler untuk input/select biasa (menerima event)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ FIX 3: Handler khusus untuk DropdownSelect (menerima value langsung)
  const handleDropdownFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ FIX 4: Hapus manual token, gunakan api instance
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!activeUser?.id || !isEditDirty) return;

    try {
      setFormLoading(true);
      // ✅ Relative URL + token auto-attach via interceptor
      const { data } = await api.put(
        `/admin/users/${activeUser.id}`,
        { role: formData.role }
      );

      if (data.success) {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === activeUser.id ? { ...item, role: formData.role } : item,
          ),
        );
        closeAll();
        showSuccess("Role user berhasil diperbarui");
      }
    } catch (error) {
      console.error("Update failed:", error);
      showAttention("Gagal memperbarui role user.");
    } finally {
      setFormLoading(false);
    }
  };

  // ✅ FIX 5: Hapus manual token, gunakan api instance
  const handleDelete = async () => {
    if (!activeUser?.id) return;

    setIsDeleting(true);
    try {
      const { data } = await api.delete(`/admin/users/${activeUser.id}`);

      if (data.success) {
        setUsers((prev) => prev.filter((item) => item.id !== activeUser.id));
        setShowConfirmModal(false);
        closeAll();
        showSuccess("User berhasil dihapus");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      showAttention("Gagal menghapus user.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ Handler untuk input text search (menerima event)
  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  // ⚠️ HTML/JSX DI BAWAH INI TIDAK DIUBAH SAMA SEKALI ⚠️
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
          message={`Apakah kamu yakin ingin menghapus user "${activeTitle}"?`}
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
                <label>
                  Role:<span>*</span>
                </label>
                {/* ✅ FIX: Gunakan handler khusus + array of strings */}
                <DropdownSelect
                  options={["All", "admin", "user"]} 
                  selectedValue={filters.role} 
                  onChange={(selected) => {
                    handleDropdownFilterChange("role", selected);
                  }}
                  name="role"
                  addtionalParentClass=""
                />
              </fieldset>
            </form>
          </div>
          <div className="col-md-9">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>
                  Search:<span>*</span>
                </label>
                {/* ✅ FIX: Gunakan handler khusus untuk search */}
                <input
                  type="text"
                  name="search"
                  className="form-control"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={handleSearchChange}
                />
              </fieldset>
            </form>
          </div>
        </div>

        {/* Table */}
        {/* Table Section - Updated Style */}
        <div className="widget-box-2 wd-listing mt-20">
          <h3 className="title">Users</h3>

          <div className="tf-new-listing w-100">
            <div className="new-listing wrap-table">
              <div className="table-content">
                <div className="wrap-listing table-responsive">
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No users found.
                    </div>
                  ) : (
                    <table className="table-save-search">
                      <thead>
                        <tr>
                          <th className="fw-6">Avatar</th>
                          <th className="fw-6">Name</th>
                          <th className="fw-6">Email</th>
                          <th className="fw-6">Role</th>
                          <th className="fw-6">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="file-delete">
                            {/* Avatar */}
                            <td>
                              <div className="avatar-wrapper">
                                {user.avatar ? (
                                  <Image
                                    alt={user.name}
                                    src={user.avatar}
                                    width={50}
                                    height={50}
                                    className="avatar-circle"
                                  />
                                ) : (
                                  <div className="avatar-circle avatar-placeholder">
                                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Name */}
                            <td>
                              <span>{user.name}</span>
                            </td>

                            {/* Email */}
                            <td>
                              <span>{user.email}</span>
                            </td>

                            {/* Role Badge */}
                            <td>
                              <span
                                className={`px-3 py-1 text-xs rounded-full ${
                                  user.role === "admin"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>

                            {/* Actions */}
                            <td>
                              <ul className="list-action">
                                <li>
                                  <a
                                    className="item"
                                    onClick={() => openEdit(user)}
                                    style={{ cursor: "pointer" }}
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
                                    Edit Role
                                  </a>
                                </li>
                                <li>
                                  <a
                                    className="remove-file item"
                                    onClick={() => openDelete(user)}
                                    style={{ cursor: "pointer" }}
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
              </div>
            </div>
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
        className={`overlay-dashboard ${isEditOpen ? "show" : ""}`}
        onClick={closeAll}
      />

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header modal-header-title">
                <h5 className="modal-title">Edit Role: {activeTitle}</h5>
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
                <form className="modal-form-spacing" onSubmit={handleUpdate}>
                  <div className="row g-3">
                    <div className="col-12">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Role Settings
                      </h6>
                    </div>
                    <div className="col-md-12">
                      <fieldset className="box-fieldset">
                        <label>Role</label>
                        <DropdownSelect
                          options={["admin", "user"]}
                          selectedValue={formData.role}
                          onChange={(value) => {
                            setFormData((prev) => ({ ...prev, role: value }));
                          }}
                          name="role"
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
                      disabled={formLoading || !isEditDirty}
                    >
                      {formLoading && (
                        <span className="btn-spinner" aria-hidden="true" />
                      )}
                      <span>
                        {formLoading ? "Menyimpan..." : "Simpan"}
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