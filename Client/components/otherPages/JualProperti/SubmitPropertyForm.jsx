"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL, api } from "@/lib/api";
import SuccessModal from "@/components/common/SuccesModal";
import AttentionModal from "@/components/common/AttentionModal";
import Image from "next/image";
import DropdownSelect from "@/components/common/DropdownSelect";
import LocationPicker from "@/components/common/LocationPicker";
// ✅ IMPORT LIBRARY PROPERTY
import {
  PROPERTY_TYPE_CONFIG,
  CERTIFICATE_REQUIRED_TYPES,
  formatPropertyValue,
  formatThousands,
  formatCompact,
  formatFullRupiah,
  formatDateTime,
  getAutoBuildingType,
  getBuildingTypeLabel,
  getBuildingTypePlaceholder,
  validatePropertyForm,
  buildFormDataPayload,
} from "@/lib/property";

const EMPTY_FORM = {
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
    road_access: "aspal",
    land_type: "datar",
    land_contour: "",
    zoning: "",
  },
  newImages: [],
  certificateFile: null,
  electricBillFile: null,
  waterBillFile: null,
};

const DOCUMENT_MAX_SIZE_MB = 10;
const DOCUMENT_MAX_SIZE_BYTES = DOCUMENT_MAX_SIZE_MB * 1024 * 1024;
const DOCUMENT_ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];
const DOCUMENT_FIELD_LABELS = {
  certificate_file: "Sertifikat",
  electric_bill_file: "Tagihan listrik",
  water_bill_file: "Tagihan air",
};

const formatServerErrors = (serverErrors = {}) => {
  return Object.entries(serverErrors)
    .flatMap(([field, messages]) => {
      const label = DOCUMENT_FIELD_LABELS[field] || field.replaceAll("_", " ");
      return (Array.isArray(messages) ? messages : [messages]).map(
        (message) => `${label}: ${message}`,
      );
    })
    .filter(Boolean)
    .join(" ");
};

const validateDocumentFile = (file) => {
  if (!file) return null;
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!DOCUMENT_ALLOWED_EXTENSIONS.includes(extension)) {
    return "Format dokumen harus PDF, JPG, JPEG, atau PNG.";
  }

  if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
    return `Ukuran dokumen maksimal ${DOCUMENT_MAX_SIZE_MB}MB per file.`;
  }

  return null;
};

// ✅ SectionCard — style heading seperti Contact.jsx, tanpa icon
function SectionCard({ title, subtitle, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <div className="heading-section" style={{ marginBottom: "20px" }}>
        <h2 className="title" style={{ marginBottom: subtitle ? "4px" : 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted mt-4" style={{ margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function DocUploadCard({ label, icon, file, preview, onSelect, onRemove, accept = ".pdf,.jpg,.jpeg,.png" }) {
  return (
    <div
      style={{
        border: file ? "2px solid #16a34a" : "2px dashed #d1d5db",
        borderRadius: "12px",
        padding: "20px 16px",
        minHeight: "160px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        background: file ? "#f0fdf4" : "#fafafa",
        transition: "all 0.2s",
        position: "relative",
      }}
    >
      {icon && (
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>{icon}</div>
      )}

      {/* Label diperbesar pakai text-1 */}
      <p className="text-1" style={{ fontWeight: 600, margin: "0 0 12px" }}>
        {label}
      </p>

      {file ? (
        <>
          <span
            style={{
              display: "inline-block",
              background: "#16a34a",
              color: "#fff",
              borderRadius: "20px",
              padding: "2px 12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            ✓ Terpilih
          </span>
          <p
            className="text-muted mt-4"
            style={{
              maxWidth: "160px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              margin: "0 0 10px",
            }}
            title={file.name}
          >
            {file.name}
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="tf-btn style-border pd-23"
          >
            Hapus File
          </button>
        </>
      ) : (
        <>
          {/* Button Pilih File — sama seperti Simpan Profil */}
          <label className="tf-btn style-border pd-23" style={{ marginBottom: "8px" }}>
            Pilih File
            <input
              type="file"
              className="ip-file"
              accept={accept}
              onChange={onSelect}
              style={{ display: "none" }}
            />
          </label>
          <p className="text-muted mt-4" style={{ margin: 0 }}>
            PDF, JPG, PNG · Maks {DOCUMENT_MAX_SIZE_MB}MB
          </p>
        </>
      )}
    </div>
  );
}

export default function SubmitPropertyForm() {
  const { isAuthenticated, loading, user, isAdmin } = useAuth();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryNewIndex, setPrimaryNewIndex] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [attention, setAttention] = useState({ open: false, message: "" });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [certificatePreview, setCertificatePreview] = useState(null);
  const [electricBillPreview, setElectricBillPreview] = useState(null);
  const [waterBillPreview, setWaterBillPreview] = useState(null);
  const redirectOnce = useRef(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    idCardFile: null,
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showProfileSuccessModal, setShowProfileSuccessModal] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [idCardPreview, setIdCardPreview] = useState(null);

  // ✅ TRACKER STATES & LOGIC
  const [showTracker, setShowTracker] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [trackerAttention, setTrackerAttention] = useState({
    open: false,
    message: "",
  });

  const fetchMySubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const response = await api.get("/properties/my-submissions");
      setSubmissions(response.data.data || response.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        setTrackerAttention({
          open: true,
          message: "Silakan login terlebih dahulu.",
        });
      } else {
        setTrackerAttention({
          open: true,
          message: "Gagal memuat data pengajuan anda.",
        });
      }
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const openTracker = async () => {
    setShowTracker(true);
    await fetchMySubmissions();
  };

  const closeTracker = () => setShowTracker(false);

  const formatTrackerPrice = (val) =>
    `Rp ${Number(val || 0).toLocaleString("id-ID")}`;
  const getTrackerRentPeriod = (item) => {
    const period = String(item?.price_period || "bulan");
    if (period === "3bulan") return "3 bulan";
    if (period === "6bulan") return "6 bulan";
    if (period === "tahun") return "tahun";
    return "bulan";
  };
  const formatTrackerPriceDisplay = (item) => {
    const base = formatTrackerPrice(item?.price);
    if (item?.listing_type !== "sewa") return base;
    if (!item?.price) return base;
    return `${base}/${getTrackerRentPeriod(item)}`;
  };
  const formatTrackerDate = (dateString) => {
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
  const getTrackerStatusBadge = (item) => {
    if (!item) return null;
    if (item.status === "sold")
      return <span className="badge bg-danger">Laku</span>;
    if (item.is_verified && item.status === "published") {
      return <span className="badge bg-success">Disetujui</span>;
    }
    return <span className="badge bg-warning text-dark">Ditinjau</span>;
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get("/me")
      .then((res) => {
        const u = res.data?.user || res.data?.data || res.data;
        setUserProfile(u);
        setProfileForm({
          full_name: u?.full_name || "",
          phone: u?.phone || "",
          idCardFile: null,
        });
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // ✅ DETEKSI JIKA YANG LOGIN ADALAH ADMIN
  const isAdminUser =
    isAdmin === true ||
    String(user?.role || "").toLowerCase() === "admin" ||
    user?.is_admin === true ||
    String(userProfile?.role || "").toLowerCase() === "admin" ||
    userProfile?.is_admin === true;
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isAdminUser) {
      setAttention({
        open: true,
        message:
          "Admin dapat membuka halaman ini, tetapi tidak dapat mengisi atau mengirim pengajuan properti.",
      });
      return;
    }
    const errs = {};
    if (!profileForm.full_name.trim())
      errs.full_name = "Nama lengkap wajib diisi.";
    if (!profileForm.phone.trim()) errs.phone = "Nomor WhatsApp wajib diisi.";
    if (!userProfile?.id_card_file_url && !profileForm.idCardFile) {
      errs.id_card_file = "Foto KTP wajib diunggah.";
    }
    const idCardFileError = validateDocumentFile(profileForm.idCardFile);
    if (idCardFileError) {
      errs.id_card_file = idCardFileError.replace("dokumen", "foto KTP");
    }
    if (Object.keys(errs).length) {
      setProfileErrors(errs);
      return;
    }
    setIsSavingProfile(true);
    setProfileErrors({});
    try {
      const payload = new FormData();
      payload.append("full_name", profileForm.full_name.trim());
      payload.append("phone", profileForm.phone.trim());
      if (profileForm.idCardFile) {
        payload.append("id_card_file", profileForm.idCardFile);
      }

      const res = await api.post("/user/profile", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = res.data?.data || res.data;
      setUserProfile((prev) => ({ ...prev, ...updated }));
      setProfileForm((prev) => ({ ...prev, idCardFile: null }));
      setIdCardPreview(null);
      setShowProfileSuccessModal(true);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      if (err.response?.status === 422) {
        const serverErrs = err.response.data.errors || {};
        setProfileErrors({
          full_name: serverErrs.full_name?.[0],
          phone: serverErrs.phone?.[0],
          id_card_file: serverErrs.id_card_file?.[0],
        });
        setAttention({
          open: true,
          message:
            serverErrs.id_card_file?.[0] ||
            serverErrs.full_name?.[0] ||
            serverErrs.phone?.[0] ||
            "Data profil belum valid.",
        });
      } else {
        setAttention({
          open: true,
          message: "Gagal menyimpan profil. Silakan coba lagi.",
        });
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ✅ Apakah tipe ini memerlukan sertifikat & dokumen tagihan (KECUALI JIKA SEWA)
  const showCertificate =
    CERTIFICATE_REQUIRED_TYPES.includes(formData.type) &&
    formData.listing_type !== "sewa";
  const buildingTypeDisplay = getAutoBuildingType(formData);
  const buildingTypeDisplayValue =
    formData.type === "tanah" && buildingTypeDisplay
      ? `${buildingTypeDisplay} m²`
      : buildingTypeDisplay;
  const isProfileComplete =
    !!String(userProfile?.full_name || "").trim() &&
    !!String(userProfile?.phone || "").trim() &&
    !!String(userProfile?.id_card_file_url || "").trim();
  const isMainFormLocked = isAdminUser || !isProfileComplete;

  // ✅ AUTO-CALCULATE BUILDING TYPE
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

  useEffect(() => {
    if (!loading && !isAuthenticated && !redirectOnce.current) {
      redirectOnce.current = true;
      setAttention({
        open: true,
        message: "Anda harus login terlebih dahulu untuk menjual properti.",
      });
      const timer = setTimeout(() => {
        window.location.href = `${API_URL}/auth/google/redirect`;
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [loading, isAuthenticated]);

  const totalImages = useMemo(
    () => formData.newImages?.length || 0,
    [formData.newImages],
  );

  const handleChange = (e) => {
    if (isAdminUser) return;
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
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        detail: {
          ...prev.detail,
          [key]: type === "checkbox" ? checked : value,
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
    if (isAdminUser) return;
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
    if (isAdminUser) return;
    const normalized = String(value || "").trim();
    setFormData((prev) => ({
      ...prev,
      listing_type: value,
      rent_period: normalized === "sewa" ? prev.rent_period || "bulan" : "",
    }));
  };

  const updateDetail = (field, value) => {
    if (isAdminUser) return;
    setFormData((prev) => ({
      ...prev,
      detail: { ...prev.detail, [field]: value },
    }));
    const key = `detail.${field}`;
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handlePriceChange = (e) => {
    if (isAdminUser) return;
    const digits = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, price: digits }));
    if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
  };

  const handleImagesChange = (e) => {
    if (isAdminUser) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (formData.newImages.length + files.length > 10) {
      setAttention({
        open: true,
        message: "Maksimal 10 gambar diperbolehkan.",
      });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...files],
    }));
  };

  const handleRemoveImage = (index) => {
    if (isAdminUser) return;
    setFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
    if (primaryNewIndex === index) setPrimaryNewIndex(null);
    else if (primaryNewIndex !== null && index < primaryNewIndex)
      setPrimaryNewIndex(primaryNewIndex - 1);
  };

  const handleFileChange = (field, setPreview) => (e) => {
    if (isAdminUser) return;
    const file = e.target.files?.[0] || null;

    const fileError = validateDocumentFile(file);
    if (fileError) {
      e.target.value = "";
      setFormData((prev) => ({ ...prev, [field]: null }));
      setPreview(null);
      setAttention({
        open: true,
        message: fileError,
      });
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: file }));
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleRemoveFile = (field, setPreview) => () => {
    if (isAdminUser) return;
    setFormData((prev) => ({ ...prev, [field]: null }));
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAdminUser) {
      setAttention({
        open: true,
        message:
          "Admin dapat membuka halaman ini, tetapi tidak dapat mengisi atau mengirim pengajuan properti.",
      });
      return;
    }
    if (!hasAgreedToTerms) {
      setShowTermsModal(true);
      return;
    }
    setIsSubmitting(true);
    setErrors({});
    try {
      const requiredMain = [
        "title",
        "price",
        "type",
        "listing_type",
        "city",
        "kecamatan",
      ];
      if (showCertificate) requiredMain.push("certificate_type");
      if (formData.type === "kos" && formData.listing_type !== "sewa") {
        throw new Error(
          "Properti Kos hanya tersedia untuk disewakan (Sewa). ",
        );
      }

      for (const field of requiredMain) {
        if (!String(formData[field] ?? "").trim()) {
          throw new Error("Semua data wajib diisi dan tidak boleh kosong. ");
        }
      }

      if (formData.type === "kos") {
        if (!String(formData.detail.panjang_ruangan ?? "").trim()) {
          throw new Error("Panjang ruangan wajib diisi. ");
        }
        if (!String(formData.detail.lebar_ruangan ?? "").trim()) {
          throw new Error("Lebar ruangan wajib diisi. ");
        }
      } else if (formData.type === "tanah") {
        if (!String(formData.detail.panjang_tanah ?? "").trim()) {
          throw new Error("Panjang tanah wajib diisi. ");
        }
        if (!String(formData.detail.lebar_tanah ?? "").trim()) {
          throw new Error("Lebar tanah wajib diisi. ");
        }
      } else if (!String(formData.detail.luas_tanah ?? "").trim()) {
        throw new Error("Luas tanah wajib diisi. ");
      }

      if ((formData.newImages?.length || 0) < 1) {
        throw new Error("Minimal unggah 1 gambar. ");
      }

      const documentFiles = [
        formData.certificateFile,
        formData.electricBillFile,
        formData.waterBillFile,
      ];
      for (const file of documentFiles) {
        const fileError = validateDocumentFile(file);
        if (fileError) throw new Error(fileError);
      }
    } catch (validationError) {
      setAttention({
        open: true,
        message: validationError.message || "Validasi gagal. ",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = buildFormDataPayload(formData, primaryNewIndex);
      await api.post("/properties/submit", payload, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      setShowSuccess(true);
      setFormData(EMPTY_FORM);
      setPrimaryNewIndex(null);
      setCertificatePreview(null);
      setElectricBillPreview(null);
      setWaterBillPreview(null);
    } catch (error) {
      if (error.response?.status === 422) {
        const serverErrors = error.response.data.errors || {};
        setErrors(serverErrors);
        setAttention({
          open: true,
          message:
            formatServerErrors(serverErrors) ||
            error.response.data.message ||
            "Ada data yang belum lengkap atau tidak valid. ",
        });
      } else {
        setAttention({
          open: true,
          message: "Gagal mengirim pengajuan. Silakan coba lagi. ",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tf-spacing-7 pt-0">
        <div className="tf-container">
          <p style={{ textAlign: "center", padding: "48px 0" }}>Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="tf-spacing-7 pt-0">
        <div className="tf-container">
          <AttentionModal
            isOpen={attention.open}
            onClose={() => setAttention({ open: false, message: "" })}
            title="Perhatian"
            message={attention.message}
          />
        </div>
      </section>
    );
  }

  const renderDetailFields = () => {
    const fields = PROPERTY_TYPE_CONFIG[formData.type]?.fields || [];
    const rows = [];
    let currentRow = [];
    let colSum = 0;
    fields.forEach((field) => {
      const fc = field.col || 6;
      if (colSum + fc > 12) {
        rows.push(currentRow);
        currentRow = [field];
        colSum = fc;
      } else {
        currentRow.push(field);
        colSum += fc;
      }
    });
    if (currentRow.length > 0) rows.push(currentRow);
    return rows.map((row, rowIdx) => (
      <div className="col-12 mb-1" key={`drow-${rowIdx}`}>
        <div className="row g-3">
          {row.map((field) => {
            const errorKey = `detail.${field.name}`;
            const fc = field.col || 6;
            return (
              <div className={`col-md-${fc}`} key={field.name}>
                <fieldset className="box-fieldset detail-fieldset">
                  <label>
                    {field.label}{" "}
                    {field.required && <span className="text-danger">*</span>}
                  </label>

                  {field.type === "checkbox" ? (
                    <div
                      className={`detail-checkbox ${errors?.[errorKey] ? "border-red-500" : " "}`}
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
                      className={`form-control ${errors?.[errorKey] ? "border-red-500" : " "}`}
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
          })}
        </div>
      </div>
    ));
  };

  return (
    <section className="tf-spacing-1 pt-0">
      <div className="tf-container tf-spacing-1">
        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          message="Pengajuan properti berhasil dikirim. Admin akan meninjau sebelum ditampilkan."
        />
        <AttentionModal
          isOpen={attention.open}
          onClose={() => setAttention({ open: false, message: "" })}
          title="Perhatian"
          message={attention.message}
        />

        {/* ✅ TRACKER ATTENTION MODAL */}
        <AttentionModal
          isOpen={trackerAttention.open}
          onClose={() => setTrackerAttention({ open: false, message: "" })}
          title="Perhatian"
          message={trackerAttention.message}
        />

        {/* ✅ TERMS MODAL */}
        {showTermsModal && (
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-xl"
              style={{ maxWidth: "960px", width: "calc(100% - 32px)" }}
            >
              <div className="modal-content" style={{ borderRadius: "18px" }}>
                <div className="modal-header" style={{ padding: "22px 32px" }}>
                  <h5 className="modal-title">
                    Syarat & Ketentuan Penjualan Properti
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowTermsModal(false)}
                    aria-label="Close"
                  />
                </div>
                <div
                  className="modal-body"
                  style={{
                    maxHeight: "58vh",
                    overflowY: "auto",
                    padding: "28px 34px",
                  }}
                >
                  <div className="alert alert-info mb-4">
                    <strong>
                      Harap baca dengan seksama sebelum menyetujui.
                    </strong>
                  </div>
                  <h6 className="fw-bold mb-2">1. Kebijakan Biaya Platform</h6>
                  <ul className="mb-4">
                    <li>
                      <strong>GRATIS 100%</strong> untuk mengunggah/mendaftarkan
                      properti di platform kami.
                    </li>
                    <li>
                      Tidak ada biaya admin, biaya iklan, atau biaya
                      tersembunyi saat pendaftaran.
                    </li>
                    <li>
                      <strong>Komisi Penjualan:</strong> Jika properti Anda
                      berhasil <u>terjual</u> melalui platform kami, akan
                      dikenakan komisi admin sebesar{" "}
                      <strong>2.5% dari harga jual final</strong>.
                    </li>
                    <li>
                      <strong>Komisi Sewa:</strong> Jika properti Anda berhasil{" "}
                      <u>disewa</u> melalui platform kami, akan dikenakan komisi
                      admin sebesar{" "}
                      <strong>2.5% dari nilai sewa final</strong> yang
                      disepakati penyewa dan pemilik.
                    </li>
                    <li>
                      Komisi hanya dibayarkan{" "}
                      <strong>setelah transaksi berhasil</strong> dan dana telah
                      diterima oleh penjual atau pemilik properti.
                    </li>
                  </ul>
                  <h6 className="fw-bold mb-2">
                    2. Verifikasi & Persetujuan Admin
                  </h6>
                  <ul className="mb-4">
                    <li>
                      Semua pengajuan properti akan diverifikasi oleh tim admin
                      sebelum ditampilkan di iklan publik.
                    </li>
                    <li>
                      Admin berhak menolak pengajuan jika data tidak lengkap,
                      tidak valid, atau melanggar kebijakan platform.
                    </li>
                    <li>
                      Proses verifikasi biasanya memakan waktu 1-3 hari kerja.
                    </li>
                  </ul>
                  <h6 className="fw-bold mb-2">3. Keabsahan Data</h6>
                  <ul className="mb-4">
                    <li>
                      Penjual bertanggung jawab penuh atas keakuratan dan
                      keabsahan semua data yang diunggah.
                    </li>
                    <li>
                      Platform tidak bertanggung jawab atas kerugian akibat data
                      palsu atau menyesatkan dari pihak penjual.
                    </li>
                    <li>
                      Dokumen pendukung bersifat opsional namun sangat
                      disarankan untuk mempercepat verifikasi.
                    </li>
                  </ul>
                  <h6 className="fw-bold mb-2">4. Privasi & Keamanan</h6>
                  <ul className="mb-4">
                    <li>
                      Data pribadi penjual hanya digunakan untuk keperluan
                      verifikasi dan transaksi.
                    </li>
                    <li>
                      Kami tidak akan membagikan data kontak Anda kepada pihak
                      ketiga tanpa izin eksplisit.
                    </li>
                  </ul>
                  <div className="alert alert-warning mb-0">
                    <strong>
                      Dengan mengklik "Saya Setuju", Anda menyatakan telah
                      membaca, memahami, dan menyetujui seluruh syarat &
                      ketentuan di atas.
                    </strong>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: "18px 32px" }}>
                  <button
                    type="button"
                    className="tf-btn style-border pd-23"
                    onClick={() => setShowTermsModal(false)}
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    className="tf-btn bg-color-primary pd-23"
                    disabled={isAdminUser}
                    onClick={() => {
                      if (isAdminUser) return;
                      setHasAgreedToTerms(true);
                      setShowTermsModal(false);
                    }}
                  >
                    Saya Setuju
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ PAGE HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <h2 className="fw-7" style={{ marginBottom: "6px" }}>
              Jual Properti
            </h2>
            <p className="text-muted mt-4" style={{ marginBottom: "16px" }}>
              Lengkapi data properti, detail, dan gambar. Admin akan
              memverifikasi sebelum tampil sebagai iklan.
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: "10px",
                padding: "10px 18px",
                color: "#92400e",
              }}
            >
              <span style={{ fontSize: "14px" }}></span>
              <span className="text-1">
                Iklan properti <strong>GRATIS</strong>. Komisi{" "}
                <strong>2.5%</strong> hanya dikenakan jika properti{" "}
                <u>berhasil terjual atau disewa</u>.
              </span>
            </div>
          </div>

          {/* ✅ BUTTON TRACKING — sejajar info box GRATIS (flex-end) */}
          {!isAdminUser && (
            <button
              type="button"
              onClick={openTracker}
              className="tf-btn style-border pd-23"
              style={{ alignSelf: "flex-end" }}
            >
              Tracking Pengajuan Saya
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {isAdminUser && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                background: "#eff6ff",
                border: "1.5px solid #60a5fa",
                borderRadius: "14px",
                padding: "16px 20px",
                marginBottom: "24px",
              }}
            >
              <span style={{ fontSize: "24px", flexShrink: 0, lineHeight: 1 }}>
                i
              </span>
              <div>
                <p
                  className="text-1"
                  style={{
                    margin: "0 0 4px",
                    fontWeight: 700,
                    color: "#1d4ed8",
                  }}
                >
                  Mode Admin
                </p>
                <p
                  className="text-1"
                  style={{
                    margin: 0,
                    color: "#1e40af",
                    lineHeight: 1.5,
                  }}
                >
                  Admin dapat membuka halaman jual properti, tetapi form
                  pengajuan dikunci dan tidak bisa dikirim dari halaman ini.
                </p>
              </div>
            </div>
          )}

          {/* ✅ SECTION: PROFIL PENJUAL */}
          <SectionCard
            title="Informasi Data Pribadi Penjual"
            subtitle="Pastikan nama, nomor WhatsApp, dan foto KTP Anda sudah benar sebelum mengajukan properti"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "14px 16px",
                background: "#f0f9ff",
                borderRadius: "12px",
                border: "1px solid #bae6fd",
                marginBottom: "20px",
              }}
            >
              {userProfile?.avatar ? (
                <Image
                  src={userProfile.avatar}
                  alt="Avatar"
                  width={52}
                  height={52}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "#0891b2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1.3rem",
                    flexShrink: 0,
                  }}
                >
                  {(userProfile?.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "1.5rem",
                    color: "#0c4a6e",
                  }}
                >
                  {userProfile?.name || "—"}
                </p>
                <p style={{ margin: 0, fontSize: "1.25rem", color: "#0369a1" }}>
                  {userProfile?.email || "—"}
                </p>
              </div>
              <span
                style={{
                  background: "#0891b218",
                  color: "#0369a1",
                  borderRadius: "20px",
                  padding: "3px 12px",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Google Account
              </span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <fieldset className="box-fieldset">
                  <label>Nama Pengguna</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userProfile?.name || ""}
                    readOnly
                    style={{
                      background: "#f9fafb",
                      color: "#6b7280",
                      cursor: "not-allowed",
                    }}
                  />
                  <p className="text-muted mt-4" style={{ marginBottom: 0 }}>
                    Otomatis dari akun Google
                  </p>
                </fieldset>
              </div>

              <div className="col-md-6">
                <fieldset className="box-fieldset">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={userProfile?.email || ""}
                    readOnly
                    style={{
                      background: "#f9fafb",
                      color: "#6b7280",
                      cursor: "not-allowed",
                    }}
                  />
                  <p className="text-muted mt-4" style={{ marginBottom: 0 }}>
                    Otomatis dari akun Google
                  </p>
                </fieldset>
              </div>

              <div className="col-md-6">
                <fieldset className="box-fieldset">
                  <label>
                    Nama Lengkap <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${profileErrors.full_name ? "border-red-500" : " "}`}
                    placeholder="Contoh: Budi Santoso"
                    value={profileForm.full_name}
                    disabled={isAdminUser}
                    onChange={(e) => {
                      setProfileForm((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }));
                      if (profileErrors.full_name)
                        setProfileErrors((prev) => ({
                          ...prev,
                          full_name: null,
                        }));
                    }}
                  />
                  {profileErrors.full_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {profileErrors.full_name}
                    </p>
                  )}
                </fieldset>
              </div>

              <div className="col-md-6">
                <fieldset className="box-fieldset">
                  <label>
                    Nomor WhatsApp <span className="text-danger">*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6b7280",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    >
                      +62
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      className={`form-control ${profileErrors.phone ? "border-red-500" : " "}`}
                      placeholder="8xx-xxxx-xxxx"
                      value={profileForm.phone}
                      style={{ paddingLeft: "44px" }}
                      disabled={isAdminUser}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setProfileForm((prev) => ({ ...prev, phone: digits }));
                        if (profileErrors.phone)
                          setProfileErrors((prev) => ({
                            ...prev,
                            phone: null,
                          }));
                      }}
                    />
                  </div>
                  {profileErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {profileErrors.phone}
                    </p>
                  )}
                  <p className="text-muted mt-4" style={{ marginBottom: 0 }}>
                    Tanpa awalan 0 atau +62. Contoh: 81234567890
                  </p>
                </fieldset>
              </div>

              <div className="col-12">
                <fieldset className="box-fieldset">
                  <label>
                    Foto KTP <span className="text-danger">*</span>
                  </label>
                  {userProfile?.id_card_file_url && !profileForm.idCardFile && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "12px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <span style={{ color: "#166534", fontWeight: 600 }}>
                        KTP sudah tersimpan
                      </span>
                      <a
                        href={userProfile.id_card_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="tf-btn style-border pd-23"
                      >
                        Lihat KTP
                      </a>
                    </div>
                  )}
                  <DocUploadCard
                    label={
                      profileForm.idCardFile
                        ? "Foto KTP Baru"
                        : userProfile?.id_card_file_url
                          ? "Ganti Foto KTP"
                          : "Unggah Foto KTP"
                    }
                    file={profileForm.idCardFile}
                    preview={idCardPreview}
                    accept=".jpg,.jpeg,.png,.pdf,image/*"
                    onSelect={(e) => {
                      if (isAdminUser) return;
                      const file = e.target.files?.[0] || null;
                      const fileError = validateDocumentFile(file);
                      if (fileError) {
                        e.target.value = "";
                        setProfileForm((prev) => ({
                          ...prev,
                          idCardFile: null,
                        }));
                        setIdCardPreview(null);
                        setProfileErrors((prev) => ({
                          ...prev,
                          id_card_file: fileError.replace("dokumen", "foto KTP"),
                        }));
                        setAttention({
                          open: true,
                          message: fileError.replace("dokumen", "foto KTP"),
                        });
                        return;
                      }
                      setProfileForm((prev) => ({
                        ...prev,
                        idCardFile: file,
                      }));
                      setIdCardPreview(file ? URL.createObjectURL(file) : null);
                      if (profileErrors.id_card_file) {
                        setProfileErrors((prev) => ({
                          ...prev,
                          id_card_file: null,
                        }));
                      }
                    }}
                    onRemove={() => {
                      if (isAdminUser) return;
                      setProfileForm((prev) => ({
                        ...prev,
                        idCardFile: null,
                      }));
                      setIdCardPreview(null);
                    }}
                  />
                  {profileErrors.id_card_file && (
                    <p className="text-red-500 text-xs mt-1">
                      {profileErrors.id_card_file}
                    </p>
                  )}
                  <p className="text-muted mt-4" style={{ marginBottom: 0 }}>
                    KTP disimpan di profil penjual dan digunakan admin untuk
                    verifikasi identitas. Format JPG, PNG, atau PDF maksimal
                    {` ${DOCUMENT_MAX_SIZE_MB}MB.`}
                  </p>
                </fieldset>
              </div>

              <div className="col-12">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || isAdminUser}
                    className={`tf-btn style-border pd-23${isSavingProfile ? " is-loading" : " "}`}
                    style={{ minWidth: "160px" }}
                  >
                    {isSavingProfile && (
                      <span className="btn-spinner" aria-hidden="true" />
                    )}
                    <span>
                      {isSavingProfile ? "Menyimpan..." : "Simpan Profil"}
                    </span>
                  </button>
                  {profileSaved && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#16a34a",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                      }}
                    >
                      <svg
                        width={16}
                        height={16}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="#16a34a"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Profil berhasil disimpan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ✅ WARNING: PROFIL BELUM LENGKAP */}
          {!isAdminUser && !isProfileComplete && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                background: "#fff7ed",
                border: "1.5px solid #fb923c",
                borderRadius: "14px",
                padding: "16px 20px",
                marginBottom: "24px",
              }}
            >
              <span style={{ fontSize: "24px", flexShrink: 0, lineHeight: 1 }}>
                ⚠️
              </span>
              <div>
                <p
                  className="text-1"
                  style={{
                    margin: "0 0 4px",
                    fontWeight: 700,
                    color: "#9a3412",
                  }}
                >
                  Lengkapi Profil Terlebih Dahulu
                </p>
                <p
                  className="text-1"
                  style={{
                    margin: 0,
                    color: "#c2410c",
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Nama Lengkap</strong> dan{" "}
                  <strong>Nomor WhatsApp</strong>, serta{" "}
                  <strong>Foto KTP</strong> wajib diisi dan disimpan sebelum
                  Anda dapat mengisi form pengajuan properti. Klik{" "}
                  <strong>"Simpan Profil"</strong> di atas untuk melanjutkan.
                </p>
              </div>
            </div>
          )}

          {/* ✅ FORM UTAMA — terkunci jika profil belum lengkap */}
          <div
            style={{
              position: "relative",
              pointerEvents: isMainFormLocked ? "none" : "auto",
            }}
          >
            {isMainFormLocked && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(3px)",
                  zIndex: 10,
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingTop: "80px",
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    border: "1.5px solid #fb923c",
                    borderRadius: "12px",
                    padding: "18px 28px",
                    textAlign: "center",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
                  }}
                >
                  <p style={{ fontSize: "28px", margin: "0 0 8px" }}>🔒</p>
                  <p
                    className="text-1"
                    style={{
                      fontWeight: 700,
                      color: "#9a3412",
                      margin: "0 0 4px",
                    }}
                  >
                    {isAdminUser ? "Form Dikunci untuk Admin" : "Form Terkunci"}
                  </p>
                  <p
                    className="text-1"
                    style={{ color: "#c2410c", margin: 0 }}
                  >
                    {isAdminUser
                      ? "Admin tidak dapat mengisi pengajuan user"
                      : "Simpan profil Anda terlebih dahulu"}
                  </p>
                </div>
              </div>
            )}

            <fieldset
              disabled={isMainFormLocked}
              style={{ border: 0, margin: 0, padding: 0 }}
            >
            {/* ✅ SECTION: INFORMASI DASAR */}
            <SectionCard
              title="Informasi Dasar"
              subtitle="Data utama properti yang akan ditampilkan"
            >
              <div className="row g-3">
                <div className="col-md-6">
                  <fieldset className="box-fieldset">
                    <label>
                      Judul <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      className={`form-control ${errors.title ? "border-red-500" : " "}`}
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
                    <label>
                      Harga (Rp) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="price"
                      className={`form-control ${errors.price ? "border-red-500" : " "}`}
                      placeholder="Contoh: 500.000.000"
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
                    <label>
                      Tipe <span className="text-danger">*</span>
                    </label>
                    <DropdownSelect
                      options={["rumah", "villa", "ruko", "kos", "tanah"]}
                      selectedValue={formData.type}
                      onChange={(value) => updateField("type", value)}
                      getOptionLabel={(option) =>
                        PROPERTY_TYPE_CONFIG[option]?.label || option
                      }
                    />
                  </fieldset>
                </div>

                <div className="col-md-6">
                  <fieldset className="box-fieldset">
                    <label>{getBuildingTypeLabel(formData.type)}</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ background: "#f9fafb", color: "#6b7280" }}
                      value={buildingTypeDisplayValue}
                      readOnly
                      placeholder={getBuildingTypePlaceholder(formData.type)}
                    />
                  </fieldset>
                </div>

                <div className="col-md-6">
                  <fieldset className="box-fieldset">
                    <label>
                      Penawaran <span className="text-danger">*</span>
                    </label>
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
                          const map = {
                            Hari: "hari",
                            Minggu: "minggu",
                            "3 Bulan": "3bulan",
                            "6 Bulan": "6bulan",
                            Tahun: "tahun",
                          };
                          updateField("rent_period", map[value] || "bulan");
                        }}
                      />
                    </fieldset>
                  </div>
                )}

                <div className="col-md-6">
                  <fieldset className="box-fieldset">
                    <label>
                      Kecamatan <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="kecamatan"
                      className={`form-control bg-gray-100 ${errors.kecamatan ? "border-red-500" : " "}`}
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

                <div className="col-md-6">
                  <fieldset className="box-fieldset">
                    <label>
                      Kota <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      className={`form-control bg-gray-100 ${errors.city ? "border-red-500" : " "}`}
                      placeholder="Otomatis terisi dari lokasi peta"
                      value={formData.city}
                      readOnly
                      required
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.city[0]}
                      </p>
                    )}
                  </fieldset>
                </div>

                {showCertificate && (
                  <>
                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>
                          Status Sertifikat{" "}
                          <span className="text-danger">*</span>
                        </label>
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
                        <label>
                          Jenis Sertifikat{" "}
                          <span className="text-danger">*</span>
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
                  </>
                )}

                <div className="col-12">
                  <fieldset className="box-fieldset">
                    <label>Deskripsi</label>
                    <textarea
                      name="description"
                      className="textarea"
                      rows={3}
                      placeholder="Ceritakan keunggulan properti Anda..."
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </fieldset>
                </div>
              </div>
            </SectionCard>

            {/* ✅ SECTION: LOKASI */}
            <SectionCard
              title="Lokasi Detail"
              subtitle="Tentukan lokasi properti di peta"
            >
              <LocationPicker
                address={formData.address}
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={(next) => {
                  if (isAdminUser) return;
                  setFormData((prev) => ({ ...prev, ...next }));
                }}
              />
            </SectionCard>

            {/* ✅ SECTION: DETAIL PROPERTI */}
            <SectionCard
              title={`Detail Properti — ${PROPERTY_TYPE_CONFIG[formData.type]?.label}`}
              subtitle="Spesifikasi teknis properti"
            >
              <div className="row g-3">{renderDetailFields()}</div>
            </SectionCard>

            {/* ✅ SECTION: GAMBAR */}
            <SectionCard
              title="Gambar Properti"
              subtitle="Unggah minimal 1 foto. Klik bintang untuk jadikan foto utama."
            >
              <div className="box-uploadfile text-center mb-3">
                <div className="uploadfile">
                  <label className="tf-btn bg-color-primary pd-10 btn-upload mx-auto">
                    <svg
                      width={20}
                      height={20}
                      viewBox="0 0 21 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.625 14.375V17.1875C13.625 17.705 13.205 18.125 12.6875 18.125H4.5625C4.31386 18.125 4.0754 18.0262 3.89959 17.8504C3.72377 17.6746 3.625 17.4361 3.625 17.1875V6.5625C3.625 6.045 4.045 5.625 4.5625 5.625H6.125C6.54381 5.625 6.96192 5.65928 7.375 5.72834M13.625 14.375H16.4375C16.955 14.375 17.375 13.955 17.375 13.4375V9.375C17.375 5.65834 14.291 2.5741 10.4855 1.97834C10.7119 1.90928 10.2938 1.87472 9.875 1.875H8.3125C7.795 1.875 7.375 2.295 7.375 2.8125V5.72834M13.625 14.375H8.3125C8.06386 14.375 7.8254 14.2762 7.64959 14.1004C7.47377 13.9246 7.375 13.6861 7.375 13.4375V5.72834"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Pilih Foto
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImagesChange}
                      className="ip-file"
                    />
                  </label>
                  <p className="file-name fw-5">
                    atau seret foto ke sini <br />
                    <span>(Maks 10 foto)</span>
                  </p>
                </div>
              </div>

              {totalImages > 0 && (
                <div className="box-img-upload">
                  {formData.newImages.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className={`item-upload file-delete${primaryNewIndex === index ? " is-primary" : ""}`}
                    >
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        width={615}
                        height={405}
                      />
                      <button
                        type="button"
                        className="icon primary-toggle"
                        onClick={() => setPrimaryNewIndex(index)}
                        aria-label="Jadikan utama"
                      >
                        <svg
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
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
                        onClick={() => handleRemoveImage(index)}
                        aria-label="Hapus"
                      />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* ✅ SECTION: DOKUMEN PENDUKUNG */}
            {showCertificate && (
              <SectionCard
                title="Dokumen Pendukung"
                subtitle={`Opsional — mempercepat proses verifikasi admin. Format: PDF, JPG, PNG (Maks ${DOCUMENT_MAX_SIZE_MB}MB per file).`}
              >
                <div className="row g-3">
                  <div className="col-md-4">
                    <DocUploadCard
                      label="Sertifikat"
                      icon="📜"
                      file={formData.certificateFile}
                      preview={certificatePreview}
                      onSelect={handleFileChange(
                        "certificateFile",
                        setCertificatePreview,
                      )}
                      onRemove={handleRemoveFile(
                        "certificateFile",
                        setCertificatePreview,
                      )}
                    />
                  </div>
                  <div className="col-md-4">
                    <DocUploadCard
                      label="Tagihan Listrik"
                      icon="⚡"
                      file={formData.electricBillFile}
                      preview={electricBillPreview}
                      onSelect={handleFileChange(
                        "electricBillFile",
                        setElectricBillPreview,
                      )}
                      onRemove={handleRemoveFile(
                        "electricBillFile",
                        setElectricBillPreview,
                      )}
                    />
                  </div>
                  <div className="col-md-4">
                    <DocUploadCard
                      label="Tagihan Air"
                      icon="💧"
                      file={formData.waterBillFile}
                      preview={waterBillPreview}
                      onSelect={handleFileChange(
                        "waterBillFile",
                        setWaterBillPreview,
                      )}
                      onRemove={handleRemoveFile(
                        "waterBillFile",
                        setWaterBillPreview,
                      )}
                    />
                  </div>
                </div>
              </SectionCard>
            )}
            </fieldset>
          </div>

          {/* ✅ SUBMIT CARD — style seperti Contact.jsx */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #e5e7eb",
              padding: "24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              marginBottom: "24px",
            }}
          >
            {/* Heading */}
            <div className="heading-section" style={{ marginBottom: "20px" }}>
              <h2 className="title" style={{ marginBottom: "4px" }}>
                Kirim Pengajuan
              </h2>
              <p className="text-muted mt-4">
                Pastikan semua data sudah benar sebelum mengirim pengajuan
                properti Anda.
              </p>
            </div>

            {/* Checkbox Syarat & Ketentuan */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <input
                type="checkbox"
                id="agreeTerms"
                checked={hasAgreedToTerms}
                onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                disabled={isAdminUser}
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#2563eb",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <label
                htmlFor="agreeTerms"
                style={{
                  fontSize: "1.25rem",
                  color: "#374151",
                  cursor: "pointer",
                  lineHeight: 1, // ← line-height 1 agar tidak ada ruang vertikal
                  display: "flex", // ← flex agar teks & button dalam satu baris
                  alignItems: "center", // ← center keduanya
                  gap: "6px",
                  margin: 0,
                  flexWrap: "wrap",
                }}
              >
                <span>Saya telah membaca dan menyetujui</span>
                <button
                  type="button"
                  disabled={isAdminUser}
                  onClick={() => {
                    if (isAdminUser) return;
                    setShowTermsModal(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontWeight: 600,
                    fontSize: "1.25rem", // ← samakan dengan label
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                    lineHeight: 1,
                  }}
                >
                  Syarat &amp; Ketentuan Penjualan
                </button>
              </label>
            </div>

            {/* Button Submit — sama seperti Contact.jsx */}
            <div className="send-wrap">
              <button
                type="submit"
                className={`tf-btn fw-7 pd-8 w-100 mb-3 ${
                  isAdminUser || !isProfileComplete || !hasAgreedToTerms
                    ? "bg-secondary"
                    : "bg-color-primary"
                } ${isSubmitting ? "is-loading" : ""}`}
                disabled={
                  isSubmitting ||
                  isAdminUser ||
                  !hasAgreedToTerms ||
                  !isProfileComplete
                }
                onClick={
                  isAdminUser
                    ? (e) => {
                        e.preventDefault();
                        setAttention({
                          open: true,
                          message:
                            "Admin dapat membuka halaman ini, tetapi tidak dapat mengisi atau mengirim pengajuan properti.",
                        });
                      }
                    : !isProfileComplete
                    ? (e) => {
                        e.preventDefault();
                        setAttention({
                          open: true,
                          message:
                            "Lengkapi dan simpan profil Anda (Nama Lengkap & Nomor WhatsApp) terlebih dahulu.",
                        });
                      }
                    : !hasAgreedToTerms
                      ? (e) => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }
                      : undefined
                }
              >
                {isSubmitting && (
                  <span className="btn-spinner" aria-hidden="true" />
                )}
                <span>
                  {isSubmitting
                    ? "Mengirim..."
                    : isAdminUser
                      ? "Admin Tidak Dapat Mengirim Pengajuan"
                    : !isProfileComplete
                      ? "Lengkapi Profil Terlebih Dahulu"
                      : !hasAgreedToTerms
                        ? "Setujui Syarat & Ketentuan Terlebih Dahulu"
                        : "Kirim Pengajuan"}
                </span>
              </button>
            </div>

            {/* Text muted di bawah button */}
            <p className="text-muted mt-4 text-center">
              {isAdminUser
                ? "Admin hanya dapat melihat halaman ini. Pengajuan properti dibuat oleh user biasa."
                : !isProfileComplete
                ? "⚠️ Simpan profil Anda terlebih dahulu untuk mengaktifkan form"
                : !hasAgreedToTerms
                  ? "*Centang persetujuan di atas untuk mengaktifkan tombol kirim"
                  : "*Pengajuan Anda akan ditinjau admin sebelum tampil sebagai iklan"}
            </p>
          </div>
        </form>

        {/* ✅ TRACKER MODAL */}
        {showTracker && (
          <>
            <div className="modal fade show" style={{ display: "block" }}>
              <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content">
                  <div className="modal-header modal-header-title">
                    <h5 className="modal-title">Tracking Pengajuan Saya</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeTracker}
                      aria-label="Close"
                    />
                  </div>
                  <div
                    className="modal-body modal-body-wide"
                    style={{ maxHeight: "75vh", overflowY: "auto" }}
                  >
                    {loadingSubmissions ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-500">
                          Memuat data pengajuan anda...
                        </p>
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="mb-3">
                          📌 Anda belum memiliki pengajuan properti.
                        </p>
                        <p className="text-sm">
                          Mulai dengan mengisi form pengajuan di atas untuk
                          melanjutkan.
                        </p>
                      </div>
                    ) : (
                      <div className="wrap-table">
                        <div className="table-responsive">
                          <table>
                            <thead>
                              <tr>
                                <th>Properti</th>
                                <th>Tipe</th>
                                <th>Harga</th>
                                <th>Status</th>
                                <th>Diajukan</th>
                                <th>Keterangan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {submissions.map((item) => (
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
                                          <span className="link">
                                            {item.title}
                                          </span>
                                        </div>
                                        <div className="text-date">
                                          {item.kecamatan}, {item.city}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="text-sm text-gray-600">
                                      {item.type || "-"}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="font-semibold text-blue-600">
                                      {formatTrackerPriceDisplay(item)}
                                    </span>
                                  </td>
                                  <td>{getTrackerStatusBadge(item)}</td>
                                  <td>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                      {formatTrackerDate(item.created_at)}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="text-sm text-gray-600">
                                      {item.is_verified ? (
                                        <>
                                          <strong>Disetujui</strong>
                                          <div className="text-xs text-gray-500">
                                            Diperbarui{" "}
                                            {formatTrackerDate(item.updated_at)}
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <strong>Ditinjau</strong>
                                          <div className="text-xs text-gray-500">
                                            Menunggu verifikasi admin
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show" onClick={closeTracker} />
          </>
        )}
      </div>
    </section>
  );
}
