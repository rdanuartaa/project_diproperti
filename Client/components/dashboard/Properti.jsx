"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DropdownSelect from "../common/DropdownSelect";
import { api } from "@/lib/api";
import SuccessModal from "../common/SuccesModal";
import ConfirmModal from "../common/ConfirmModal";
import AttentionModal from "../common/AttentionModal";

export default function Properti() {
  // State untuk data & UI
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // UI state for primary image selection (new uploads)
  const [primaryNewIndex, setPrimaryNewIndex] = useState(null);

  // State untuk modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [attentionMessage, setAttentionMessage] = useState("");
  const [filters, setFilters] = useState({ status: "All", search: "" });
  const [primaryExistingId, setPrimaryExistingId] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  // State untuk form
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    type: "rumah",
    building_type: "",
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

  const activeTitle = useMemo(
    () => activeProperty?.title || "Selected Property",
    [activeProperty],
  );

  const filteredProperties = useMemo(() => {
    const statusFilter = filters.status?.toLowerCase();
    const searchQuery = filters.search?.toLowerCase().trim();

    return properties.filter((property) => {
      const matchesStatus =
        !statusFilter || statusFilter === "all"
          ? true
          : (property.status || "").toLowerCase() === statusFilter;

      if (!searchQuery) {
        return matchesStatus;
      }

      const title = (property.title || "").toLowerCase();
      const description = (property.description || "").toLowerCase();
      const kecamatan = (property.kecamatan || "").toLowerCase();

      const matchesSearch =
        title.includes(searchQuery) ||
        description.includes(searchQuery) ||
        kecamatan.includes(searchQuery);

      return matchesStatus && matchesSearch;
    });
  }, [properties, filters]);

  // 🔹 Fetch properties dari API
  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.status !== "All") params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      // ✅ Interceptor di api.js sudah auto-attach token, tidak perlu header manual
      const response = await api.get(`/admin/properties?${params}`);
      setProperties(response.data.data || response.data);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch data saat filter berubah
  useEffect(() => {
    fetchProperties();
  }, [filters]);

  // 🔹 Handle input change
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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const formatThousands = (rawValue) => {
    const digits = String(rawValue ?? "").replace(/\D/g, "");
    if (!digits) return "";
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, price: digits }));
    if (errors.price) {
      setErrors((prev) => ({ ...prev, price: null }));
    }
  };

  // 🔹 Handle image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.newImages.length > 10) {
      showAttention("Maksimal 10 gambar diperbolehkan.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...files],
    }));
  };

  const showAttention = (message) => {
    setAttentionMessage(message);
    setShowAttentionModal(true);
  };

  const formatFieldErrors = (fieldErrors) =>
    Object.entries(fieldErrors || {})
      .map(([field, messages]) => `${field}: ${messages?.[0] || "Invalid"}`)
      .join(" | ");

  // 🔹 Remove new image
  const handleRemoveNewImage = (index) => {
    if (primaryNewIndex === index) {
      setPrimaryNewIndex(null);
    } else if (primaryNewIndex !== null && index < primaryNewIndex) {
      setPrimaryNewIndex(primaryNewIndex - 1);
    }
    setFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
  };

  // 🔹 Remove existing image
  const handleRemoveExistingImage = async (imageId) => {
    try {
      await api.delete(`/property-images/${imageId}`);
      setFormData((prev) => ({
        ...prev,
        existingImages: prev.existingImages.filter((img) => img.id !== imageId),
      }));
      if (primaryExistingId === imageId) {
        setPrimaryExistingId(null);
      }
      alert("✅ Gambar berhasil dihapus");
    } catch (error) {
      showAttention("Gagal menghapus gambar.");
    }
  };

  // 🔹 Reset form
  const resetForm = () => {
    setPrimaryNewIndex(null);
    setPrimaryExistingId(null);
    setInitialSnapshot(null);
    setFormData({
      title: "",
      price: "",
      type: "rumah",
      building_type: "",
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

  // 🔹 Open modal
  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const mapPropertyToFormData = (property) => ({
    title: property.title || "",
    price: property.price || "",
    type: property.type || "rumah",
    building_type:
      property.building_type !== null && property.building_type !== undefined
        ? property.building_type
        : "",
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

  const openEdit = (property) => {
    setPrimaryNewIndex(null);
    setActiveProperty(property);
    const nextFormData = mapPropertyToFormData(property);
    const currentPrimaryId = property.images?.find((img) => img.is_primary)?.id || null;
    setPrimaryExistingId(currentPrimaryId);
    setFormData(nextFormData);
    setInitialSnapshot(buildSnapshot(nextFormData, currentPrimaryId, null));
    setErrors({});
    setIsEditOpen(true);
  };

  const openDelete = (property) => {
    setActiveProperty(property);
    setShowConfirmModal(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setActiveProperty(null);
    setPrimaryNewIndex(null);
    resetForm();
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2500);
  };

  const buildSnapshot = (data, primaryId, primaryIndex) => ({
    title: data.title?.trim() || "",
    price: String(data.price ?? ""),
    type: data.type || "",
    building_type: data.building_type ?? "",
    listing_type: data.listing_type || "",
    kecamatan: data.kecamatan || "",
    city: data.city || "",
    certificate_type: data.certificate_type || "",
    certificate_status: data.certificate_status || "",
    status: data.status || "",
    description: data.description || "",
    detail: {
      luas_tanah: data.detail?.luas_tanah ?? "",
      luas_bangunan: data.detail?.luas_bangunan ?? "",
      floors: data.detail?.floors ?? 1,
      bedrooms: data.detail?.bedrooms ?? 0,
      bathrooms: data.detail?.bathrooms ?? 0,
      kitchens: data.detail?.kitchens ?? 0,
      living_rooms: data.detail?.living_rooms ?? 0,
      carport: !!data.detail?.carport,
      garden: !!data.detail?.garden,
      electricity_capacity: data.detail?.electricity_capacity ?? "",
      water: data.detail?.water ?? "",
      one_gate_system: !!data.detail?.one_gate_system,
      security_24jam: !!data.detail?.security_24jam,
      listrik_type: data.detail?.listrik_type ?? "",
      wifi_provider: data.detail?.wifi_provider ?? "",
    },
    existingImageIds: (data.existingImages || []).map((img) => img.id).sort(),
    imagesToDelete: (data.imagesToDelete || []).slice().sort(),
    newImagesCount: data.newImages?.length || 0,
    primaryExistingId: primaryId || null,
    primaryNewIndex: primaryIndex ?? null,
  });

  const isEditDirty =
    isEditOpen &&
    initialSnapshot &&
    JSON.stringify(buildSnapshot(formData, primaryExistingId, primaryNewIndex)) !==
      JSON.stringify(initialSnapshot);

  const handleSetPrimaryExisting = (imageId) => {
    setPrimaryExistingId(imageId);
    setPrimaryNewIndex(null);
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

  const validateRequiredFields = () => {
    const requiredMain = [
      "title",
      "price",
      "type",
      "listing_type",
      "status",
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

    const totalImages =
      (formData.existingImages?.length || 0) +
      (formData.newImages?.length || 0);
    if (totalImages < 1) {
      return "Minimal upload 1 gambar.";
    }

    return null;
  };

  // 🔹 Prepare payload untuk JSON request
  const prepareJsonPayload = () => ({
    title: formData.title,
    price: Number(formData.price),
    type: formData.type,
    building_type: formData.building_type
      ? Number(formData.building_type)
      : null,
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
    const formDataToSend = new FormData();

    // ✅ append semua field biasa
    Object.keys(jsonPayload).forEach((key) => {
      if (key === "detail") {
        Object.keys(jsonPayload.detail).forEach((dKey) => {
          formDataToSend.append(`detail[${dKey}]`, jsonPayload.detail[dKey]);
        });
      } else {
        formDataToSend.append(key, jsonPayload[key]);
      }
    });

    // ✅ IMAGE UPLOAD (INI KUNCI UTAMA)
    formData.newImages.forEach((file) => {
      formDataToSend.append("images[]", file); // WAJIB pakai []
    });

    // ✅ DELETE IMAGE
    formData.imagesToDelete.forEach((id) => {
      formDataToSend.append("images_to_delete[]", id);
    });

    return formDataToSend;
  };


  // 🔹 Handle Create Property (POST) - FIXED
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrors({});

    try {
      // ✅ 1. Prepare jsonPayload DULU
      const jsonPayload = prepareJsonPayload();

      console.log("📤 Payload JSON:", jsonPayload);
      console.log("📷 Images to upload:", formData.newImages?.length || 0);

      // ✅ 2. Tentukan payload & config
      const hasImages = formData.newImages?.length > 0;
      const primaryPayload =
        primaryNewIndex !== null ? { primary_new_index: primaryNewIndex } : {};

      const payload = hasImages 
        ? prepareFormData({ ...jsonPayload, ...primaryPayload }) 
        : { ...jsonPayload, ...primaryPayload };

      const config = hasImages 
        ? { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
        : { timeout: 30000 };

      console.log("🚀 Sending request...");
      
      // ✅ 3. Kirim request SEKALI SAJA
      if (hasImages && payload instanceof FormData && primaryNewIndex !== null) {
        payload.append("primary_new_index", primaryNewIndex);
      }

      const response = await api.post("/admin/properties", payload, config);

      console.log("✅ Success:", response.data);
      showSuccess("Properti berhasil ditambahkan");
      closeAll();
      await fetchProperties(); // Refresh list
      
    } catch (error) {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors || {};
        setErrors(errors);
        const errorMessage = formatFieldErrors(errors);
        showAttention(errorMessage || "Validasi gagal.");
      } else if (error.response?.status === 500) {
        showAttention("Server error. Check logs.");
      } else {
        showAttention(error.message || "Terjadi kesalahan.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // 🔹 Handle Update Property (PUT)
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!activeProperty?.id) return;

    if (!isEditDirty) {
      showAttention("Tidak ada perubahan untuk disimpan.");
      return;
    }

    setFormLoading(true);
    setErrors({});

    const requiredError = validateRequiredFields();
    if (requiredError) {
      showAttention(requiredError);
      setFormLoading(false);
      return;
    }

    try {
      // ✅ HANYA SEKALI
      const jsonPayload = prepareJsonPayload();

      // ✅ CLEAN DETAIL
      if (!jsonPayload.detail || Object.keys(jsonPayload.detail).length === 0) {
        delete jsonPayload.detail;
      }

      if (jsonPayload.detail?.luas_tanah === "") {
        delete jsonPayload.detail.luas_tanah;
      }

      // ✅ TENTUKAN PAYLOAD
      const isMultipart =
        formData.newImages.length > 0 || formData.imagesToDelete.length > 0;

      const primaryPayload = primaryExistingId
        ? { primary_image_id: primaryExistingId }
        : primaryNewIndex !== null
          ? { primary_new_index: primaryNewIndex }
          : {};

      const payload = isMultipart
        ? prepareFormData({ ...jsonPayload, ...primaryPayload })
        : { ...jsonPayload, ...primaryPayload };

      if (isMultipart && payload instanceof FormData) {
        if (primaryPayload.primary_image_id) {
          payload.append("primary_image_id", primaryPayload.primary_image_id);
        }
        if (primaryPayload.primary_new_index !== undefined) {
          payload.append("primary_new_index", primaryPayload.primary_new_index);
        }
      }

      const config = isMultipart
        ? { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 }
        : { timeout: 30000 };

      if (isMultipart && payload instanceof FormData) {
        payload.append("_method", "PUT");
        await api.post(`/admin/properties/${activeProperty.id}`, payload, config);
      } else {
        await api.put(`/admin/properties/${activeProperty.id}`, payload, config);
      }

      showSuccess("Properti berhasil diperbarui");
      closeAll();
      fetchProperties();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        const errorMessage = formatFieldErrors(error.response.data.errors);
        showAttention(errorMessage || "Validasi gagal.");
      } else {
        showAttention("Gagal memperbarui properti.");
      }
    } finally {
      setFormLoading(false);
    }
  };


  // 🔹 Handle Delete Property (DELETE)
  const handleDelete = async () => {
    if (!activeProperty?.id) return;

    setIsDeleting(true);
    try {
      await api.delete(`/admin/properties/${activeProperty.id}`);
      setShowConfirmModal(false);
      showSuccess("Properti berhasil dihapus");
      closeAll();
      fetchProperties();
    } catch (error) {
      showAttention("Gagal menghapus properti.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCompactId = (amount) => {
    const value = Number(amount);
    if (!value) return "0";

    const formatUnit = (num) => {
      const rounded = Math.round(num * 10) / 10;
      const text =
        rounded % 1 === 0
          ? String(rounded).replace(/\.0$/, "")
          : String(rounded);
      return text.replace(".", ",");
    };

    if (value >= 1_000_000_000) {
      return `${formatUnit(value / 1_000_000_000)} milyar`;
    }
    if (value >= 1_000_000) {
      return `${formatUnit(value / 1_000_000)} juta`;
    }
    if (value >= 1_000) {
      return `${formatUnit(value / 1_000)} ribu`;
    }
    return String(value);
  };

  const formatFullRupiah = (amount) => {
    const digits = String(amount ?? "").replace(/\D/g, "");
    if (!digits) return "Rp 0";
    return `Rp ${formatThousands(digits)}`;
  };

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
          message={`Apakah kamu yakin ingin menghapus properti "${activeTitle}"?`}
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
                  options={["All", "published", "draft", "sold"]}
                  selectedValue={filters.status}
                  onChange={(value) => {
                    setFilters((prev) => ({ ...prev, status: value }));
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
                  placeholder="Search by title..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, search: e.target.value }));
                  }}
                />
              </fieldset>
            </form>
          </div>
        </div>

        {/* Property List */}
        <div className="widget-box-2 wd-listing mt-20">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-12">
            <h3 className="title">Properti Saya</h3>
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
              <span>Tambah Properti</span>
            </button>
          </div>

          <div className="wrap-table">
            <div className="table-responsive">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Memuat properti...</p>
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Belum ada properti. Klik "Tambah Properti" untuk menambah.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Properti</th>
                      <th>Status</th>
                      <th>Harga</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.map((property) => (
                      <tr key={property.id} className="file-delete">
                        <td>
                          <div className="listing-box">
                            <div className="images">
                              {property.images?.[0]?.full_url ? (
                                <Image
                                  alt={property.title}
                                  src={property.images[0].full_url}
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
                                <Link
                                  href={`/properti/${property.slug}`}
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
                          <span
                            className="font-semibold text-blue-600"
                            title={formatFullRupiah(property.price)}
                          >
                            {formatCompactId(property.price)}
                          </span>
                        </td>
                        <td>
                          <ul className="list-action">
                            <li>
                              <a
                                className="item"
                                onClick={() => !formLoading && openEdit(property)}
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
                                Ubah
                              </a>
                            </li>
                            <li>
                              <a
                                className="remove-file item"
                                onClick={() => !formLoading && openDelete(property)}
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
                                    d="M9.82667 6.00035L9.596 12.0003M6.404 12.0003L6.17333 6.00035M12.8187 3.86035C13.0467 3.89501 13.2733 3.93168 13.5 3.97101M12.8187 3.86035L12.1067 13.1157C12.0776 13.4925 11.9074 13.8445 11.63 14.1012C11.3527 14.3579 10.9886 14.5005 10.6107 14.5003H5.38933C5.0114 14.5005 4.64735 14.3579 4.36999 14.1012C4.09262 13.8445 3.92239 13.4925 3.89333 13.1157L3.18133 3.86035M12.8187 3.86035C12.0492 3.74403 11.2758 3.65574 10.5 3.59568M3.18133 3.86035C2.95333 3.89435 2.72667 3.93101 2.5 3.97035M3.18133 3.86035C3.95076 3.74403 4.72416 3.65575 5.5 3.59568M10.5 3.59568V2.98501C10.5 2.19835 9.89333 1.54235 9.10667 1.51768C8.36908 1.49411 7.63092 1.49411 6.89333 1.51768C6.10667 1.54235 5.5 2.19901 5.5 2.98501V3.59568M10.5 3.59568C8.83581 3.46707 7.16419 3.46707 7.5 3.59568"
                                    stroke="#A3ABB0"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Hapus
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
        className={`overlay-dashboard ${isCreateOpen || isEditOpen ? "show" : ""}`}
        onClick={closeAll}
      />

      {/* MODAL: Tambah / Edit */}
      {(isCreateOpen || isEditOpen) && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header modal-header-title">
                <h5 className="modal-title">
                  {isCreateOpen && "Tambah Properti"}
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
                <div className="alert alert-warning" role="alert">
                  Semua data wajib diisi dan tidak boleh kosong. Minimal upload
                  1 gambar.
                </div>
                <form
                  className="modal-form-spacing"
                  onSubmit={isCreateOpen ? handleCreate : handleUpdate}
                >
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
                        <label>Harga (IDR)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          name="price"
                          className={`form-control ${errors.price ? "border-red-500" : ""}`}
                          placeholder="Contoh: 500000000"
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
                        <label>Tipe</label>
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

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Tipe Bangunan (angka)</label>
                        <input
                          type="number"
                          name="building_type"
                          className="form-control"
                          placeholder="Contoh: 1"
                          value={formData.building_type}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Status</label>
                        <DropdownSelect
                          options={["draft", "published", "sold"]}
                          selectedValue={formData.status}
                          onChange={(value) => updateField("status", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Tipe Listing</label>
                        <DropdownSelect
                          options={["jual", "sewa"]}
                          selectedValue={formData.listing_type}
                          onChange={(value) =>
                            updateField("listing_type", value)
                          }
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Kota</label>
                        <input
                          type="text"
                          name="city"
                          className="form-control"
                          placeholder="Contoh: Jember"
                          value={formData.city}
                          onChange={handleChange}
                          required
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
                        <label>Status Sertifikat</label>
                        <DropdownSelect
                          options={["lunas", "bank"]}
                          selectedValue={formData.certificate_status}
                          onChange={(value) =>
                            updateField("certificate_status", value)
                          }
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Jenis Sertifikat</label>
                        <DropdownSelect
                          options={["SHM", "SHGB"]}
                          selectedValue={formData.certificate_type}
                          onChange={(value) =>
                            updateField("certificate_type", value)
                          }
                        />
                      </fieldset>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Deskripsi</label>
                        <textarea
                          name="description"
                          className="textarea"
                          rows={3}
                          placeholder="Tuliskan deskripsi singkat properti..."
                          value={formData.description}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    {/* === SECTION 2: PROPERTY DETAILS === */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        🏠 Detail Properti
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

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Luas Tanah (m²)</label>
                        <input
                          type="number"
                          name="detail.luas_tanah"
                          className={`form-control ${errors["detail.luas_tanah"] ? "border-red-500" : ""}`}
                          placeholder="Contoh: 120"
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
                          placeholder="Contoh: 90"
                          value={formData.detail.luas_bangunan}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-4">
                      <fieldset className="box-fieldset">
                        <label>Jumlah Lantai</label>
                        <input
                          type="number"
                          name="detail.floors"
                          className="form-control"
                          placeholder="Contoh: 2"
                          value={formData.detail.floors}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Kamar Tidur</label>
                        <input
                          type="number"
                          name="detail.bedrooms"
                          className="form-control"
                          placeholder="Contoh: 3"
                          value={formData.detail.bedrooms}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Kamar Mandi</label>
                        <input
                          type="number"
                          name="detail.bathrooms"
                          className="form-control"
                          placeholder="Contoh: 2"
                          value={formData.detail.bathrooms}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Dapur</label>
                        <input
                          type="number"
                          name="detail.kitchens"
                          className="form-control"
                          placeholder="Contoh: 1"
                          value={formData.detail.kitchens}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-3">
                      <fieldset className="box-fieldset">
                        <label>Ruang Tamu</label>
                        <input
                          type="number"
                          name="detail.living_rooms"
                          className="form-control"
                          placeholder="Contoh: 1"
                          value={formData.detail.living_rooms}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    {/* Utilities */}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Daya Listrik (VA)</label>
                        <input
                          type="number"
                          name="detail.electricity_capacity"
                          className="form-control"
                          placeholder="Contoh: 2200"
                          value={formData.detail.electricity_capacity}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Penyedia WiFi</label>
                        <input
                          type="text"
                          name="detail.wifi_provider"
                          className="form-control"
                          placeholder="Contoh: IndiHome, Biznet"
                          value={formData.detail.wifi_provider}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Sumber Air</label>
                        <DropdownSelect
                          options={["pdam", "sumur"]}
                          selectedValue={formData.detail.water}
                          onChange={(value) => updateDetail("water", value)}
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Jenis Listrik</label>
                        <DropdownSelect
                          options={["overground", "underground"]}
                          selectedValue={formData.detail.listrik_type}
                          onChange={(value) =>
                            updateDetail("listrik_type", value)
                          }
                        />
                      </fieldset>
                    </div>

                    {/* === SECTION 3: IMAGES === */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        🖼️ Gambar Properti
                      </h6>
                    </div>

                    {/* Existing Images (Edit Mode) */}
                    {isEditOpen && formData.existingImages?.length > 0 && (
                      <div className="col-12 mb-3">
                        <p className="text-sm text-gray-600 mb-2">
                          Gambar tersimpan:
                        </p>
                        <div className="box-img-upload">
                          {formData.existingImages.map((img) => {
                            const isPrimary = primaryExistingId
                              ? img.id === primaryExistingId
                              : img.is_primary;
                            return (
                            <div
                              key={img.id}
                              className={`item-upload file-delete${
                                isPrimary ? " is-primary" : ""
                              }`}
                            >
                              <Image
                                src={img.full_url}
                                alt="Property"
                                width={615}
                                height={405}
                              />
                              <button
                                type="button"
                                className="icon primary-toggle"
                                onClick={() => handleSetPrimaryExisting(img.id)}
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
                                onClick={() =>
                                  handleRemoveExistingImage(img.id)
                                }
                                aria-label="Remove image"
                              />
                            </div>
                          );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Upload New Images */}
                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Unggah Gambar Baru</label>
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
                                name="images"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="ip-file"
                              />
                            </label>
                            <p className="file-name fw-5">
                              atau seret foto ke sini <br />
                              <span>(Maks 10 foto)</span>
                            </p>
                          </div>
                        </div>

                        {formData.newImages?.length > 0 && (
                          <div className="box-img-upload">
                            {Array.from(formData.newImages).map((file, idx) => (
                              <div
                                key={idx}
                                className={`item-upload file-delete${
                                  primaryNewIndex === idx ? " is-primary" : ""
                                }`}
                              >
                                <Image
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${idx + 1}`}
                                  width={615}
                                  height={405}
                                />
                                <button
                                  type="button"
                                  className="icon primary-toggle"
                                  onClick={() => {
                                    setPrimaryNewIndex(idx);
                                    setPrimaryExistingId(null);
                                  }}
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
                      disabled={formLoading || (isEditOpen && !isEditDirty)}
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