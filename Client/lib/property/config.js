import { OPTIONS } from "./constants";

export const CERTIFICATE_REQUIRED_TYPES = ["rumah", "villa", "ruko", "tanah"];

export const PROPERTY_TYPE_CONFIG = {
  rumah: {
    label: "Rumah",
    fields: [
      { name: "luas_tanah", label: "Luas Tanah (m²)", type: "number", required: true, col: 4 },
      { name: "luas_bangunan", label: "Luas Bangunan (m²)", type: "number", required: true, col: 4 },
      { name: "floors", label: "Jumlah Lantai", type: "number", required: true, col: 4 },
      { name: "bedrooms", label: "Kamar Tidur", type: "number", required: true, col: 3 },
      { name: "bathrooms", label: "Kamar Mandi", type: "number", required: true, col: 3 },
      { name: "kitchens", label: "Dapur", type: "number", col: 3 },
      { name: "living_rooms", label: "Ruang Tamu", type: "number", col: 3 },
      { name: "electricity_capacity", label: "Daya Listrik (VA)", type: "number", col: 6 },
      { name: "listrik_type", label: "Tipe Listrik", type: "select", options: OPTIONS.listrik, col: 6 },
      { name: "wifi_provider", label: "Penyedia WiFi", type: "text", col: 6 },
      { name: "water", label: "Sumber Air", type: "select", options: OPTIONS.water, col: 6 },
      { name: "carport", label: "Garasi Terbuka", type: "checkbox", col: 3 },
      { name: "garden", label: "Taman", type: "checkbox", col: 3 },
      { name: "one_gate_system", label: "Sistem Satu Gerbang", type: "checkbox", col: 3 },
      { name: "security_24jam", label: "Keamanan 24 Jam", type: "checkbox", col: 3 },
    ],
  },
  villa: {
    label: "Villa",
    fields: [
      { name: "luas_tanah", label: "Luas Tanah (m²)", type: "number", required: true, col: 4 },
      { name: "luas_bangunan", label: "Luas Bangunan (m²)", type: "number", required: true, col: 4 },
      { name: "floors", label: "Jumlah Lantai", type: "number", required: true, col: 4 },
      { name: "bedrooms", label: "Kamar Tidur", type: "number", required: true, col: 3 },
      { name: "bathrooms", label: "Kamar Mandi", type: "number", required: true, col: 3 },
      { name: "kitchens", label: "Dapur", type: "number", col: 3 },
      { name: "living_rooms", label: "Ruang Tamu", type: "number", col: 3 },
      { name: "electricity_capacity", label: "Daya Listrik (VA)", type: "number", col: 6 },
      { name: "listrik_type", label: "Tipe Listrik", type: "select", options: OPTIONS.listrik, col: 6 },
      { name: "wifi_provider", label: "Penyedia WiFi", type: "text", col: 6 },
      { name: "water", label: "Sumber Air", type: "select", options: OPTIONS.water, col: 6 },
      { name: "view_type", label: "Pemandangan", type: "text", col: 6 },
      { name: "carport", label: "Garasi Terbuka", type: "checkbox", col: 3 },
      { name: "garden", label: "Taman", type: "checkbox", col: 3 },
      { name: "one_gate_system", label: "Sistem Satu Gerbang", type: "checkbox", col: 3 },
      { name: "security_24jam", label: "Keamanan 24 Jam", type: "checkbox", col: 3 },
      { name: "swimming_pool", label: "Kolam Renang", type: "checkbox", col: 3 },
      { name: "private_pool", label: "Kolam Pribadi", type: "checkbox", col: 3 },
      { name: "furnished", label: "Furnitur Lengkap", type: "checkbox", col: 3 },
      { name: "near_tourism", label: "Dekat Wisata", type: "checkbox", col: 3 },
    ],
  },
  kos: {
    label: "Kos/Kost",
    fields: [
      { name: "panjang_ruangan", label: "Panjang Ruangan (m)", type: "number", required: true, col: 6 },
      { name: "lebar_ruangan", label: "Lebar Ruangan (m)", type: "number", required: true, col: 6 },
      { name: "total_rooms", label: "Jumlah Kamar", type: "number", required: true, col: 6 },
      { name: "bathrooms", label: "Kamar Mandi", type: "number", required: true, col: 6 },
      { name: "bathroom_position", label: "Kamar Mandi (Dalam/Luar)", type: "select", options: ["dalam", "luar"], col: 6 },
      { name: "gender_type", label: "Tipe Gender", type: "select", options: OPTIONS.gender, col: 6 },
      { name: "water", label: "Sumber Air", type: "select", options: OPTIONS.water, col: 6 },
      { name: "wifi_provider", label: "Penyedia WiFi", type: "text", col: 6 },
      { name: "wifi_included", label: "Termasuk WiFi", type: "checkbox", col: 6 },
      { name: "electricity_included", label: "Termasuk Listrik", type: "checkbox", col: 6 },
      { name: "water_included", label: "Termasuk Air", type: "checkbox", col: 6 },
      { name: "shared_kitchen", label: "Dapur Bersama", type: "checkbox", col: 6 },
      { name: "parking_area", label: "Area Parkir", type: "checkbox", col: 6 },
      { name: "cctv", label: "Ada CCTV", type: "checkbox", col: 6 },
    ],
  },
  ruko: {
    label: "Ruko",
    fields: [
      { name: "luas_tanah", label: "Luas Tanah (m²)", type: "number", required: true, col: 6 },
      { name: "luas_bangunan", label: "Luas Bangunan (m²)", type: "number", required: true, col: 6 },
      { name: "bedrooms", label: "Kamar Tidur", type: "number", col: 6 },
      { name: "bathrooms", label: "Kamar Mandi", type: "number", col: 6 },
      { name: "parking_capacity", label: "Kapasitas Parkir (mobil)", type: "number", col: 6 },
      { name: "warehouse_area", label: "Luas Gudang (m²)", type: "number", col: 6 },
      { name: "shop_front_width", label: "Lebar Depan (m²)", type: "number", col: 6 },
      { name: "water", label: "Sumber Air", type: "select", options: OPTIONS.water, col: 6 },
      { name: "electricity_capacity", label: "Daya Listrik (VA)", type: "number", col: 6 },
      { name: "listrik_type", label: "Tipe Listrik", type: "select", options: OPTIONS.listrik, col: 6 },
      { name: "wifi_provider", label: "Penyedia WiFi", type: "text", col: 6 },
    ],
  },
  tanah: {
    label: "Tanah",
    fields: [
      { name: "panjang_tanah", label: "Panjang Tanah (m)", type: "number", required: true, col: 6 },
      { name: "lebar_tanah", label: "Lebar Tanah (m)", type: "number", required: true, col: 6 },
      { name: "road_access", label: "Akses Jalan", type: "select", required: true, col: 6, options: OPTIONS.jalan },
      { name: "land_type", label: "Kondisi Tanah", type: "select", col: 6, options: OPTIONS.tanah },
      { name: "land_contour", label: "Kontur Tanah", type: "text", col: 6 },
      { name: "zoning", label: "Peruntukan Lahan", type: "text", col: 6 },
    ],
  },
};

// ✅ Helper aman
export const getPropertyConfig = (type) => PROPERTY_TYPE_CONFIG[type] || PROPERTY_TYPE_CONFIG.rumah;

export const getAutoBuildingType = (property) => {
  if (!property) return "";

  const type = property.type;
  const detail = property.detail || {};
  const luasTanah = String(detail.luas_tanah ?? "").trim();
  const luasBangunan = String(detail.luas_bangunan ?? "").trim();

  if (type === "tanah") {
    const panjang = Number(detail.panjang_tanah ?? 0);
    const lebar = Number(detail.lebar_tanah ?? 0);
    const luasTanahOtomatis = panjang * lebar;
    if (luasTanahOtomatis > 0) {
      return String(Math.round(luasTanahOtomatis));
    }
    return luasTanah;
  }
  if (type === "kos") {
    const panjang = Number(detail.panjang_ruangan ?? 0);
    const lebar = Number(detail.lebar_ruangan ?? 0);
    const luasRuangan = panjang * lebar;
    return luasRuangan > 0 ? String(luasRuangan) : "";
  }
  if (["rumah", "villa", "ruko"].includes(type) && luasTanah && luasBangunan) {
    return `${luasBangunan}/${luasTanah}`;
  }

  return "";
};

export const getBuildingTypeDisplay = (property) =>
  getAutoBuildingType(property) || property?.building_type || "";

export const getBuildingTypePlaceholder = (type) => {
  if (type === "tanah") return "Otomatis: Panjang x Lebar Tanah";
  if (type === "kos") return "Otomatis: Panjang x Lebar Ruangan";
  return "Otomatis: Luas Bangunan / Luas Tanah";
};

export const getBuildingTypeLabel = (type) => {
  if (type === "kos") return "Luas Ruangan";
  if (type === "tanah") return "Luas Tanah";
  return "Tipe Bangunan";
};

const DETAIL_DEFAULTS = {
  water: "pdam",
  listrik_type: "overground",
  road_access: "aspal",
  bathroom_position: "dalam",
  gender_type: "laki-laki",
  land_type: "datar",
  panjang_tanah: null,
  lebar_tanah: null,
};

// ✅ Filter field sesuai tipe
export const getRelevantDetailFields = (type, detail) => {
  const config = getPropertyConfig(type);
  const fields = config.fields.map((f) => f.name);
  const filtered = {};

  fields.forEach((key) => {
    filtered[key] = detail[key] ?? DETAIL_DEFAULTS[key] ?? null;
  });

  if (type === "tanah") {
    filtered.luas_tanah = getAutoBuildingType({ type, detail }) || detail.luas_tanah || null;
  }

  return filtered;
};

