export const OPTIONS = {
  water: ["pdam", "sumur"],
  listrik: ["overground", "underground"],
  jalan: ["aspal", "cor", "batu", "belum"],
  tanah: ["datar", "miring", "bukit"],
  gender: ["laki-laki", "perempuan", "campuran"],
  sertifikat: ["SHM", "SHGB"],
  sertifikatStatus: ["lunas", "bank"],
  listingType: ["jual", "sewa"],
  propertyStatus: ["draft", "published", "sold"],
  propertyType: ["rumah", "villa", "ruko", "kos", "tanah"],
  rentPeriod: [
    { label: "Hari", value: "hari" },
    { label: "Minggu", value: "minggu" },
    { label: "Bulan", value: "bulan" },
    { label: "3 Bulan", value: "3bulan" },
    { label: "6 Bulan", value: "6bulan" },
    { label: "Tahun", value: "tahun" },
  ],
};

export const PROPERTY_VALUE_LABELS = {
  water: {
    pdam: "PDAM",
    sumur: "Sumur",
  },
  listrik_type: {
    overground: "Listrik Tiang",
    underground: "Listrik Bawah Tanah",
  },
  road_access: {
    aspal: "Aspal",
    cor: "Cor",
    batu: "Batu",
    belum: "Belum Ada",
  },
  land_type: {
    datar: "Datar",
    miring: "Miring",
    bukit: "Bukit",
  },
  bathroom_position: {
    dalam: "Dalam",
    luar: "Luar",
  },
  gender_type: {
    "laki-laki": "Laki-Laki",
    perempuan: "Perempuan",
    campuran: "Campuran",
  },
  certificate_status: {
    lunas: "Lunas",
    bank: "Bank",
  },
  listing_type: {
    jual: "Dijual",
    sewa: "Disewakan",
  },
  status: {
    draft: "Pending",
    published: "Ditampilkan",
    sold: "Terjual",
  },
};

export const formatPropertyValue = (fieldName, value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";

  const stringValue = String(value);
  if (fieldName === "view_type") {
    return stringValue.replace(/^view\b/i, "Pemandangan");
  }

  return (
    PROPERTY_VALUE_LABELS[fieldName]?.[stringValue] ||
    stringValue
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("-")
  );
};
