import { getPropertyConfig } from "./config";

const FIELD_LABELS = {
  luas_tanah: "m²",
  luas_bangunan: "LB",
  floors: "Lantai",
  bedrooms: "KT",
  bathrooms: "KM",
  kitchens: "Dapur",
  living_rooms: "R. Tamu",
  electricity_capacity: "VA",
  listrik_type: "Listrik",
  wifi_provider: "WiFi",
  water: "Air",
  view_type: "View",
  panjang_ruangan: "Panjang",
  lebar_ruangan: "Lebar",
  panjang_tanah: "Panjang",
  lebar_tanah: "Lebar",
  total_rooms: "Kamar",
  bathroom_position: "KM",
  gender_type: "Gender",
  parking_capacity: "Parkir",
  parking_area: "Parkir",
  warehouse_area: "Gudang",
  shop_front_width: "Lebar",
  road_access: "Akses",
  land_type: "Tanah",
  land_contour: "Kontur",
  zoning: "Zona",
  room_size: "m²",
  building_type: "m²",
};

const FIELD_SUFFIXES = {
  luas_tanah: "m²",
  luas_bangunan: "m²",
  electricity_capacity: "VA",
  panjang_ruangan: "m",
  lebar_ruangan: "m",
  panjang_tanah: "m",
  lebar_tanah: "m",
  parking_capacity: " mobil",
  warehouse_area: "m²",
  shop_front_width: "m",
  room_size: "",
};

const PRIMARY_FIELDS_BY_TYPE = {
  rumah: ["bedrooms", "bathrooms", "building_type"],
  villa: ["bedrooms", "bathrooms", "building_type"],
  kos: ["gender_type", "bathroom_position", "room_size"],
  ruko: ["parking_capacity", "warehouse_area", "building_type"],
  tanah: ["panjang_tanah", "lebar_tanah", "luas_tanah"],
};

const SEWA_FIELDS_BY_TYPE = {
  rumah: ["bedrooms", "bathrooms", "building_type"],
  villa: ["bedrooms", "bathrooms", "building_type"],
  kos: ["gender_type", "bathroom_position", "room_size"],
  ruko: ["parking_capacity", "warehouse_area", "building_type"],
  tanah: ["panjang_tanah", "lebar_tanah", "luas_tanah"],
};

const TITLE_CASE_FIELDS = new Set([
  "bathroom_position",
  "gender_type",
  "water",
  "listrik_type",
  "road_access",
  "land_type",
]);

function formatLabel(field) {
  return FIELD_LABELS[field.name || field.key] || field.label || field.name;
}

function formatValue(value, key) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (TITLE_CASE_FIELDS.has(key)) {
    return String(value)
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("-");
  }
  return String(value);
}

function getRoomSize(property) {
  const panjang = Number(property?.detail?.panjang_ruangan ?? 0);
  const lebar = Number(property?.detail?.lebar_ruangan ?? 0);
  if (panjang > 0 && lebar > 0) {
    const area = panjang * lebar;
    return Number.isInteger(area) ? String(area) : String(Number(area.toFixed(2)));
  }
  return property?.building_type;
}

function getFieldValue(property, key) {
  if (key === "room_size") return getRoomSize(property);
  if (key === "building_type") {
    return (
      property?.building_type ??
      property?.detail?.luas_bangunan ??
      property?.detail?.luas_tanah
    );
  }
  if (key === "price_period") return property?.price_period || property?.rent_period;
  return property?.detail?.[key] ?? property?.[key];
}

export function getPropertyCardMetaItems(property, maxItems = 3) {
  const type = property?.type || "rumah";
  const config = getPropertyConfig(type);
  const configFields = config.fields || [];
  const preferredKeys =
    property?.listing_type === "sewa"
      ? SEWA_FIELDS_BY_TYPE[type] || PRIMARY_FIELDS_BY_TYPE[type] || []
      : PRIMARY_FIELDS_BY_TYPE[type] || [];

  const fieldsByName = new Map(configFields.map((field) => [field.name, field]));
  const orderedFields = [
    ...preferredKeys.map((key) => fieldsByName.get(key) || { name: key }),
    ...configFields.filter((field) => !preferredKeys.includes(field.name)),
  ];

  const detailItems = orderedFields.map((field) => {
    const key = field.name;
    const value = formatValue(getFieldValue(property, key), key);
    return {
      key,
      label: formatLabel(field),
      suffix: FIELD_SUFFIXES[key] || "",
      value,
    };
  });

  return detailItems.slice(0, maxItems);
}
