"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DropdownSelect from "../common/DropdownSelect";
import { api } from "@/lib/api";

export default function Properti() {
  // State untuk data & UI
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // State untuk modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState(null);

  // State untuk form
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    type: "rumah",
    listing_type: "jual",
    kecamatan: "",
    city: "Jember",
    certificate_type: "SHM",
    certificate_status: "lunas",
    status: "draft",
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
    // Untuk upload gambar
    newImages: [],
    existingImages: [],
    imagesToDelete: [],
  });

  const activeTitle = useMemo(
    () => activeProperty?.title || "Selected Property",
    [activeProperty],
  );
  useEffect(() => {
    console.log("🔄 Component mounted, fetching properties...");
    fetchProperties();
  }, []);
  // 🔹 Fetch properties dari API
  const fetchProperties = async () => {
    try {
      setLoading(true);
      console.log("📥 Fetching properties...");

      const response = await api.get("/properties");

      console.log("📦 Properties response:", response.data);

      // Handle berbagai format response
      const propertiesData = response.data?.data || response.data || [];

      setProperties(propertiesData);
      console.log(`✅ Loaded ${propertiesData.length} properties`);
    } catch (error) {
      console.error("❌ Failed to fetch properties:", error);

      // Jangan set loading false jika error, biarkan data lama tetap tampil
      if (error.response?.status === 401) {
        console.error("Authentication required");
      } else if (error.response?.status === 500) {
        console.error("Server error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // 🔹 Handle input change (termasuk nested detail & checkbox)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes("detail.")) {
      const detailKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        detail: {
          ...prev.detail,
          [detailKey]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // Clear error saat user mulai mengetik
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // 🔹 Handle image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.newImages.length > 10) {
      alert("Maksimal 10 gambar diperbolehkan");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...files],
    }));
  };

  // 🔹 Remove new image (belum diupload)
  const handleRemoveNewImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
  };

  // 🔹 Remove existing image (akan dihapus dari server)
  const handleRemoveExistingImage = async (imageId) => {
    try {
      await api.delete(`/property-images/${imageId}`);
      setFormData((prev) => ({
        ...prev,
        existingImages: prev.existingImages.filter((img) => img.id !== imageId),
      }));
      alert("✅ Gambar berhasil dihapus");
    } catch (error) {
      alert("❌ Gagal menghapus gambar");
    }
  };

  // 🔹 Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      price: "",
      type: "rumah",
      listing_type: "jual",
      kecamatan: "",
      city: "Jember",
      certificate_type: "SHM",
      certificate_status: "lunas",
      status: "draft",
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
      existingImages: [],
      imagesToDelete: [],
    });
    setErrors({});
  };

  // 🔹 Open modal Create
  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  // 🔹 Open modal Edit
  const openEdit = (property) => {
    setActiveProperty(property);
    setFormData({
      title: property.title || "",
      price: property.price || "",
      type: property.type || "rumah",
      listing_type: property.listing_type || "jual",
      kecamatan: property.kecamatan || "",
      city: property.city || "Jember",
      certificate_type: property.certificate_type || "SHM",
      certificate_status: property.certificate_status || "lunas",
      status: property.status || "draft",
      description: property.description || "",
      detail: {
        luas_tanah: property.detail?.luas_tanah || "",
        luas_bangunan: property.detail?.luas_bangunan || "",
        floors: property.detail?.floors || 1,
        bedrooms: property.detail?.bedrooms || 0,
        bathrooms: property.detail?.bathrooms || 0,
        kitchens: property.detail?.kitchens || 0,
        living_rooms: property.detail?.living_rooms || 0,
        carport: property.detail?.carport || false,
        garden: property.detail?.garden || false,
        electricity_capacity: property.detail?.electricity_capacity || "",
        water: property.detail?.water || "pdam",
        one_gate_system: property.detail?.one_gate_system || false,
        security_24jam: property.detail?.security_24jam || false,
        listrik_type: property.detail?.listrik_type || "overground",
        wifi_provider: property.detail?.wifi_provider || "",
      },
      newImages: [],
      existingImages: property.images || [],
      imagesToDelete: [],
    });
    setErrors({});
    setIsEditOpen(true);
  };

  // 🔹 Open modal Delete
  const openDelete = (property) => {
    setActiveProperty(property);
    setIsDeleteOpen(true);
  };

  // 🔹 Close all modals
  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setActiveProperty(null);
    resetForm();
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const updateDetail = (field, value) => {
    const key = `detail.${field}`;
    setFormData((prev) => ({
      ...prev,
      detail: { ...prev.detail, [field]: value },
    }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  // 🔹 Prepare payload untuk JSON request
  const prepareJsonPayload = () => ({
    title: formData.title,
    price: Number(formData.price),
    type: formData.type,
    listing_type: formData.listing_type,
    kecamatan: formData.kecamatan,
    city: formData.city,
    certificate_type: formData.certificate_type,
    certificate_status: formData.certificate_status,
    status: formData.status,
    description: formData.description,
    detail: {
      luas_tanah: Number(formData.detail.luas_tanah),
      luas_bangunan: formData.detail.luas_bangunan
        ? Number(formData.detail.luas_bangunan)
        : null,
      floors: Number(formData.detail.floors),
      bedrooms: Number(formData.detail.bedrooms),
      bathrooms: Number(formData.detail.bathrooms),
      kitchens: Number(formData.detail.kitchens),
      living_rooms: Number(formData.detail.living_rooms),
      carport: formData.detail.carport,
      garden: formData.detail.garden,
      electricity_capacity: formData.detail.electricity_capacity
        ? Number(formData.detail.electricity_capacity)
        : null,
      water: formData.detail.water,
      one_gate_system: formData.detail.one_gate_system,
      security_24jam: formData.detail.security_24jam,
      listrik_type: formData.detail.listrik_type,
      wifi_provider: formData.detail.wifi_provider,
    },
  });

  // 🔹 Prepare FormData untuk upload gambar
  const prepareFormData = (jsonPayload) => {
    const formDataObj = new FormData();

    // Append JSON fields
    Object.keys(jsonPayload).forEach((key) => {
      if (key === "detail") {
        Object.keys(jsonPayload.detail).forEach((detailKey) => {
          const value = jsonPayload.detail[detailKey];
          formDataObj.append(
            `detail[${detailKey}]`,
            value === null || value === undefined ? "" : value,
          );
        });
      } else {
        const value = jsonPayload[key];
        formDataObj.append(key, value === null || value === undefined ? "" : value);
      }
    });

    // Append new images
    formData.newImages.forEach((image) => {
      formDataObj.append("images[]", image);
    });

    return formDataObj;
  };

  // 🔹 Handle Create Property (POST)
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrors({});

    try {
      const jsonPayload = prepareJsonPayload();
      const payload =
        formData.newImages.length > 0
          ? prepareFormData(jsonPayload)
          : jsonPayload;

      const config =
        formData.newImages.length > 0
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : {};

      console.log("📤 Sending create request...", payload);

      const response = await api.post("/properties", payload, config);

      console.log("✅ Create success:", response.data);

      alert("✅ Property created successfully!");

      // Tutup modal dulu
      closeAll();

      // Reload properties dengan error handling
      try {
        await fetchProperties();
        console.log("✅ Properties reloaded successfully");
      } catch (reloadError) {
        console.error("❌ Failed to reload properties:", reloadError);
        // Jangan tampilkan error ke user, cukup log saja
        // User tetap bisa refresh manual
      }
    } catch (error) {
      console.error("❌ Create property error:", error);

      if (error.response?.status === 422) {
        // Validation error
        const validationErrors = error.response.data.errors || {};
        setErrors(validationErrors);

        // Show first error message
        const firstError = Object.values(validationErrors)[0]?.[0];
        alert(`❌ Validation Error: ${firstError}`);
      } else if (error.response?.status === 401) {
        alert("❌ Session expired. Please login again.");
        // Redirect to login atau clear token
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
      } else if (error.response?.status === 500) {
        alert("❌ Server error. Property mungkin sudah tersimpan.");
      } else {
        alert(
          `❌ Failed to create property: ${error.message || "Unknown error"}`,
        );
      }
    } finally {
      setFormLoading(false);
    }
  };

  // 🔹 Handle Update Property (PUT)
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!activeProperty?.id) return;

    setFormLoading(true);
    setErrors({});

    try {
      const jsonPayload = prepareJsonPayload();
      const payload =
        formData.newImages.length > 0 || formData.imagesToDelete.length > 0
          ? prepareFormData(jsonPayload)
          : jsonPayload;

      const config =
        formData.newImages.length > 0 || formData.imagesToDelete.length > 0
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : {};

      await api.put(`/properties/${activeProperty.id}`, payload, config);
      alert("✅ Property updated successfully!");
      closeAll();
      fetchProperties();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("❌ Failed to update property");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // 🔹 Handle Delete Property (DELETE)
  const handleDelete = async () => {
    if (!activeProperty?.id) return;

    setFormLoading(true);
    try {
      await api.delete(`/properties/${activeProperty.id}`);
      alert("✅ Property deleted successfully!");
      closeAll();
      fetchProperties();
    } catch (error) {
      alert("❌ Failed to delete property");
    } finally {
      setFormLoading(false);
    }
  };

  // 🔹 Format harga ke Rupiah
  const formatRupiah = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="main-content w-100">
      <div className="main-content-inner wrap-dashboard-content">
        {/* Filter & Search */}
        <div className="row">
          <div className="col-md-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>
                  Post Status:<span>*</span>
                </label>
                <DropdownSelect
                  options={["All", "published", "draft", "sold"]}
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
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by title..."
                />
              </fieldset>
            </form>
          </div>
        </div>

        {/* Property List */}
        <div className="widget-box-2 wd-listing mt-20">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-12">
            <h3 className="title">My Properties</h3>
            <button
              type="button"
              className="tf-btn style-border pd-23"
              onClick={openCreate}
              disabled={formLoading}
            >
              Create Property
            </button>
          </div>

          <div className="wrap-table">
            <div className="table-responsive">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading properties...</p>
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No properties found. Click "Create Property" to add one.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Listing</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property.id} className="file-delete">
                        <td>
                          <div className="listing-box">
                            <div className="images">
                              {property.images?.[0]?.image_url ? (
                                <Image
                                  alt={property.title}
                                  src={property.images[0].image_url}
                                  width={150}
                                  height={100}
                                  className="object-cover rounded"
                                />
                              ) : (
                                <div className="w-[150px] h-[100px] bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="content">
                              <div className="title">
                                <Link
                                  href={`/property-detail-v1/${property.slug}`}
                                  className="link"
                                >
                                  {property.title}
                                </Link>
                              </div>
                              <div className="text-date">
                                {property.kecamatan}, {property.city}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`px-3 py-1 text-xs rounded-full ${
                              property.status === "published"
                                ? "bg-green-100 text-green-800"
                                : property.status === "sold"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {property.status}
                          </span>
                        </td>
                        <td>
                          <span className="font-semibold text-blue-600">
                            {formatRupiah(property.price)}
                          </span>
                        </td>
                        <td>
                          <ul className="list-action">
                            <li>
                              <button
                                type="button"
                                className="item"
                                onClick={() => openEdit(property)}
                                disabled={formLoading}
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
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                className="remove-file item"
                                onClick={() => openDelete(property)}
                                disabled={formLoading}
                              >
                                <svg
                                  width={16}
                                  height={16}
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M9.82667 6.00035L9.596 12.0003M6.404 12.0003L6.17333 6.00035M12.8187 3.86035C13.0467 3.89501 13.2733 3.93168 13.5 3.97101M12.8187 3.86035L12.1067 13.1157C12.0776 13.4925 11.9074 13.8445 11.63 14.1012C11.3527 14.3579 10.9886 14.5005 10.6107 14.5003H5.38933C5.0114 14.5005 4.64735 14.3579 4.36999 14.1012C4.09262 13.8445 3.92239 13.4925 3.89333 13.1157L3.18133 3.86035M12.8187 3.86035C12.0492 3.74403 11.2758 3.65574 10.5 3.59568M3.18133 3.86035C2.95333 3.89435 2.72667 3.93101 2.5 3.97035M3.18133 3.86035C3.95076 3.74403 4.72416 3.65575 5.5 3.59568M10.5 3.59568V2.98501C10.5 2.19835 9.89333 1.54235 9.10667 1.51768C8.36908 1.49411 7.63092 1.49411 6.89333 1.51768C6.10667 1.54235 5.5 2.19901 5.5 2.98501V3.59568M10.5 3.59568C8.83581 3.46707 7.16419 3.46707 7.5 3.59568"
                                    stroke="#A3ABB0"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Delete
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

            {/* Pagination */}
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
          <p>Copyright © {new Date().getFullYear()} Propty</p>
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

      {/* DELETE MODAL - Self-contained, no Bootstrap JS dependency */}
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
                  Delete Property?
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

      {/* MODAL: Create / Edit */}
      {(isCreateOpen || isEditOpen) && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header modal-header-title">
                <h5 className="modal-title">
                  {isCreateOpen && "Create Property"}
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
                    {/* === SECTION 1: BASIC INFO === */}
                    <div className="col-12">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        📋 Basic Information
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>
                          Title<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="title"
                          className={`form-control ${errors.title ? "border-red-500" : ""}`}
                          placeholder="Modern City Apartment"
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
                        <label>
                          Price (IDR)<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="price"
                          className={`form-control ${errors.price ? "border-red-500" : ""}`}
                          placeholder="500000000"
                          value={formData.price}
                          onChange={handleChange}
                          required
                        />
                        {errors.price && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.price[0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>
                          Type<span className="text-red-500">*</span>
                        </label>
                        <DropdownSelect
                          options={[
                            "rumah",
                            "perumahan",
                            "ruko",
                            "kos",
                            "tanah",
                          ]}
                          selectedValue={formData.type}
                          onChange={(value) => updateField("type", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>
                          Listing Type<span className="text-red-500">*</span>
                        </label>
                        <DropdownSelect
                          options={["jual", "sewa"]}
                          selectedValue={formData.listing_type}
                          onChange={(value) =>
                            updateField("listing_type", value)
                          }
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>
                          Status<span className="text-red-500">*</span>
                        </label>
                        <DropdownSelect
                          options={["draft", "published", "sold"]}
                          selectedValue={formData.status}
                          onChange={(value) => updateField("status", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>
                          Kecamatan<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="kecamatan"
                          className={`form-control ${errors.kecamatan ? "border-red-500" : ""}`}
                          placeholder="Sumbersari"
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
                        <label>
                          City<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          className="form-control"
                          placeholder="Jember"
                          value={formData.city}
                          onChange={handleChange}
                          required
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>
                          Certificate Type
                          <span className="text-red-500">*</span>
                        </label>
                        <DropdownSelect
                          options={["SHM", "SHGB"]}
                          selectedValue={formData.certificate_type}
                          onChange={(value) =>
                            updateField("certificate_type", value)
                          }
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Certificate Status</label>
                        <DropdownSelect
                          options={["lunas", "bank"]}
                          selectedValue={formData.certificate_status}
                          onChange={(value) =>
                            updateField("certificate_status", value)
                          }
                        />
                      </fieldset>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Description</label>
                        <textarea
                          name="description"
                          className="textarea"
                          rows={3}
                          placeholder="Describe the property highlights..."
                          value={formData.description}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    {/* === SECTION 2: PROPERTY DETAILS === */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        🏠 Property Details
                      </h6>
                    </div>

                    {/* Checkboxes */}
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
                          Garden
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
                          Security 24 Jam
                        </label>
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>
                          Luas Tanah (m²)<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="detail.luas_tanah"
                          className={`form-control ${errors["detail.luas_tanah"] ? "border-red-500" : ""}`}
                          placeholder="120"
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
                          className="form-control"
                          placeholder="90"
                          value={formData.detail.luas_bangunan}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Floors</label>
                        <input
                          type="number"
                          name="detail.floors"
                          className="form-control"
                          placeholder="1"
                          value={formData.detail.floors}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Bedrooms</label>
                        <input
                          type="number"
                          name="detail.bedrooms"
                          className="form-control"
                          placeholder="3"
                          value={formData.detail.bedrooms}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Bathrooms</label>
                        <input
                          type="number"
                          name="detail.bathrooms"
                          className="form-control"
                          placeholder="2"
                          value={formData.detail.bathrooms}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Kitchens</label>
                        <input
                          type="number"
                          name="detail.kitchens"
                          className="form-control"
                          placeholder="1"
                          value={formData.detail.kitchens}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Living Rooms</label>
                        <input
                          type="number"
                          name="detail.living_rooms"
                          className="form-control"
                          placeholder="1"
                          value={formData.detail.living_rooms}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    {/* Utilities */}
                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Electricity Capacity (VA)</label>
                        <input
                          type="number"
                          name="detail.electricity_capacity"
                          className="form-control"
                          placeholder="2200"
                          value={formData.detail.electricity_capacity}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Water Source</label>
                        <DropdownSelect
                          options={["pdam", "sumur"]}
                          selectedValue={formData.detail.water}
                          onChange={(value) => updateDetail("water", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Electricity Type</label>
                        <DropdownSelect
                          options={["overground", "underground"]}
                          selectedValue={formData.detail.listrik_type}
                          onChange={(value) =>
                            updateDetail("listrik_type", value)
                          }
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>WiFi Provider</label>
                        <input
                          type="text"
                          name="detail.wifi_provider"
                          className="form-control"
                          placeholder="IndiHome, Biznet, etc."
                          value={formData.detail.wifi_provider}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    {/* === SECTION 3: IMAGES === */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        🖼️ Property Images
                      </h6>
                    </div>

                    {/* Existing Images (Edit Mode) */}
                    {isEditOpen && formData.existingImages?.length > 0 && (
                      <div className="col-12 mb-3">
                        <p className="text-sm text-gray-600 mb-2">
                          Existing images:
                        </p>
                        <div className="box-img-upload">
                          {formData.existingImages.map((img) => (
                            <div
                              key={img.id}
                              className="item-upload file-delete"
                            >
                              <Image
                                src={img.image_url}
                                alt="Property"
                                width={615}
                                height={405}
                              />
                              <button
                                type="button"
                                className="icon icon-trashcan1 remove-file"
                                onClick={() =>
                                  handleRemoveExistingImage(img.id)
                                }
                                aria-label="Remove image"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload New Images */}
                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Upload New Images</label>
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
                              Select photos
                              <input
                                type="file"
                                name="images"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="ip-file"
                              />
                            </label>
                            <p className="file-name fw-5">
                              or drag photos here <br />
                              <span>(Up to 10 photos)</span>
                            </p>
                          </div>
                        </div>

                        {formData.newImages?.length > 0 && (
                          <div className="box-img-upload">
                            {Array.from(formData.newImages).map((file, idx) => (
                              <div
                                key={idx}
                                className="item-upload file-delete"
                              >
                                <Image
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${idx + 1}`}
                                  width={615}
                                  height={405}
                                />
                                <button
                                  type="button"
                                  className="icon icon-trashcan1 remove-file"
                                  onClick={() => handleRemoveNewImage(idx)}
                                  aria-label="Remove image"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {errors.images && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.images[0]}
                          </p>
                        )}
                      </fieldset>
                    </div>
                  </div>
                </form>
              </div>

              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="tf-btn style-border pd-23 btn-cancel-danger"
                  onClick={closeAll}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tf-btn style-border pd-23"
                  disabled={formLoading}
                  onClick={isCreateOpen ? handleCreate : handleUpdate}
                >
                  {formLoading
                    ? isCreateOpen
                      ? "Creating..."
                      : "Saving..."
                    : isCreateOpen
                      ? "Create"
                      : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
