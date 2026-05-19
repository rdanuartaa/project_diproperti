import { CERTIFICATE_REQUIRED_TYPES, getAutoBuildingType, getRelevantDetailFields } from "./config";

export const validatePropertyForm = (formData) => {
  const requiredMain = ["title", "price", "type", "listing_type", "status", "city", "kecamatan"];
  if (CERTIFICATE_REQUIRED_TYPES.includes(formData.type) && formData.listing_type !== "sewa") {
  requiredMain.push("certificate_type");
}
if (formData.type === "kos" && formData.listing_type !== "sewa") {
    return "Properti Kos hanya tersedia untuk disewakan (Sewa).";
  }
  for (const field of requiredMain) {
    if (!String(formData[field] ?? "").trim()) return "Semua data wajib diisi dan tidak boleh kosong.";
  }
  if (formData.type === "kos") {
    if (!String(formData.detail.panjang_ruangan ?? "").trim()) return "Panjang ruangan wajib diisi.";
    if (!String(formData.detail.lebar_ruangan ?? "").trim()) return "Lebar ruangan wajib diisi.";
  } else if (formData.type === "tanah") {
    if (!String(formData.detail.panjang_tanah ?? "").trim()) return "Panjang tanah wajib diisi.";
    if (!String(formData.detail.lebar_tanah ?? "").trim()) return "Lebar tanah wajib diisi.";
  } else if (!String(formData.detail.luas_tanah ?? "").trim()) {
    return "Luas tanah wajib diisi.";
  }
  if (formData.type === "ruko" && !String(formData.detail.luas_bangunan ?? "").trim()) {
    return "Luas bangunan ruko wajib diisi.";
  }
  const totalImages = (formData.existingImages?.length || 0) + (formData.newImages?.length || 0);
  if (totalImages < 1) return "Minimal unggah 1 gambar.";
  return null;
};

export const buildJsonPayload = (formData) => {
  const { type, detail } = formData;
  const buildingType = formData.building_type || getAutoBuildingType(formData);
  const payload = {
    title: formData.title,
    price: Number(formData.price),
    type,
    building_type: buildingType || null,
    listing_type: formData.listing_type,
    ...(formData.listing_type === "sewa" && formData.rent_period ? { rent_period: formData.rent_period } : {}),
    kecamatan: formData.kecamatan,
    city: formData.city,
    address: formData.address || null,
    latitude: formData.latitude ? Number(formData.latitude) : null,
    longitude: formData.longitude ? Number(formData.longitude) : null,
    status: formData.status,
    description: formData.description,
    detail: getRelevantDetailFields(type, detail),
  };

  if (CERTIFICATE_REQUIRED_TYPES.includes(type) && formData.listing_type !== "sewa") {
  payload.certificate_type = formData.certificate_type;
  payload.certificate_status = formData.certificate_status;
}
  return payload;
};

export const buildFormDataPayload = (formData, primaryIndex = null) => {
  const fd = new FormData();
  const { type } = formData;
  const buildingType = formData.building_type || getAutoBuildingType(formData);

  fd.append("title", formData.title);
  fd.append("price", Number(formData.price));
  fd.append("type", type);
  if (buildingType) fd.append("building_type", buildingType);
  fd.append("listing_type", formData.listing_type);
  if (formData.listing_type === "sewa" && formData.rent_period) fd.append("rent_period", formData.rent_period);
  fd.append("kecamatan", formData.kecamatan);
  fd.append("city", formData.city);
  if (formData.address) fd.append("address", formData.address);
  if (formData.latitude) fd.append("latitude", formData.latitude);
  if (formData.longitude) fd.append("longitude", formData.longitude);
  fd.append("description", formData.description || "");
  if (formData.status) fd.append("status", formData.status);

    if (CERTIFICATE_REQUIRED_TYPES.includes(type) && formData.listing_type !== "sewa") {
    fd.append("certificate_type", formData.certificate_type);
    fd.append("certificate_status", formData.certificate_status);
    }

  // Detail
  const detail = getRelevantDetailFields(type, formData.detail);
  Object.entries(detail).forEach(([k, v]) => fd.append(`detail[${k}]`, v ?? ""));

  // Images
  formData.newImages?.forEach((file) => fd.append("images[]", file));
  if (primaryIndex !== null) fd.append("primary_new_index", primaryIndex);
  else if (formData.newImages?.length > 0) fd.append("primary_new_index", 0);
  formData.imagesToDelete?.forEach((id) => fd.append("images_to_delete[]", id));

  // Dokumen (khusus user form)
  if (formData.certificateFile) fd.append("certificate_file", formData.certificateFile);
  if (formData.electricBillFile) fd.append("electric_bill_file", formData.electricBillFile);
  if (formData.waterBillFile) fd.append("water_bill_file", formData.waterBillFile);

  return fd;
};
