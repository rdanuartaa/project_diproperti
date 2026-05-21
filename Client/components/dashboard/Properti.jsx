"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DropdownSelect from "../common/DropdownSelect";
import { api } from "@/lib/api";
import SuccessModal from "../common/SuccesModal";
import ConfirmModal from "../common/ConfirmModal";
import AttentionModal from "../common/AttentionModal";
import LocationPicker from "../common/LocationPicker";
import DashboardPagination, {
  DASHBOARD_PAGE_SIZE,
  paginateDashboardItems,
} from "../common/DashboardPagination";

// âœ… IMPORT LIBRARY PROPERTY YANG SUDAH DIPECAH
import {
  PROPERTY_TYPE_CONFIG,
  CERTIFICATE_REQUIRED_TYPES,
  formatThousands,
  formatPropertyValue,
  formatViewCount,
  formatDateTime,
  getAutoBuildingType,
  getBuildingTypeLabel,
  getBuildingTypePlaceholder,
  validatePropertyForm,
  buildJsonPayload,
  buildFormDataPayload,
} from "@/lib/property";

const ALL_TYPE_OPTION = "Semua Tipe";
const ALL_LISTING_TYPE_OPTION = "Semua Penawaran";
const LISTING_TYPE_LABELS = {
  jual: "Dijual",
  sewa: "Disewakan",
};
const PROPERTY_TYPE_OPTIONS = [
  ALL_TYPE_OPTION,
  ...Object.values(PROPERTY_TYPE_CONFIG).map((config) => config.label),
];
const LISTING_TYPE_OPTIONS = [
  ALL_LISTING_TYPE_OPTION,
  ...Object.values(LISTING_TYPE_LABELS),
];

const getPropertyTypeLabel = (type) =>
  PROPERTY_TYPE_CONFIG[type]?.label || String(type || "-");

const getPropertyTypeValue = (label) => {
  const match = Object.entries(PROPERTY_TYPE_CONFIG).find(
    ([, config]) => config.label === label,
  );
  return match?.[0] || "";
};

const getListingTypeLabel = (listingType) =>
  LISTING_TYPE_LABELS[listingType] || String(listingType || "-");

const getListingTypeValue = (label) => {
  const match = Object.entries(LISTING_TYPE_LABELS).find(
    ([, value]) => value === label,
  );
  return match?.[0] || "";
};

const getListingTypeFilterOptions = (typeLabel) =>
  getPropertyTypeValue(typeLabel) === "kos"
    ? [LISTING_TYPE_LABELS.sewa]
    : LISTING_TYPE_OPTIONS;

export default function Properti() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [primaryNewIndex, setPrimaryNewIndex] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [attentionMessage, setAttentionMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    sort: "Terbaru",
    type: ALL_TYPE_OPTION,
    listingType: ALL_LISTING_TYPE_OPTION,
  });
  const [primaryExistingId, setPrimaryExistingId] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: DASHBOARD_PAGE_SIZE,
  });

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    type: "rumah",
    building_type: "",
    listing_type: "jual",
    rent_period: "",
    kecamatan: "",
    city: "",
    address: "",
    latitude: "",
    longitude: "",
    certificate_type: "SHM",
    certificate_status: "lunas",
    status: "draft",
    description: "",
    detail: {
      luas_tanah: "",
      water: "pdam",
      electricity_capacity: "",
      listrik_type: "overground",
      road_access: "aspal",
      wifi_provider: "",
      luas_bangunan: "",
      floors: 1,
      bedrooms: 0,
      bathrooms: 0,
      bathroom_position: "dalam",
      kitchens: 0,
      living_rooms: 0,
      carport: false,
      garden: false,
      one_gate_system: false,
      security_24jam: false,
      swimming_pool: false,
      private_pool: false,
      view_type: "",
      furnished: false,
      near_tourism: false,
      total_rooms: 0,
      panjang_ruangan: "",
      lebar_ruangan: "",
      panjang_tanah: "",
      lebar_tanah: "",
      gender_type: "laki-laki",
      wifi_included: false,
      electricity_included: false,
      water_included: false,
      shared_kitchen: false,
    parking_area: false,
    cctv: false,
    parking_capacity: 0,
    warehouse_area: 0,
      shop_front_width: "",
      land_type: "datar",
      land_contour: "",
      zoning: "",
    },
    newImages: [],
    existingImages: [],
    imagesToDelete: [],
  });

  const activeTitle = useMemo(
    () => activeProperty?.title || "Properti Terpilih",
    [activeProperty],
  );

  const buildingTypeDisplay = useMemo(() => getAutoBuildingType(formData), [
    formData.type,
    formData.detail?.luas_tanah,
    formData.detail?.luas_bangunan,
    formData.detail?.panjang_ruangan,
    formData.detail?.lebar_ruangan,
    formData.detail?.panjang_tanah,
    formData.detail?.lebar_tanah,
  ]);

  const buildingTypeDisplayValue =
    formData.type === "tanah" && buildingTypeDisplay
      ? `${buildingTypeDisplay} mÂ²`
      : buildingTypeDisplay;

  const buildingTypePlaceholder = useMemo(
    () => getBuildingTypePlaceholder(formData.type),
    [formData.type],
  );

  const buildingTypeLabel = useMemo(
    () => getBuildingTypeLabel(formData.type),
    [formData.type],
  );

  // âœ… AUTO-CALCULATE BUILDING TYPE
  useEffect(() => {
    const applicableTypes = ["rumah", "villa", "ruko", "tanah", "kos"];
    if (!applicableTypes.includes(formData.type)) return;
    const nextBuildingType = getAutoBuildingType(formData);
    setFormData((prev) =>
      prev.building_type === nextBuildingType
        ? prev
        : { ...prev, building_type: nextBuildingType },
    );
  }, [
    formData.type,
    formData.detail.luas_tanah,
    formData.detail.luas_bangunan,
    formData.detail.panjang_ruangan,
    formData.detail.lebar_ruangan,
    formData.detail.panjang_tanah,
    formData.detail.lebar_tanah,
  ]);

  useEffect(() => {
    if (formData.type !== "tanah") return;
    const panjang = Number(formData.detail.panjang_tanah ?? 0);
    const lebar = Number(formData.detail.lebar_tanah ?? 0);
    const luasTanah = panjang > 0 && lebar > 0 ? panjang * lebar : "";
    const nextLuasTanah = luasTanah ? String(Math.round(luasTanah)) : "";

    setFormData((prev) =>
      String(prev.detail.luas_tanah ?? "") === nextLuasTanah
        ? prev
        : {
            ...prev,
            detail: {
              ...prev.detail,
              luas_tanah: nextLuasTanah,
            },
          },
    );
  }, [
    formData.type,
    formData.detail.panjang_tanah,
    formData.detail.lebar_tanah,
    formData.detail.luas_tanah,
  ]);

  const filteredProperties = useMemo(() => {
    const searchQuery = filters.search?.toLowerCase().trim();
    let result = properties.filter((property) => {
      if (property.is_verified === false) return false;
      if (filters.type && filters.type !== ALL_TYPE_OPTION) {
        const selectedType = getPropertyTypeValue(filters.type);
        if (property.type !== selectedType) return false;
      }
      if (
        filters.listingType &&
        filters.listingType !== ALL_LISTING_TYPE_OPTION
      ) {
        const selectedListingType = getListingTypeValue(filters.listingType);
        if (property.listing_type !== selectedListingType) return false;
      }
      if (!searchQuery) return true;
      const title = (property.title || "").toLowerCase();
      const description = (property.description || "").toLowerCase();
      const kecamatan = (property.kecamatan || "").toLowerCase();
      return (
        title.includes(searchQuery) ||
        description.includes(searchQuery) ||
        kecamatan.includes(searchQuery)
      );
    });
    result.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return filters.sort === "Terbaru" ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [properties, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const hasServerPagination = Boolean(pagination?.total);

  const displayedProperties = useMemo(
    () =>
      hasServerPagination
        ? properties
        : paginateDashboardItems(filteredProperties, currentPage),
    [hasServerPagination, properties, filteredProperties, currentPage],
  );

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: DASHBOARD_PAGE_SIZE,
        sort_order: filters.sort === "Terlama" ? "asc" : "desc",
      };

      if (filters.search) params.search = filters.search;
      if (filters.type !== ALL_TYPE_OPTION) {
        params.type = getPropertyTypeValue(filters.type);
      }
      if (filters.listingType !== ALL_LISTING_TYPE_OPTION) {
        params.listing_type = getListingTypeValue(filters.listingType);
      }

      const response = await api.get("/admin/properties", { params });
      const payload = response.data || {};
      const data = payload.data || payload || [];

      setProperties(
        (Array.isArray(data) ? data : []).filter(
          (property) => property.is_verified !== false,
        ),
      );
      setPagination({
        current_page: payload.current_page || currentPage,
        last_page: payload.last_page || 1,
        total: payload.total || (Array.isArray(data) ? data.length : 0),
        per_page: payload.per_page || DASHBOARD_PAGE_SIZE,
      });
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [currentPage, filters]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "type" && value === "kos") {
      setFormData((prev) => ({
        ...prev,
        type: value,
        listing_type: "sewa",
      }));
      return;
    }
    if (name.startsWith("detail.")) {
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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handlePriceChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, price: digits }));
    if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
  };

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

  const handleRemoveNewImage = (index) => {
    if (primaryNewIndex === index) {
      const nextNewImageCount = Math.max((formData.newImages?.length || 0) - 1, 0);
      if (nextNewImageCount > 0) {
        setPrimaryNewIndex(Math.min(index, nextNewImageCount - 1));
      } else {
        setPrimaryNewIndex(null);
        setPrimaryExistingId(formData.existingImages?.[0]?.id || null);
      }
    } else if (primaryNewIndex !== null && index < primaryNewIndex) {
      setPrimaryNewIndex(primaryNewIndex - 1);
    }
    setFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveExistingImage = (imageId) => {
    const nextExistingImages = formData.existingImages.filter(
      (img) => img.id !== imageId,
    );
    if (primaryExistingId === imageId) {
      const nextPrimaryExistingId = nextExistingImages[0]?.id || null;
      setPrimaryExistingId(nextPrimaryExistingId);
      if (!nextPrimaryExistingId && formData.newImages?.length > 0) {
        setPrimaryNewIndex(0);
      }
    }
    setFormData((prev) => {
      const nextImagesToDelete = prev.imagesToDelete.includes(imageId)
        ? prev.imagesToDelete
        : [...prev.imagesToDelete, imageId];
      return {
        ...prev,
        existingImages: nextExistingImages,
        imagesToDelete: nextImagesToDelete,
      };
    });
  };

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
      rent_period: "",
      kecamatan: "",
      city: "",
      address: "",
      latitude: "",
      longitude: "",
      certificate_type: "SHM",
      certificate_status: "lunas",
      status: "draft",
      description: "",
      detail: {
        luas_tanah: "",
        water: "pdam",
        electricity_capacity: "",
        listrik_type: "overground",
        road_access: "aspal",
        wifi_provider: "",
        luas_bangunan: "",
        floors: 1,
        bedrooms: 0,
        bathrooms: 0,
        bathroom_position: "dalam",
        kitchens: 0,
        living_rooms: 0,
        carport: false,
        garden: false,
        one_gate_system: false,
        security_24jam: false,
        swimming_pool: false,
        private_pool: false,
        view_type: "",
        furnished: false,
        near_tourism: false,
        total_rooms: 0,
        panjang_ruangan: "",
        lebar_ruangan: "",
        panjang_tanah: "",
        lebar_tanah: "",
        gender_type: "laki-laki",
        wifi_included: false,
        electricity_included: false,
        water_included: false,
        shared_kitchen: false,
    parking_area: false,
    cctv: false,
    parking_capacity: 0,
    warehouse_area: 0,
        shop_front_width: "",
        land_type: "datar",
        land_contour: "",
        zoning: "",
      },
      newImages: [],
      existingImages: [],
      imagesToDelete: [],
    });
    setErrors({});
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const mapPropertyToFormData = (property) => ({
    title: property.title || "",
    price: property.price || "",
    type: property.type || "rumah",
    building_type: property.building_type ?? "",
    listing_type: property.listing_type || "jual",
    rent_period: property.price_period || "",
    kecamatan: property.kecamatan || "",
    city: property.city || "",
    address: "",
    latitude: property.latitude ?? "",
    longitude: property.longitude ?? "",
    certificate_type: property.certificate_type || "SHM",
    certificate_status: property.certificate_status || "lunas",
    status: property.status || "draft",
    description: property.description || "",
    detail: {
      luas_tanah: property.detail?.luas_tanah ?? "",
      luas_bangunan: property.detail?.luas_bangunan ?? "",
      floors: property.detail?.floors ?? 1,
      bedrooms: property.detail?.bedrooms ?? 0,
      bathrooms: property.detail?.bathrooms ?? 0,
      bathroom_position: property.detail?.bathroom_position ?? "dalam",
      kitchens: property.detail?.kitchens ?? 0,
      living_rooms: property.detail?.living_rooms ?? 0,
      carport: property.detail?.carport ?? false,
      garden: property.detail?.garden ?? false,
      one_gate_system: property.detail?.one_gate_system ?? false,
      security_24jam: property.detail?.security_24jam ?? false,
      water: property.detail?.water ?? "pdam",
      electricity_capacity: property.detail?.electricity_capacity ?? "",
      listrik_type: property.detail?.listrik_type ?? "overground",
      wifi_provider: property.detail?.wifi_provider ?? "",
      road_access: property.detail?.road_access ?? "aspal",
      swimming_pool: property.detail?.swimming_pool ?? false,
      private_pool: property.detail?.private_pool ?? false,
      view_type: property.detail?.view_type ?? "",
      furnished: property.detail?.furnished ?? false,
      near_tourism: property.detail?.near_tourism ?? false,
  total_rooms: property.detail?.total_rooms ?? 0,
  panjang_ruangan: property.detail?.panjang_ruangan ?? "",
  lebar_ruangan: property.detail?.lebar_ruangan ?? "",
  panjang_tanah: property.detail?.panjang_tanah ?? "",
  lebar_tanah: property.detail?.lebar_tanah ?? "",
  gender_type: property.detail?.gender_type ?? "laki-laki",
      wifi_included: property.detail?.wifi_included ?? false,
      electricity_included: property.detail?.electricity_included ?? false,
      water_included: property.detail?.water_included ?? false,
      shared_kitchen: property.detail?.shared_kitchen ?? false,
  parking_area: property.detail?.parking_area ?? false,
  cctv: property.detail?.cctv ?? false,
  parking_capacity: property.detail?.parking_capacity ?? 0,
  warehouse_area: property.detail?.warehouse_area ?? 0,
      shop_front_width: property.detail?.shop_front_width ?? "",
      land_type: property.detail?.land_type ?? "datar",
      land_contour: property.detail?.land_contour ?? "",
      zoning: property.detail?.zoning ?? "",
    },
    newImages: [],
    existingImages: property.images || [],
    imagesToDelete: [],
  });

  const openEdit = (property) => {
    setPrimaryNewIndex(null);
    setActiveProperty(property);
    const nextFormData = mapPropertyToFormData(property);
    const currentPrimaryId =
      property.images?.find((img) => img.is_primary)?.id ||
      property.images?.[0]?.id ||
      null;
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
    rent_period: data.rent_period || "",
    kecamatan: data.kecamatan || "",
    city: data.city || "",
    latitude: data.latitude ?? "",
    longitude: data.longitude ?? "",
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
      bathroom_position: data.detail?.bathroom_position ?? "dalam",
      kitchens: data.detail?.kitchens ?? 0,
      living_rooms: data.detail?.living_rooms ?? 0,
      carport: !!data.detail?.carport,
      garden: !!data.detail?.garden,
      one_gate_system: !!data.detail?.one_gate_system,
      security_24jam: !!data.detail?.security_24jam,
      water: data.detail?.water ?? "",
      electricity_capacity: data.detail?.electricity_capacity ?? "",
      listrik_type: data.detail?.listrik_type ?? "",
      wifi_provider: data.detail?.wifi_provider ?? "",
      road_access: data.detail?.road_access ?? "aspal",
      swimming_pool: !!data.detail?.swimming_pool,
      private_pool: !!data.detail?.private_pool,
      view_type: data.detail?.view_type ?? "",
      furnished: !!data.detail?.furnished,
      near_tourism: !!data.detail?.near_tourism,
  total_rooms: data.detail?.total_rooms ?? 0,
  panjang_ruangan: data.detail?.panjang_ruangan ?? "",
  lebar_ruangan: data.detail?.lebar_ruangan ?? "",
  panjang_tanah: data.detail?.panjang_tanah ?? "",
  lebar_tanah: data.detail?.lebar_tanah ?? "",
  gender_type: data.detail?.gender_type ?? "laki-laki",
      wifi_included: !!data.detail?.wifi_included,
      electricity_included: !!data.detail?.electricity_included,
      water_included: !!data.detail?.water_included,
      shared_kitchen: !!data.detail?.shared_kitchen,
  parking_area: !!data.detail?.parking_area,
  cctv: !!data.detail?.cctv,
  parking_capacity: data.detail?.parking_capacity ?? 0,
  warehouse_area: data.detail?.warehouse_area ?? 0,
      shop_front_width: data.detail?.shop_front_width ?? "",
      land_type: data.detail?.land_type ?? "datar",
      land_contour: data.detail?.land_contour ?? "",
      zoning: data.detail?.zoning ?? "",
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
    JSON.stringify(
      buildSnapshot(formData, primaryExistingId, primaryNewIndex),
    ) !== JSON.stringify(initialSnapshot);
  const handleSetPrimaryExisting = (imageId) => {
    setPrimaryExistingId(imageId);
    setPrimaryNewIndex(null);
  };
  const getTypeDetailDefaults = (type) => ({
    water: "pdam",
    listrik_type: "overground",
    ...(type === "kos"
      ? { bathroom_position: "dalam", gender_type: "laki-laki" }
      : {}),
    ...(type === "tanah"
      ? { road_access: "aspal", land_type: "datar", panjang_tanah: "", lebar_tanah: "" }
      : {}),
  });

  const updateField = (field, value) => {
    setFormData((prev) => {
      if (field !== "type") return { ...prev, [field]: value };

      return {
        ...prev,
        type: value,
        listing_type:
          value === "kos" ? "sewa" : prev.listing_type,
        detail: {
          ...prev.detail,
          ...getTypeDetailDefaults(value),
        },
      };
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };
  const handleListingTypeChange = (value) => {
    const normalized = String(value || "").trim();
    setFormData((prev) => ({
      ...prev,
      listing_type: value,
      rent_period: normalized === "sewa" ? prev.rent_period || "bulan" : "",
    }));
  };
  const updateDetail = (field, value) => {
    const key = `detail.${field}`;
    setFormData((prev) => ({
      ...prev,
      detail: { ...prev.detail, [field]: value },
    }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrors({});
    if (formData.type === "kos") {
    setFormData((prev) => ({ ...prev, listing_type: "sewa" }));
  }
    try {
      // âœ… VALIDASI MANUAL (karena library validatePropertyForm tidak handle imagesToDelete di sini)
      const requiredMain = [
        "title",
        "price",
        "type",
        "listing_type",
        "status",
        "city",
        "kecamatan",
      ];
      if (showCertificate) requiredMain.push("certificate_type");
      for (const field of requiredMain) {
        if (!String(formData[field] ?? "").trim())
          throw new Error("Semua data wajib diisi dan tidak boleh kosong.");
      }
      if (formData.type === "kos") {
        if (!String(formData.detail.panjang_ruangan ?? "").trim())
          throw new Error("Panjang ruangan wajib diisi.");
        if (!String(formData.detail.lebar_ruangan ?? "").trim())
          throw new Error("Lebar ruangan wajib diisi.");
      } else if (formData.type === "tanah") {
        if (!String(formData.detail.panjang_tanah ?? "").trim())
          throw new Error("Panjang tanah wajib diisi.");
        if (!String(formData.detail.lebar_tanah ?? "").trim())
          throw new Error("Lebar tanah wajib diisi.");
      } else if (!String(formData.detail.luas_tanah ?? "").trim()) {
        throw new Error("Luas tanah wajib diisi.");
      }
      const totalImages =
        (formData.existingImages?.length || 0) +
        (formData.newImages?.length || 0);
      if (totalImages < 1) throw new Error("Minimal unggah 1 gambar.");

      // âœ… BUILD PAYLOAD MENGGUNAKAN LIBRARY
      const jsonPayload = buildJsonPayload(formData);
      if (formData.listing_type === "sewa") {
        delete jsonPayload.certificate_type;
        delete jsonPayload.certificate_status;
      }
      const hasImages = formData.newImages?.length > 0;
      const primaryPayload =
        primaryNewIndex !== null ? { primary_new_index: primaryNewIndex } : {};
      const payload = hasImages
        ? buildFormDataPayload(formData, primaryNewIndex)
        : { ...jsonPayload, ...primaryPayload };

      const config = hasImages
        ? {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 120000,
          }
        : { timeout: 30000 };

      await api.post("/admin/properties", payload, config);
      showSuccess("Properti berhasil ditambahkan");
      closeAll();
      await fetchProperties();
    } catch (error) {
      if (error.response?.status === 422) {
        const errs = error.response.data.errors || {};
        setErrors(errs);
        showAttention(formatFieldErrors(errs) || "Validasi gagal.");
      } else if (error.response?.status === 500) {
        showAttention("Server error. Check logs.");
      } else {
        showAttention(error.message || "Terjadi kesalahan.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (formData.type === "kos") {
    setFormData((prev) => ({ ...prev, listing_type: "sewa" }));
  }
    if (!activeProperty?.id) return;
    if (!isEditDirty) {
      showAttention("Tidak ada perubahan untuk disimpan.");
      return;
    }
    setFormLoading(true);
    setErrors({});

    // âœ… VALIDASI
    const requiredError = validatePropertyForm(formData);
    if (requiredError) {
      showAttention(requiredError);
      setFormLoading(false);
      return;
    }

    try {
      const jsonPayload = buildJsonPayload(formData);
      if (formData.listing_type === "sewa") {
        delete jsonPayload.certificate_type;
        delete jsonPayload.certificate_status;
      }
      const isMultipart =
        formData.newImages.length > 0 || formData.imagesToDelete.length > 0;
      const primaryPayload = primaryExistingId
        ? { primary_image_id: primaryExistingId }
        : primaryNewIndex !== null
          ? { primary_new_index: primaryNewIndex }
          : {};

      const payload = isMultipart
        ? buildFormDataPayload(formData, primaryNewIndex, {
            autoPrimaryNewImage: false,
          })
        : { ...jsonPayload, ...primaryPayload };

      if (isMultipart && payload instanceof FormData) {
        if (primaryPayload.primary_image_id)
          payload.append("primary_image_id", primaryPayload.primary_image_id);
        payload.append("_method", "PUT");
        await api.post(
          `/admin/properties/${activeProperty.id}`,
          payload,
          isMultipart
            ? {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 120000,
              }
            : { timeout: 30000 },
        );
      } else {
        await api.put(`/admin/properties/${activeProperty.id}`, payload, {
          timeout: 30000,
        });
      }
      showSuccess("Properti berhasil diperbarui");
      closeAll();
      fetchProperties();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        showAttention(
          formatFieldErrors(error.response.data.errors) || "Validasi gagal.",
        );
      } else {
        showAttention("Gagal memperbarui properti.");
      }
    } finally {
      setFormLoading(false);
    }
  };

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
  // âœ… Tampilkan sertifikat untuk tipe yang membutuhkannya, kecuali sewa
  const showCertificate =
    CERTIFICATE_REQUIRED_TYPES.includes(formData.type) &&
    formData.listing_type !== "sewa";

  const getSewaPeriodLabel = (item) => {
    const period = String(item?.price_period || item?.rent_period || "bulan");
    if (period === "hari") return "hari";
    if (period === "minggu") return "minggu";
    if (period === "3bulan") return "3 bulan";
    if (period === "6bulan") return "6 bulan";
    if (period === "tahun") return "tahun";
    return "bulan";
  };

  const formatPriceDisplay = (item) => {
    const base = `Rp ${Number(item?.price || 0).toLocaleString("id-ID")}`;
    if (item?.listing_type !== "sewa") return base;
    if (!item?.price) return base;
    return `${base}/${getSewaPeriodLabel(item)}`;
  };

  const getStatusBadge = (item) => {
    const status = String(item?.status || "draft").toLowerCase();
    const badgeStyle = {
      padding: "4px 8px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      lineHeight: 1.2,
    };

    if (status === "published") {
      return (
        <span style={{ ...badgeStyle, background: "#e8f8ef", color: "#168a4a" }}>
          Ditampilkan
        </span>
      );
    }

    if (status === "sold") {
      return (
        <span style={{ ...badgeStyle, background: "#feecec", color: "#dc2626" }}>
          Laku
        </span>
      );
    }

    return (
      <span style={{ ...badgeStyle, background: "#fff7d6", color: "#b77900" }}>
        Pending
      </span>
    );
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
          <div className="col-md-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>
                  Tipe Properti: <span>*</span>
                </label>
                <DropdownSelect
                  options={PROPERTY_TYPE_OPTIONS}
                  selectedValue={filters.type}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      type: value,
                      listingType:
                        getPropertyTypeValue(value) === "kos"
                          ? LISTING_TYPE_LABELS.sewa
                          : prev.listingType,
                    }))
                  }
                  addtionalParentClass=" "
                />
              </fieldset>
            </form>
          </div>
          <div className="col-md-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>
                  Penawaran: <span>*</span>
                </label>
                <DropdownSelect
                  options={getListingTypeFilterOptions(filters.type)}
                  selectedValue={filters.listingType}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, listingType: value }))
                  }
                  addtionalParentClass=" "
                />
              </fieldset>
            </form>
          </div>
          <div className="col-md-3">
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
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-12">
            <h3 className="title">Properti Saya</h3>
            <button
              type="button"
              className={`tf-btn style-border pd-23${formLoading ? " is-loading" : ""}`}
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
                  {filters.search ||
                  filters.type !== ALL_TYPE_OPTION ||
                  filters.listingType !== ALL_LISTING_TYPE_OPTION
                    ? "Properti tidak ditemukan untuk pencarian tersebut."
                    : "Tidak ada properti dengan filter ini."}
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Properti</th>
                      <th>Tipe</th>
                      <th>Penawaran</th>
                      <th>Harga</th>
                      <th>Kunjungan</th>
                      <th>Status</th>
                      <th>Diperbarui</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProperties.map((property) => (
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
                          <span className="text-sm text-gray-600">
                            {getPropertyTypeLabel(property.type)}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-600">
                            {getListingTypeLabel(property.listing_type)}
                          </span>
                        </td>
                        <td>
                          <span className="font-semibold text-blue-600">
                            {formatPriceDisplay(property)}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-600">
                            {formatViewCount(property.views)}
                          </span>
                        </td>
                        <td>{getStatusBadge(property)}</td>
                        <td>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDateTime(property.updated_at)}
                          </span>
                        </td>
                        <td>
                          <ul className="list-action">
                            <li>
                              <a
                                className="item"
                                onClick={() =>
                                  !formLoading && openEdit(property)
                                }
                                style={{
                                  cursor: formLoading
                                    ? "not-allowed"
                                    : "pointer",
                                }}
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
                                    strokeWidth="1.6"
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
                                onClick={() =>
                                  !formLoading && openDelete(property)
                                }
                                style={{
                                  cursor: formLoading
                                    ? "not-allowed"
                                    : "pointer",
                                }}
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
                                    strokeWidth="1.6"
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
            <DashboardPagination
              currentPage={currentPage}
              totalItems={
                hasServerPagination ? pagination.total : filteredProperties.length
              }
              totalPages={hasServerPagination ? pagination.last_page : undefined}
              pageSize={pagination.per_page || DASHBOARD_PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        <div className="footer-dashboard">
          <p>
            Â© {new Date().getFullYear()} DIPROPERTI REAL ESTATE. All rights
            reserved.
          </p>
          <ul className="list">
            <li>
              <a href="/faq">FAQ</a>
            </li>
            <li>
              <a href="/contact">Bantuan</a>
            </li>
          </ul>
        </div>
      </div>

      <div
        className={`overlay-dashboard ${isCreateOpen || isEditOpen ? " show" : ""}`}
        onClick={closeAll}
      />

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
                  Semua data wajib diisi dan tidak boleh kosong. Minimal unggah
                  1 gambar.
                </div>
                <form
                  className="modal-form-spacing"
                  onSubmit={isCreateOpen ? handleCreate : handleUpdate}
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
                          name="title"
                          className={`form-control ${errors.title ? "border-red-500" : ""}`}
                          placeholder="Contoh: Rumah Komersil Strategis di Jember"
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
                          options={["rumah", "villa", "ruko", "kos", "tanah"]}
                          selectedValue={formData.type}
                          onChange={(value) => updateField("type", value)}
                          getOptionLabel={getPropertyTypeLabel}
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>{buildingTypeLabel}</label>
                        <input
                          type="text"
                          name="building_type"
                          className="form-control bg-gray-100"
                          value={buildingTypeDisplayValue}
                          readOnly
                          placeholder={buildingTypePlaceholder}
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
                          getOptionLabel={(option) =>
                            formatPropertyValue("status", option)
                          }
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Penawaran</label>
                        <DropdownSelect
                          options={
                            formData.type === "kos"
                              ? ["sewa"]
                              : ["jual", "sewa"]
                          }
                          selectedValue={formData.listing_type}
                          onChange={(value) => handleListingTypeChange(value)}
                          getOptionLabel={(option) =>
                            formatPropertyValue("listing_type", option)
                          }
                        />
                      </fieldset>
                    </div>
                    {String(formData.listing_type || "").trim() === "sewa" && (
                      <div className="col-md-6">
                        <fieldset className="box-fieldset">
                          <label>Periode Sewa</label>
                          <DropdownSelect
                            options={[
                              "Hari",
                              "Minggu",
                              "Bulan",
                              "3 Bulan",
                              "6 Bulan",
                              "Tahun",
                            ]}
                            selectedValue={
                              formData.rent_period === "hari"
                                ? "Hari"
                                : formData.rent_period === "minggu"
                                  ? "Minggu"
                                  : formData.rent_period === "3bulan"
                                    ? "3 Bulan"
                                    : formData.rent_period === "6bulan"
                                      ? "6 Bulan"
                                      : formData.rent_period === "tahun"
                                        ? "Tahun"
                                        : "Bulan"
                            }
                            onChange={(value) => {
                              const periodValue =
                                value === "Hari"
                                  ? "hari"
                                  : value === "Minggu"
                                    ? "minggu"
                                    : value === "3 Bulan"
                                      ? "3bulan"
                                      : value === "6 Bulan"
                                        ? "6bulan"
                                        : value === "Tahun"
                                          ? "tahun"
                                          : "bulan";
                              updateField("rent_period", periodValue);
                            }}
                          />
                        </fieldset>
                      </div>
                    )}
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Kota</label>
                        <input
                          type="text"
                          name="city"
                          className="form-control bg-gray-100"
                          placeholder="Otomatis terisi dari lokasi peta"
                          value={formData.city}
                          readOnly
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
                          className={`form-control bg-gray-100 ${errors.kecamatan ? "border-red-500" : ""}`}
                          placeholder="Otomatis terisi dari lokasi peta"
                          value={formData.kecamatan}
                          readOnly
                          required
                        />
                        {errors.kecamatan && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.kecamatan[0]}
                          </p>
                        )}
                      </fieldset>
                    </div>

                    {showCertificate && (
                      <>
                        <div className="col-md-6">
                          <fieldset className="box-fieldset">
                            <label>Status Sertifikat</label>
                            <DropdownSelect
                              options={["lunas", "bank"]}
                              selectedValue={formData.certificate_status}
                              onChange={(value) =>
                                updateField("certificate_status", value)
                              }
                              getOptionLabel={(option) =>
                                formatPropertyValue("certificate_status", option)
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
                      </>
                    )}

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

                    <div className="col-12">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Lokasi Detail
                      </h6>
                      <LocationPicker
                        address={formData.address}
                        latitude={formData.latitude}
                        longitude={formData.longitude}
                        onChange={(next) =>
                          setFormData((prev) => ({ ...prev, ...next }))
                        }
                      />
                    </div>

                    {/* âœ… DETAIL PROPERTI DINAMIS */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Detail Properti -{" "}
                        {PROPERTY_TYPE_CONFIG[formData.type]?.label}
                      </h6>
                    </div>

                    {(() => {
                      const fields =
                        PROPERTY_TYPE_CONFIG[formData.type]?.fields || [];

                      return fields.map((field) => {
                        const errorKey = `detail.${field.name}`;
                        const commonClass = `form-control ${errors?.[errorKey] ? "border-red-500" : ""}`;
                        const fieldCol = field.col || 4;

                        return (
                        <div
                          className={`col-md-${fieldCol}`}
                          key={field.name}
                        >
                          <fieldset className="box-fieldset detail-fieldset">
                            <label>
                              {field.label}{" "}
                              {field.required && (
                                <span className="text-danger">*</span>
                              )}
                            </label>
                            {field.type === "checkbox" ? (
                              <div
                                className={`detail-checkbox ${errors?.[errorKey] ? "border-red-500" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  name={errorKey}
                                  className="form-check-input m-0"
                                  checked={!!formData.detail[field.name]}
                                  onChange={handleChange}
                                />
                                {formData.detail[field.name] && (
                                  <span
                                    className="detail-checkbox-check"
                                    aria-hidden="true"
                                  >
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
                            ) : field.type === "select" ? (
                          <DropdownSelect
                            options={field.options}
                            selectedValue={formData.detail[field.name] || ""}
                            onChange={(val) => updateDetail(field.name, val)}
                            getOptionLabel={(option) =>
                              formatPropertyValue(field.name, option)
                            }
                          />
                            ) : (
                              <input
                                type={field.type}
                                name={errorKey}
                                className={commonClass}
                                placeholder={field.label}
                                value={formData.detail[field.name] ?? ""}
                                onChange={handleChange}
                                required={field.required}
                                readOnly={field.readOnly}
                              />
                            )}
                            {errors?.[errorKey] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[errorKey][0]}
                              </p>
                            )}
                          </fieldset>
                        </div>
                        );
                      });
                    })()}

                    {/* âœ… GAMBAR PROPERTI */}
                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Gambar Properti
                      </h6>
                    </div>
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
                                className={`item-upload file-delete${isPrimary ? " is-primary" : ""}`}
                              >
                                <Image
                                  src={img.full_url}
                                  alt="Property"
                                  width={615}
                                  height={405}
                                />
                                {isPrimary && (
                                  <span className="primary-badge">Utama</span>
                                )}
                                <button
                                  type="button"
                                  className="icon primary-toggle"
                                  onClick={() =>
                                    handleSetPrimaryExisting(img.id)
                                  }
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
                                  d="M13.625 14.375V17.1875C13.625 17.705 13.205 18.125 12.6875 18.125H4.5625C4.31386 18.125 4.0754 18.0262 3.89959 17.8504C3.72377 17.6746 3.625 17.4361 3.625 17.1875V6.5625C3.625 6.045 4.045 5.625 4.5625 5.625H6.125C6.54381 5.62472 6.96192 5.65928 7.375 5.72834M13.625 14.375H16.4375C16.955 14.375 17.375 13.955 17.375 13.4375V9.375C17.375 5.65834 14.291 2.5741 10.4855 1.97834C10.7119 1.90928 10.2938 1.87472 9.875 1.875H8.3125C7.795 1.875 7.375 2.295 7.375 2.8125V5.72834M13.625 14.375H8.3125C8.06386 14.375 7.8254 14.2762 7.64959 14.1004C7.47377 13.9246 7.375 13.6861 7.375 13.4375V5.72834M17.375 11.25V9.6875C17.375 8.94158 17.0787 8.22621 16.5512 7.69876C16.0238 7.17132 15.3084 6.875 14.5625 6.875H13.3125C13.0639 6.875 12.8254 6.77623 12.6496 6.60041C12.4738 6.4246 12.375 6.18614 12.375 5.9375V4.6875C12.375 4.31816 12.3023 3.95243 12.1609 3.6112C12.0196 3.26998 11.8124 2.95993 11.5512 2.69876C11.2901 2.4376 10.98 2.23043 10.6388 2.08909C10.2976 1.94775 9.93184 1.875 9.5625 1.875H8.625"
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
                                className={`item-upload file-delete${primaryNewIndex === idx ? " is-primary" : ""}`}
                              >
                                <Image
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${idx + 1}`}
                                  width={615}
                                  height={405}
                                />
                                {primaryNewIndex === idx && (
                                  <span className="primary-badge">Utama</span>
                                )}
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
                      className={`tf-btn style-border pd-23${formLoading ? " is-loading" : ""}`}
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
