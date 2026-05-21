export const JEMBER_DISTRICTS = [
  "Ajung",
  "Ambulu",
  "Arjasa",
  "Balung",
  "Bangsalsari",
  "Gumukmas",
  "Jelbuk",
  "Jenggawah",
  "Jombang",
  "Kalisat",
  "Kaliwates",
  "Kencong",
  "Ledokombo",
  "Mayang",
  "Mumbulsari",
  "Panti",
  "Pakusari",
  "Patrang",
  "Puger",
  "Rambipuji",
  "Semboro",
  "Silo",
  "Sukorambi",
  "Sukowono",
  "Sumberbaru",
  "Sumberjambe",
  "Sumbersari",
  "Tanggul",
  "Tempurejo",
  "Umbulsari",
  "Wuluhan",
];

const normalizeDistrictName = (value) =>
  String(value || "")
    .replace(/^(Kecamatan|Kec\.?)\s+/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const findJemberDistrict = (...values) => {
  const normalizedText = values
    .filter(Boolean)
    .map((value) => normalizeDistrictName(value))
    .join(",");

  return (
    JEMBER_DISTRICTS.find((district) =>
      normalizedText.includes(normalizeDistrictName(district)),
    ) || ""
  );
};
